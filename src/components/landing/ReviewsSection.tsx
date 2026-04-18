import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ReviewCard from "@/components/reviews/ReviewCard";

const ReviewsSection = () => {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6);
      if (data) setReviews(data);
    };
    fetchReviews();
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[hsl(222,47%,8%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(174,62%,50%,0.05),transparent_60%)]" />

      <div className="container relative z-10 space-y-14">
        <div className="text-center space-y-4">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
            Real User Reviews
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white">
            What Our{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)]">
              Verified Users
            </span>{" "}
            Say
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-lg">
            Honest experiences from people who use HostFlow AI every day to run their business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>

        <div className="text-center">
          <Link to="/reviews">
            <Button variant="outline" className="border-white/10 text-white/70 hover:text-white">
              See All Reviews <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
