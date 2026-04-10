import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewCard from "@/components/reviews/ReviewCard";
import { Star } from "lucide-react";

const Reviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [myReview, setMyReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (data) setReviews(data);

    if (user) {
      const { data: mine } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setMyReview(mine);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-24 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground">
            User Reviews
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= Math.round(Number(avgRating))
                      ? "fill-[hsl(38,92%,55%)] text-[hsl(38,92%,55%)]"
                      : "text-white/20"
                  }`}
                />
              ))}
            </div>
            <span className="text-xl font-bold text-foreground">{avgRating}</span>
            <span className="text-muted-foreground">({reviews.length} reviews)</span>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            All reviews are from verified, logged-in users and approved by our team.
          </p>
        </div>

        {/* My review status */}
        {myReview && myReview.status === "pending" && (
          <div className="max-w-xl mx-auto p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center text-sm text-yellow-300">
            Your review is pending admin approval.
          </div>
        )}

        {/* Review Form */}
        <div className="max-w-xl mx-auto">
          <ReviewForm existingReview={myReview} onSuccess={fetchAll} />
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No reviews yet. Be the first to review!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Reviews;
