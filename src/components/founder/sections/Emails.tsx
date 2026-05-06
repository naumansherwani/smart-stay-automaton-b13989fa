import { useEffect, useMemo, useState } from "react";
import {
  Inbox as InboxIcon, Star, AlertTriangle, Send as SendIcon, FileText, Clock, Archive, Trash2, ShieldAlert,
  Search, RefreshCw, Pencil, Reply, Forward, MailOpen, MoreHorizontal, Paperclip, CornerUpLeft, Loader2,
  Building2, LifeBuoy, Receipt, Sparkles
} from "lucide-react";
import { useOwnerMailbox, MailFolder, MailDetail, MailIdentity, MAIL_IDENTITIES } from "@/hooks/useOwnerMailbox";
import ComposeModal, { ComposeInitial } from "@/components/founder/email/ComposeModal";

const FOLDERS: { id: MailFolder; label: string; icon: any }[] = [
  { id: "inbox", label: "Inbox", icon: InboxIcon },
  { id: "priority", label: "Priority", icon: AlertTriangle },
  { id: "unread", label: "Unread", icon: MailOpen },
  { id: "starred", label: "Starred", icon: Star },
  { id: "sent", label: "Sent", icon: SendIcon },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "scheduled", label: "Scheduled", icon: Clock },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "spam", label: "Spam", icon: ShieldAlert },
  { id: "trash", label: "Trash", icon: Trash2 },
];

type IdentityFilter = "all" | MailIdentity;

const IDENTITY_TABS: { id: IdentityFilter; label: string; icon: any; color: string; address?: string }[] = [
  { id: "all",        label: "All",        icon: InboxIcon, color: "var(--fos-muted)" },
  { id: "advisor",    label: "AI Advisor", icon: Sparkles,  color: "#06B6D4", address: "connectai@hostflowai.net" },
  { id: "support",    label: "Support",    icon: LifeBuoy,  color: "#10B981", address: "support@hostflowai.net" },
  { id: "billing",    label: "Billing",    icon: Receipt,   color: "#3B82F6", address: "billing@hostflowai.net" },
  { id: "general",    label: "Founder",    icon: Building2, color: "#8B5CF6", address: "naumansherwani@hostflowai.net" },
];

const IDENTITY_META: Record<MailIdentity, { label: string; color: string }> = {
  advisor:    { label: "AI Advisor", color: "#06B6D4" },
  enterprise: { label: "Enterprise Sales", color: "#F59E0B" },
  support:    { label: "Support",    color: "#10B981" },
  billing:    { label: "Billing",    color: "#3B82F6" },
  general:    { label: "Founder",    color: "#8B5CF6" },
};

