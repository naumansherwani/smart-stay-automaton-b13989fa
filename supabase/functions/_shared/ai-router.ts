// Smart AI router: OpenAI (ChatGPT) primary → Gemini Pro fallback.
// Single source of truth so multiple edge functions don't reimplement provider logic.
//
// Env vars expected:
//   OPENAI_API_KEY  – primary provider (ChatGPT)
//   GEMINI_API_KEY  – secondary provider (Google Gemini)
//   LOVABLE_API_KEY – last-resort fallback (only used if both above are missing)
//
// Routing rules (override per-call via opts.task):
//   "chat" | "crm" | "sales" | "multilingual" | "reasoning"  → OpenAI primary
//   "long_context" | "document" | "vision"                   → Gemini primary
//   On 429 / 402 / 5xx from primary → automatic failover to the other provider.

export type RouterTask =
  | "chat" | "crm" | "sales" | "multilingual" | "reasoning"
  | "long_context" | "document" | "vision" | "fast";

export interface ChatMsg {
  role: "system" | "user" | "assistant";
  content: any;
}

export interface RouterOpts {
  messages: ChatMsg[];
  task?: RouterTask;
  hasImages?: boolean;
  deepReasoning?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
  // Optional Supabase client to log usage
  supabase?: any;
  userId?: string | null;
  feature?: string; // e.g. "founder_adviser"
}

export interface RouterResult {
  text: string;
  provider: "openai" | "gemini" | "lovable";
  model: string;
  failoverUsed: boolean;
  usage?: { prompt?: number; completion?: number; total?: number };
}

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

// Rate limit: simple in-memory token bucket per provider per instance.
// (Edge function instances are short-lived; this protects bursts within one warm instance.)
const RATE: Record<string, { tokens: number; updatedAt: number; perMin: number }> = {
  openai: { tokens: 60, updatedAt: Date.now(), perMin: 60 },
  gemini: { tokens: 60, updatedAt: Date.now(), perMin: 60 },
  lovable: { tokens: 30, updatedAt: Date.now(), perMin: 30 },
};

function takeToken(provider: keyof typeof RATE): boolean {
  const r = RATE[provider];
  const now = Date.now();
  const refill = ((now - r.updatedAt) / 60000) * r.perMin;
  r.tokens = Math.min(r.perMin, r.tokens + refill);
  r.updatedAt = now;
  if (r.tokens >= 1) { r.tokens -= 1; return true; }
  return false;
}

function pickPrimary(task?: RouterTask, hasImages?: boolean): "openai" | "gemini" {
  if (hasImages) return "gemini"; // Gemini Pro handles vision well and is cheaper
  switch (task) {
    case "long_context":
    case "document":
    case "vision":
      return "gemini";
    case "chat":
    case "crm":
    case "sales":
    case "multilingual":
    case "reasoning":
    case "fast":
    default:
      return "openai";
  }
}

function openaiModel(opts: RouterOpts): string {
  if (opts.deepReasoning) return Deno.env.get("OPENAI_MODEL_REASONING") || "gpt-4o";
  if (opts.hasImages) return Deno.env.get("OPENAI_MODEL_VISION") || "gpt-4o";
  return Deno.env.get("OPENAI_MODEL_FAST") || "gpt-4o-mini";
}

function geminiModel(opts: RouterOpts): string {
  // Latest Gemini Pro family.
  if (opts.deepReasoning || opts.task === "long_context" || opts.task === "document") {
    return Deno.env.get("GEMINI_MODEL_PRO") || "gemini-2.5-pro";
  }
  return Deno.env.get("GEMINI_MODEL_FAST") || "gemini-2.5-flash";
}

async function callOpenAI(opts: RouterOpts): Promise<RouterResult> {
  if (!OPENAI_KEY) throw Object.assign(new Error("openai_no_key"), { status: 0 });
  if (!takeToken("openai")) throw Object.assign(new Error("rate_limited_local"), { status: 429 });
  const model = openaiModel(opts);
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.6,
      max_tokens: opts.maxOutputTokens,
    }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw Object.assign(new Error(`openai_${r.status}: ${t.slice(0, 200)}`), { status: r.status });
  }
  const j = await r.json();
  const text = j?.choices?.[0]?.message?.content ?? "";
  return {
    text, provider: "openai", model, failoverUsed: false,
    usage: { prompt: j?.usage?.prompt_tokens, completion: j?.usage?.completion_tokens, total: j?.usage?.total_tokens },
  };
}

