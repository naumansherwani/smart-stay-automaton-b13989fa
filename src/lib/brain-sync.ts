const BRAIN_URL = "https://294617d8-2084-4895-8e41-8e7fdf1efde4-00-37kl744l50epn.riker.replit.dev/api";

let es: EventSource | null = null;

export function connectBrainStream() {
  if (es) return;

  es = new EventSource(`${BRAIN_URL}/v1/stream?client_id=lovable-main`);

  es.addEventListener("connected", (e) => {
    console.log("[Brain] Live:", JSON.parse(e.data));
  });

  es.addEventListener("handoff_ack", (e) => {
    console.log("[Brain] Handoff confirmed:", JSON.parse(e.data));
    window.dispatchEvent(new CustomEvent("hf:handoff_ack", { detail: JSON.parse(e.data) }));
  });

  es.addEventListener("manifest_synced", (e) => {
    console.log("[Brain] State synced:", JSON.parse(e.data));
    window.dispatchEvent(new CustomEvent("hf:manifest_synced", { detail: JSON.parse(e.data) }));
  });

  es.addEventListener("brain_update", (e) => {
    console.log("[Brain] Update received:", JSON.parse(e.data));
    window.dispatchEvent(new CustomEvent("hf:brain_update", { detail: JSON.parse(e.data) }));
  });

  es.onerror = () => {
    es?.close();
    es = null;
    setTimeout(connectBrainStream, 3000);
  };
}

export function pushToBrain(event: string, data: Record<string, unknown>) {
  fetch(`${BRAIN_URL}/v1/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, data, source: "lovable" }),
  }).catch(() => {});
}