// Owner Mailbox: Zoho IMAP receive + SMTP send for Founder OS
// deno-lint-ignore-file no-explicit-any
import { ImapFlow } from "npm:imapflow@1.0.164";
import nodemailer from "npm:nodemailer@6.9.14";
import { simpleParser } from "npm:mailparser@3.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZOHO_EMAIL = Deno.env.get("ZOHO_EMAIL") || "naumansherwani@hostflowai.live";
const ZOHO_APP_PASSWORD = Deno.env.get("ZOHO_APP_PASSWORD") || "";
const ZOHO_REGION = (Deno.env.get("ZOHO_REGION") || "").toLowerCase().trim();

const REGION_HOSTS: Record<string, { imap: string; smtp: string }> = {
  com: { imap: "imap.zoho.com", smtp: "smtp.zoho.com" },
  eu:  { imap: "imap.zoho.eu",  smtp: "smtp.zoho.eu" },
  in:  { imap: "imap.zoho.in",  smtp: "smtp.zoho.in" },
  au:  { imap: "imap.zoho.com.au", smtp: "smtp.zoho.com.au" },
};

function pickHosts() {
  if (ZOHO_REGION && REGION_HOSTS[ZOHO_REGION]) return [REGION_HOSTS[ZOHO_REGION]];
  // try common regions in order
  return [REGION_HOSTS.com, REGION_HOSTS.eu, REGION_HOSTS.in];
}

function imapClient(host: string) {
  return new ImapFlow({
    host,
    port: 993,
    secure: true,
    auth: { user: ZOHO_EMAIL, pass: ZOHO_APP_PASSWORD },
    logger: false,
  });
}

function smtpTransport(host: string) {
  return nodemailer.createTransport({
    host,
    port: 465,
    secure: true,
    auth: { user: ZOHO_EMAIL, pass: ZOHO_APP_PASSWORD },
  });
}

async function connectImap() {
  let lastErr: any = null;
  for (const h of pickHosts()) {
    try {
      const c = imapClient(h.imap);
      await c.connect();
      return { client: c, host: h };
    } catch (e) {
      lastErr = e;
      console.warn(`IMAP connect failed on ${h.imap}: ${(e as any)?.message}`);
    }
  }
  throw new Error(`Could not connect to Zoho IMAP. Verify (1) email is correct, (2) you generated an App-Specific Password in Zoho (Settings → Security → App Passwords) — regular passwords don't work, (3) IMAP is enabled in Zoho Mail Settings. Last error: ${lastErr?.message || lastErr}`);
}

const FOLDER_MAP: Record<string, string> = {
  inbox: "INBOX",
  sent: "Sent",
  drafts: "Drafts",
  spam: "Spam",
  trash: "Trash",
  archive: "Archive",
};

async function listMessages(folderKey: string, limit = 50, search?: string) {
  const folder = FOLDER_MAP[folderKey] || "INBOX";
  const { client } = await connectImap();
  const out: any[] = [];
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      const status = await client.status(folder, { messages: true, unseen: true });
      const total = status.messages || 0;
      if (total === 0) return { messages: [], unread: 0, total: 0 };

      let uids: number[] = [];
      if (search && search.trim()) {
        const found = await client.search({ or: [{ subject: search }, { from: search }, { body: search }] }, { uid: true });
        uids = (found || []).slice(-limit).reverse();
      } else {
        const seq = `${Math.max(1, total - limit + 1)}:*`;
        for await (const msg of client.fetch(seq, { uid: true, envelope: true, flags: true, bodyStructure: true, internalDate: true })) {
          out.push({
            uid: msg.uid,
            subject: msg.envelope?.subject || "(no subject)",
            from: msg.envelope?.from?.[0] ? { name: msg.envelope.from[0].name || "", address: msg.envelope.from[0].address || "" } : { name: "", address: "" },
            to: (msg.envelope?.to || []).map((a: any) => ({ name: a.name || "", address: a.address || "" })),
            date: msg.envelope?.date || msg.internalDate,
            unread: !msg.flags?.has?.("\\Seen"),
            starred: msg.flags?.has?.("\\Flagged") || false,
            hasAttachment: msg.bodyStructure ? hasAttachments(msg.bodyStructure) : false,
            preview: "",
          });
        }
        out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { messages: out, unread: status.unseen || 0, total };
      }

      // Search path
      for (const uid of uids) {
        const msg: any = await client.fetchOne(uid, { uid: true, envelope: true, flags: true, internalDate: true }, { uid: true });
        if (!msg) continue;
        out.push({
          uid: msg.uid,
          subject: msg.envelope?.subject || "(no subject)",
          from: msg.envelope?.from?.[0] ? { name: msg.envelope.from[0].name || "", address: msg.envelope.from[0].address || "" } : { name: "", address: "" },
          to: (msg.envelope?.to || []).map((a: any) => ({ name: a.name || "", address: a.address || "" })),
          date: msg.envelope?.date || msg.internalDate,
          unread: !msg.flags?.has?.("\\Seen"),
          starred: msg.flags?.has?.("\\Flagged") || false,
          hasAttachment: false,
          preview: "",
        });
      }
      return { messages: out, unread: status.unseen || 0, total };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

function hasAttachments(node: any): boolean {
  if (!node) return false;
  if (node.disposition === "attachment") return true;
  if (Array.isArray(node.childNodes)) return node.childNodes.some(hasAttachments);
  return false;
}

async function getMessage(folderKey: string, uid: number) {
  const folder = FOLDER_MAP[folderKey] || "INBOX";
  const { client } = await connectImap();
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      const msg: any = await client.fetchOne(uid, { source: true, envelope: true, flags: true, internalDate: true }, { uid: true });
      if (!msg) return null;
      const parsed = await simpleParser(msg.source);
      // Mark seen
      try { await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true }); } catch {}
      return {
        uid: msg.uid,
        subject: parsed.subject || msg.envelope?.subject || "(no subject)",
        from: parsed.from?.value?.[0] || { name: "", address: "" },
        to: parsed.to?.value || [],
        cc: parsed.cc?.value || [],
        date: parsed.date || msg.internalDate,
        html: parsed.html || null,
        text: parsed.text || "",
        attachments: (parsed.attachments || []).map((a: any) => ({ filename: a.filename, size: a.size, contentType: a.contentType })),
      };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

