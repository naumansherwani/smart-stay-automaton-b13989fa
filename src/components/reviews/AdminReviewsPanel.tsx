import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X } from "lucide-react";
import { toast } from "sonner";

const AdminReviewsPanel = () => {
  const [reviews, setReviews] = useState<any[]>([]);

  const fetch = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setReviews(data);
  };

  useEffect(() => { fetch(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Review ${status}`);
    fetch();
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300",
    approved: "bg-green-500/20 text-green-300",
    rejected: "bg-red-500/20 text-red-300",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Review Moderation</h3>
      {reviews.length === 0 && <p className="text-muted-foreground text-sm">No reviews yet.</p>}
      {reviews.map((r) => (
        <div key={r.id} className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground text-sm">{r.reviewer_name}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-[hsl(38,92%,55%)] text-[hsl(38,92%,55%)]" />
                ))}
              </div>
            </div>
            <Badge className={statusColor[r.status] || ""}>{r.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{r.review_text}</p>
          <div className="flex gap-2 pt-1">
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
      ))}
    </div>
  );
};

export default AdminReviewsPanel;