function relTime(d: string | Date) {
  const dt = new Date(d);
  const now = Date.now();
  const diff = now - dt.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h";
  const days = Math.floor(h / 24);
  if (days < 7) return days + "d";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function Emails() {
  const [folder, setFolder] = useState<MailFolder>("inbox");
  const [identityFilter, setIdentityFilter] = useState<IdentityFilter>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [detail, setDetail] = useState<MailDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeInitial, setComposeInitial] = useState<ComposeInitial | undefined>();

  const mb = useOwnerMailbox(folder, search);

  useEffect(() => { setSelectedUid(null); setDetail(null); }, [folder]);
  useEffect(() => { setSelectedUid(null); setDetail(null); }, [identityFilter]);

  const visibleMessages = useMemo(() => {
    if (identityFilter === "all") return mb.messages;
    return mb.messages.filter((m) => (m.identity || "general") === identityFilter);
  }, [mb.messages, identityFilter]);

  const identityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: mb.messages.length };
    for (const id of ["advisor","support","billing","general"]) counts[id] = 0;
    for (const m of mb.messages) {
      const k = m.identity || "general";
      counts[k] = (counts[k] || 0) + 1;
    }
    return counts;
  }, [mb.messages]);

  useEffect(() => {
    if (selectedUid == null) { setDetail(null); return; }
    let cancelled = false;
    setLoadingDetail(true);
    mb.fetchOne(selectedUid).then((d) => { if (!cancelled) setDetail(d); }).finally(() => { if (!cancelled) setLoadingDetail(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUid]);

  const folderCount = (id: MailFolder) => {
    const remoteMap: Record<string, string> = { priority: "inbox", unread: "inbox", starred: "inbox", scheduled: "drafts" };
    const key = remoteMap[id] || id;
    return mb.counts[key]?.unread ?? 0;
  };

  const openCompose = (init?: ComposeInitial) => { setComposeInitial(init); setComposeOpen(true); };

  const handleReply = () => {
    if (!detail) return;
    // Use the identity the original mail was addressed to as the From identity
    const replyFromIdentity = (detail.identity && detail.identity !== "general") ? detail.identity : undefined;
    openCompose({
      to: detail.from?.address || "",
      subject: detail.subject?.startsWith("Re:") ? detail.subject : `Re: ${detail.subject}`,
      body: `\n\n--- On ${new Date(detail.date).toLocaleString()} ${detail.from?.name || detail.from?.address} wrote ---\n${detail.text || ""}`,
      replyContext: detail.text || "",
      fromIdentity: replyFromIdentity,
    });
  };

  const handleForward = () => {
    if (!detail) return;
    const replyFromIdentity = (detail.identity && detail.identity !== "general") ? detail.identity : undefined;
    openCompose({
      subject: detail.subject?.startsWith("Fwd:") ? detail.subject : `Fwd: ${detail.subject}`,
      body: `\n\n--- Forwarded message ---\nFrom: ${detail.from?.name || ""} <${detail.from?.address}>\nDate: ${new Date(detail.date).toLocaleString()}\nSubject: ${detail.subject}\n\n${detail.text || ""}`,
      fromIdentity: replyFromIdentity,
    });
  };

  return (
    <>
      <div className="founder-card overflow-hidden flex flex-col lg:flex-row h-[calc(100vh-180px)] min-h-[600px]">
        {/* Folders sidebar */}
        <div className="w-full lg:w-[200px] shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--fos-border)] flex flex-col">
          <div className="p-3 border-b border-[var(--fos-border)]">
            <button
              onClick={() => openCompose()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--fos-accent)] text-[#0B1120] text-xs font-semibold hover:opacity-90"
            >
              <Pencil className="w-3.5 h-3.5" /> Compose
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {FOLDERS.map((f) => {
              const Icon = f.icon;
              const active = folder === f.id;
              const unread = folderCount(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => setFolder(f.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all ${
                    active ? "bg-[var(--fos-accent)]/10 text-[var(--fos-accent)]" : "text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-bg)]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 text-left">{f.label}</span>
                  {unread > 0 && f.id === "inbox" && (
                    <span className="text-[10px] tabular-nums text-[var(--fos-accent)] font-semibold">{unread}</span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t border-[var(--fos-border)] space-y-1.5">
            <div className="text-[9px] uppercase tracking-wider text-[var(--fos-muted)] mb-1">Identities</div>
            {MAIL_IDENTITIES.map((id) => {
              const meta = IDENTITY_META[id.id as MailIdentity];
              return (
                <div key={id.id} className="flex items-center gap-2 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
                  <span className="truncate text-[var(--fos-muted)]">{id.address}</span>
                </div>
              );
            })}
            <div className={`mt-1.5 text-[10px] ${mb.error ? "text-[var(--fos-danger)]" : "text-[var(--fos-success)]"}`}>
              ● Zoho · {mb.error ? "Connection issue" : "Connected"}
            </div>
            {mb.error && <p className="text-[10px] text-[var(--fos-muted)] leading-relaxed">Mailbox needs a valid Zoho inbox connection before messages can load.</p>}
          </div>
        </div>

        {/* List column */}
        <div className="w-full lg:w-[360px] shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--fos-border)] flex flex-col min-h-0">
          <div className="p-3 border-b border-[var(--fos-border)] flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--fos-bg)] border border-[var(--fos-border)]">
              <Search className="w-3.5 h-3.5 text-[var(--fos-muted)]" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput); }}
                placeholder="Search mail"
                className="flex-1 bg-transparent text-xs text-[var(--fos-text)] outline-none placeholder:text-[var(--fos-muted)]/50"
              />
            </div>
            <button onClick={() => mb.refresh()} className="p-1.5 rounded-lg text-[var(--fos-muted)] hover:text-[var(--fos-accent)] hover:bg-[var(--fos-bg)]" title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${mb.loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {/* Identity tabs */}
          <div className="px-2 py-2 border-b border-[var(--fos-border)] flex items-center gap-1 overflow-x-auto">
            {IDENTITY_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = identityFilter === tab.id;
              const count = identityCounts[tab.id] ?? 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setIdentityFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-all border ${
                    active
                      ? "bg-[var(--fos-accent)]/10 border-[var(--fos-accent)]/40 text-[var(--fos-text)]"
                      : "border-transparent text-[var(--fos-muted)] hover:text-[var(--fos-text)]"
                  }`}
                  title={tab.address || "All identities"}
                >
                  <Icon className="w-3 h-3" style={{ color: tab.color }} />
                  {tab.label}
                  {count > 0 && <span className="text-[9px] tabular-nums opacity-70">{count}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto">
            {mb.loading && visibleMessages.length === 0 && (
              <div className="p-8 text-center text-[var(--fos-muted)] text-xs">Loading mailbox…</div>
            )}
            {mb.error && !mb.loading && (
              <div className="p-6 text-center text-[var(--fos-muted)] text-xs border-b border-[var(--fos-border)]/50">
                <p className="text-[var(--fos-text)] font-medium mb-1">Mailbox unavailable</p>
                <p>{mb.error}</p>
              </div>
            )}
            {!mb.loading && !mb.error && visibleMessages.length === 0 && (
              <div className="p-8 text-center text-[var(--fos-muted)] text-xs">
                {identityFilter === "all" ? "No messages." : `No ${IDENTITY_META[identityFilter as MailIdentity]?.label || ""} messages.`}
              </div>
            )}
            {visibleMessages.map((m) => {
              const active = selectedUid === m.uid;
              const idMeta = IDENTITY_META[(m.identity || "general") as MailIdentity];
              return (
                <button
                  key={m.uid}
                  onClick={() => setSelectedUid(m.uid)}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--fos-border)]/50 transition-colors ${
                    active ? "bg-[var(--fos-accent)]/10" : "hover:bg-[var(--fos-bg)]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {m.unread && <span className="w-1.5 h-1.5 rounded-full bg-[var(--fos-accent)] shrink-0" />}
                    <span className={`text-[12px] truncate flex-1 ${m.unread ? "text-[var(--fos-text)] font-semibold" : "text-[var(--fos-muted)]"}`}>
                      {m.from?.name || m.from?.address || "Unknown"}
                    </span>
                    {idMeta && (
                      <span
                        className="text-[8px] uppercase tracking-wider px-1 py-0.5 rounded font-bold border"
                        style={{ color: idMeta.color, borderColor: idMeta.color + "55", background: idMeta.color + "15" }}
                      >
                        {idMeta.label}
                      </span>
                    )}
                    {m.hasAttachment && <Paperclip className="w-3 h-3 text-[var(--fos-muted)] shrink-0" />}
                    <span className="text-[10px] text-[var(--fos-muted)] shrink-0 tabular-nums">{relTime(m.date)}</span>
                  </div>
                  <div className={`text-[12px] truncate ${m.unread ? "text-[var(--fos-text)] font-medium" : "text-[var(--fos-muted)]"}`}>
                    {m.subject || "(no subject)"}
                  </div>
                </button>
              );
            })}
          </div>
          {mb.lastSync && (
            <div className="px-4 py-2 text-[10px] text-[var(--fos-muted)]/70 border-t border-[var(--fos-border)]">
              Last sync {mb.lastSync.toLocaleTimeString("en-GB")}
            </div>
          )}
        </div>

        {/* Reading pane */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {!selectedUid && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <InboxIcon className="w-10 h-10 text-[var(--fos-muted)]/40 mb-3" />
              <h3 className="text-[var(--fos-text)] font-semibold mb-1">Owner Inbox</h3>
              <p className="text-[var(--fos-muted)] text-xs max-w-sm">Native Zoho-connected mailbox. Read, reply, compose, and use the AI email assistant — all without leaving HostFlow AI.</p>
            </div>
          )}
          {selectedUid && (
            <>
              <div className="px-6 py-4 border-b border-[var(--fos-border)] flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[var(--fos-text)] font-semibold text-base truncate">{detail?.subject || "Loading…"}</h2>
                  {detail && (
                    <div className="mt-1 text-xs text-[var(--fos-muted)] flex items-center gap-2 flex-wrap">
                      <span className="text-[var(--fos-text)] font-medium">{detail.from?.name || detail.from?.address}</span>
                      <span>&lt;{detail.from?.address}&gt;</span>
                      <span>·</span>
                      <span>{new Date(detail.date).toLocaleString("en-GB")}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={handleReply} className="p-2 rounded-lg text-[var(--fos-muted)] hover:text-[var(--fos-accent)] hover:bg-[var(--fos-bg)]" title="Reply"><Reply className="w-4 h-4" /></button>
                  <button onClick={handleForward} className="p-2 rounded-lg text-[var(--fos-muted)] hover:text-[var(--fos-accent)] hover:bg-[var(--fos-bg)]" title="Forward"><Forward className="w-4 h-4" /></button>
                  <button onClick={() => detail && mb.moveTo(detail.uid, "archive")} className="p-2 rounded-lg text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-bg)]" title="Archive"><Archive className="w-4 h-4" /></button>
                  <button onClick={() => detail && mb.moveTo(detail.uid, "trash")} className="p-2 rounded-lg text-[var(--fos-muted)] hover:text-[var(--fos-danger)] hover:bg-[var(--fos-bg)]" title="Trash"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {loadingDetail && <div className="flex items-center gap-2 text-[var(--fos-muted)] text-xs"><Loader2 className="w-3 h-3 animate-spin" /> Loading message…</div>}
                {detail && (
                  <>
                    {detail.html ? (
                      <iframe
                        title="email"
                        srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Inter,Arial,sans-serif;color:#111827;font-size:14px;line-height:1.6;padding:0;margin:0}img{max-width:100%;height:auto}</style></head><body>${detail.html}</body></html>`}
                        sandbox=""
                        className="w-full min-h-[400px] bg-white rounded-lg border border-[var(--fos-border)]"
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm text-[var(--fos-text)] font-sans leading-relaxed">{detail.text}</pre>
                    )}
                    {detail.attachments?.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-[var(--fos-border)]">
                        <div className="text-[10px] uppercase tracking-wider text-[var(--fos-muted)] mb-2">{detail.attachments.length} Attachment{detail.attachments.length > 1 ? "s" : ""}</div>
                        <div className="flex flex-wrap gap-2">
                          {detail.attachments.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--fos-bg)] border border-[var(--fos-border)] text-xs text-[var(--fos-text)]">
                              <Paperclip className="w-3 h-3" /> {a.filename || "file"}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="px-6 py-3 border-t border-[var(--fos-border)] flex items-center gap-2">
                <button onClick={handleReply} className="px-3 py-1.5 rounded-lg bg-[var(--fos-accent)] text-[#0B1120] text-xs font-semibold flex items-center gap-1.5 hover:opacity-90">
                  <CornerUpLeft className="w-3.5 h-3.5" /> Reply
                </button>
                <button onClick={handleForward} className="px-3 py-1.5 rounded-lg bg-[var(--fos-bg)] border border-[var(--fos-border)] text-[var(--fos-text)] text-xs font-medium flex items-center gap-1.5 hover:border-[var(--fos-accent)]">
                  <Forward className="w-3.5 h-3.5" /> Forward
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSend={mb.send}
        initial={composeInitial}
      />
    </>
  );
}