async function callGemini(opts: RouterOpts): Promise<RouterResult> {
  if (!GEMINI_KEY) throw Object.assign(new Error("gemini_no_key"), { status: 0 });
  if (!takeToken("gemini")) throw Object.assign(new Error("rate_limited_local"), { status: 429 });
  const model = geminiModel(opts);

  // Convert OpenAI-style messages → Gemini contents.
  let systemInstruction: any = undefined;
  const contents: any[] = [];
  for (const m of opts.messages) {
    if (m.role === "system") {
      const t = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
      systemInstruction = { role: "system", parts: [{ text: t }] };
      continue;
    }
    const role = m.role === "assistant" ? "model" : "user";
    if (typeof m.content === "string") {
      contents.push({ role, parts: [{ text: m.content }] });
    } else if (Array.isArray(m.content)) {
      // OpenAI multimodal array → Gemini parts
      const parts = m.content.map((p: any) => {
        if (p.type === "text") return { text: p.text };
        if (p.type === "image_url") {
          const url = p.image_url?.url || "";
          if (url.startsWith("data:")) {
            const [meta, data] = url.split(",");
            const mime = meta.match(/data:(.*?);base64/)?.[1] || "image/png";
            return { inlineData: { mimeType: mime, data } };
          }
          return { text: `[image:${url}]` };
        }
        return { text: JSON.stringify(p) };
      });
      contents.push({ role, parts });
    } else {
      contents.push({ role, parts: [{ text: JSON.stringify(m.content) }] });
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
  const body: any = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.6,
      maxOutputTokens: opts.maxOutputTokens ?? 4096,
    },
  };
  if (systemInstruction) body.systemInstruction = systemInstruction;

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw Object.assign(new Error(`gemini_${r.status}: ${t.slice(0, 200)}`), { status: r.status });
  }
  const j = await r.json();
  const text = (j?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("");
  return {
    text, provider: "gemini", model, failoverUsed: false,
    usage: {
      prompt: j?.usageMetadata?.promptTokenCount,
      completion: j?.usageMetadata?.candidatesTokenCount,
      total: j?.usageMetadata?.totalTokenCount,
    },
  };
}

async function logUsage(opts: RouterOpts, res: RouterResult, errorMsg?: string) {
  if (!opts.supabase) return;
  try {
    await opts.supabase.from("ai_usage_logs").insert({
      user_id: opts.userId ?? null,
      feature: opts.feature ?? "unknown",
      provider: res.provider,
      model: res.model,
      task: opts.task ?? "chat",
      failover_used: res.failoverUsed,
      prompt_tokens: res.usage?.prompt ?? null,
      completion_tokens: res.usage?.completion ?? null,
      total_tokens: res.usage?.total ?? null,
      error: errorMsg ?? null,
    });
  } catch { /* table may not exist yet — non-fatal */ }
}

/**
 * Smart-route a chat completion. Tries the primary provider for the task; on
 * 429 / 402 / 5xx (or missing key) it transparently fails over to the other
 * provider. Throws only if BOTH providers fail.
 */
export async function routeChat(opts: RouterOpts): Promise<RouterResult> {
  const primary = pickPrimary(opts.task, opts.hasImages);
  const tryOrder: Array<"openai" | "gemini"> = primary === "openai" ? ["openai", "gemini"] : ["gemini", "openai"];

  let lastErr: any = null;
  for (let i = 0; i < tryOrder.length; i++) {
    const provider = tryOrder[i];
    try {
      const res = provider === "openai" ? await callOpenAI(opts) : await callGemini(opts);
      res.failoverUsed = i > 0;
      await logUsage(opts, res);
      return res;
    } catch (e: any) {
      lastErr = e;
      const status = e?.status ?? 0;
      // Fail over on auth/quota/server errors and missing-key. Don't fail over on 4xx validation (other than 429/402/401/403).
      const failoverable = status === 0 || status === 401 || status === 402 || status === 403 || status === 429 || status >= 500;
      if (!failoverable) break;
      console.warn(`[ai-router] ${provider} failed (status=${status}), trying next…`, e?.message);
    }
  }

  // Both failed — try Lovable gateway as last resort if available.
  if (LOVABLE_KEY) {
    try {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: opts.messages,
          temperature: opts.temperature ?? 0.6,
        }),
      });
      if (r.ok) {
        const j = await r.json();
        const text = j?.choices?.[0]?.message?.content ?? "";
        const res: RouterResult = { text, provider: "lovable", model: "google/gemini-3-flash-preview", failoverUsed: true,
          usage: { prompt: j?.usage?.prompt_tokens, completion: j?.usage?.completion_tokens, total: j?.usage?.total_tokens } };
        await logUsage(opts, res);
        return res;
      }
    } catch (e) {
      console.warn("[ai-router] lovable last-resort failed", (e as any)?.message);
    }
  }

  await logUsage(opts, { text: "", provider: (primary as any), model: "n/a", failoverUsed: true }, lastErr?.message);
  throw lastErr ?? new Error("All AI providers failed");
}

export function providerStatus() {
  return {
    openai_configured: !!OPENAI_KEY,
    gemini_configured: !!GEMINI_KEY,
    lovable_configured: !!LOVABLE_KEY,
  };
}