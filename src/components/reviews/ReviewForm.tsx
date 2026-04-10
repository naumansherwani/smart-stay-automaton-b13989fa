import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ReviewFormProps {
  existingReview?: any;
  onSuccess?: () => void;
}

const ReviewForm = ({ existingReview, onSuccess }: ReviewFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState(existingReview?.reviewer_name || "");
  const [text, setText] = useState(existingReview?.review_text || "");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-8 space-y-4 bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
        <p className="text-muted-foreground">Log in to submit a review</p>
        <Button onClick={() => navigate("/login")} variant="outline">Login</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a rating"); return; }
    if (!name.trim() || name.trim().length > 100) { toast.error("Name is required (max 100 chars)"); return; }
    if (!text.trim() || text.trim().length > 1000) { toast.error("Review text is required (max 1000 chars)"); return; }

    setLoading(true);
    try {
      if (existingReview) {
        const { error } = await supabase.from("reviews").update({
          reviewer_name: name.trim(),
          rating,
          review_text: text.trim(),
          status: "pending",
        }).eq("id", existingReview.id);
        if (error) throw error;
        toast.success("Review updated! It will appear after admin approval.");
      } else {
        const { error } = await supabase.from("reviews").insert({
          user_id: user.id,
          reviewer_name: name.trim(),
          rating,
          review_text: text.trim(),
        });
        if (error) {
          if (error.code === "23505") { toast.error("You have already submitted a review"); return; }
          throw error;
        }
        toast.success("Review submitted! It will appear after admin approval.");
      }
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-foreground">
        {existingReview ? "Edit Your Review" : "Write a Review"}
      </h3>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5"
          >
            <Star className={`w-6 h-6 transition-colors ${
              star <= (hoverRating || rating)
                ? "fill-[hsl(38,92%,55%)] text-[hsl(38,92%,55%)]"
                : "text-white/20"
            }`} />
          </button>
        ))}
      </div>

      <Input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={100}
        className="bg-white/[0.05] border-white/[0.1]"
      />

      <Textarea
        placeholder="Share your experience..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        rows={4}
        className="bg-white/[0.05] border-white/[0.1]"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{text.length}/1000</span>
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;