async function modifyFlags(folderKey: string, uid: number, add?: string[], remove?: string[]) {
  const folder = FOLDER_MAP[folderKey] || "INBOX";
  const { client } = await connectImap();
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      if (add?.length) await client.messageFlagsAdd(uid, add, { uid: true });
      if (remove?.length) await client.messageFlagsRemove(uid, remove, { uid: true });
    } finally { lock.release(); }
  } finally { await client.logout().catch(() => {}); }
  return { ok: true };
}

async function moveMessage(fromFolderKey: string, toFolderKey: string, uid: number) {
  const from = FOLDER_MAP[fromFolderKey] || "INBOX";
  const to = FOLDER_MAP[toFolderKey] || "Trash";
  const { client } = await connectImap();
  try {
    const lock = await client.getMailboxLock(from);
    try {
      await client.messageMove(uid, to, { uid: true });
    } finally { lock.release(); }
  } finally { await client.logout().catch(() => {}); }
  return { ok: true };
}

async function sendMail(payload: { to: string; cc?: string; bcc?: string; subject: string; html: string; text?: string; replyTo?: string; inReplyTo?: string; references?: string }) {
  let lastErr: any = null;
  for (const h of pickHosts()) {
    try {
      const transporter = smtpTransport(h.smtp);
      const info = await transporter.sendMail({
    from: { name: "HostFlow AI · Nauman Sherwani", address: ZOHO_EMAIL },
    to: payload.to,
    cc: payload.cc,
    bcc: payload.bcc,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    inReplyTo: payload.inReplyTo,
    references: payload.references,
    replyTo: payload.replyTo,
      });
      // Try to append to Sent folder
      try {
        const { client } = await connectImap();
        try {
          const raw = await buildRaw(payload);
          await client.append("Sent", raw, ["\\Seen"]);
        } finally { await client.logout().catch(() => {}); }
      } catch (e) { console.warn("append-to-sent failed", (e as any)?.message); }
      return { ok: true, messageId: info.messageId, smtpHost: h.smtp };
    } catch (e) { lastErr = e; console.warn(`SMTP send failed on ${h.smtp}: ${(e as any)?.message}`); }
  }
  throw new Error(`Send failed across regions. Verify App Password + IMAP/SMTP enabled in Zoho. Last error: ${lastErr?.message || lastErr}`);
}

async function buildRaw(p: { to: string; cc?: string; subject: string; html: string }) {
  const headers = [
    `From: HostFlow AI · Nauman Sherwani <${ZOHO_EMAIL}>`,
    `To: ${p.to}`,
    p.cc ? `Cc: ${p.cc}` : "",
    `Subject: ${p.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    "",
    p.html,
  ].filter(Boolean).join("\r\n");
  return headers;
}

async function counts() {
  const { client } = await connectImap();
  const result: Record<string, { total: number; unread: number }> = {};
  try {
    for (const [k, name] of Object.entries(FOLDER_MAP)) {
      try {
        const s = await client.status(name, { messages: true, unseen: true });
        result[k] = { total: s.messages || 0, unread: s.unseen || 0 };
      } catch { result[k] = { total: 0, unread: 0 }; }
    }
  } finally { await client.logout().catch(() => {}); }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!ZOHO_APP_PASSWORD) {
      return new Response(JSON.stringify({ error: "ZOHO_APP_PASSWORD is not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { action, ...body } = await req.json();
    let data: any = null;
    switch (action) {
      case "list": data = await listMessages(body.folder || "inbox", body.limit || 50, body.search); break;
      case "get": data = await getMessage(body.folder || "inbox", body.uid); break;
      case "send": data = await sendMail(body); break;
      case "flag": data = await modifyFlags(body.folder, body.uid, body.add, body.remove); break;
      case "move": data = await moveMessage(body.from, body.to, body.uid); break;
      case "counts": data = await counts(); break;
      default: return new Response(JSON.stringify({ error: "unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("owner-mailbox error:", e?.message, e?.stack);
    return new Response(JSON.stringify({ ok: false, error: e?.message || "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});