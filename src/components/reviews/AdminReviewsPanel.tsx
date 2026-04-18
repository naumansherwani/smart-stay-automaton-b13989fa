import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Globe2, Bot, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const AdminReviewsPanel = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "auto_rejected">("all");

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setReviews(data);
  };

  useEffect(() => { fetchReviews(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Review ${status}`);
    fetchReviews();
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-300 border-green-500/30",
    rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  const aiBadgeColor: Record<string, string> = {
    approve: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    reject: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };

  const filtered = reviews.filter((r) => {
    if (filter === "all") return true;
    if (filter === "auto_rejected") return r.is_auto_rejected;
    return r.status === filter;
  });

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
    auto_rejected: reviews.filter((r) => r.is_auto_rejected).length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-foreground">Review Moderation</h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {([
            ["all", "All"],
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
            ["auto_rejected", "AI Auto-Rejected"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                filter === key
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-white/[0.03] text-muted-foreground border-white/[0.08] hover:bg-white/[0.06]"
              }`}
            >
              {label} <span className="opacity-60">({counts[key]})</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground text-sm">No reviews in this view.</p>
      )}

      {filtered.map((r) => (
        <div key={r.id} className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground text-sm">{r.reviewer_name}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-[hsl(38,92%,55%)] text-[hsl(38,92%,55%)]" />
                ))}
              </div>
              {r.region && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5">
                  <Globe2 className="w-3 h-3" />
                  {r.region}{r.country_code ? ` · ${r.country_code}` : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {r.is_auto_rejected && (
                <Badge className="bg-red-600/20 text-red-300 border-red-600/40 gap-1">
                  <ShieldAlert className="w-3 h-3" /> AI auto-rejected
                </Badge>
              )}
              <Badge className={statusColor[r.status] || ""}>{r.status}</Badge>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{r.review_text}</p>

          {(r.ai_decision || r.ai_reason) && (
            <div className="flex items-start gap-2 text-xs">
              <Bot className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
              <div className="flex flex-wrap items-center gap-2">
                {r.ai_decision && (
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-wide font-semibold ${aiBadgeColor[r.ai_decision] || "bg-white/[0.04] border-white/10 text-muted-foreground"}`}>
                    AI: {r.ai_decision}
                  </span>
                )}
                {r.ai_reason && (
                  <span className="text-muted-foreground italic">"{r.ai_reason}"</span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <span className="text-[11px] text-muted-foreground">
              {new Date(r.created_at).toLocaleString()}
            </span>
            <div className="flex gap-2">
              {r.status !== "approved" && (
                <Button size="sm" variant="outline" className="h-7 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10"
                  onClick={() => updateStatus(r.id, "approved")}>
                  <Check className="w-3 h-3 mr-1" /> Approve
                </Button>
              )}
              {r.status !== "rejected" && (
                <Button size="sm" variant="outline" className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={() => updateStatus(r.id, "rejected")}>
                  <X className="w-3 h-3 mr-1" /> Reject
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminReviewsPanel;
