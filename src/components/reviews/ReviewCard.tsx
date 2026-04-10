import { Star, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ReviewCardProps {
  review: {
    reviewer_name: string;
    rating: number;
    review_text: string;
    created_at: string;
  };
}

const AVATAR_COLORS = [
  "from-[hsl(174,62%,50%)] to-[hsl(190,80%,55%)]",
  "from-[hsl(0,72%,55%)] to-[hsl(25,95%,55%)]",
  "from-[hsl(217,91%,60%)] to-[hsl(190,80%,55%)]",
  "from-[hsl(300,80%,65%)] to-[hsl(270,80%,65%)]",
  "from-[hsl(270,80%,65%)] to-[hsl(217,91%,60%)]",
  "from-[hsl(38,92%,55%)] to-[hsl(25,95%,55%)]",
];

const ReviewCard = ({ review }: ReviewCardProps) => {
  const initials = review.reviewer_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colorIdx =
    review.reviewer_name.charCodeAt(0) % AVATAR_COLORS.length;

  return (
    <Card className="bg-white/[0.03] border-white/[0.06] hover:border-white/15 backdrop-blur-sm transition-all duration-500 group hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(45,212,191,0.1)]">
      <CardContent className="p-7 space-y-5">
        <div className="flex items-center gap-1">
          {Array.from({ length: review.rating }).map((_, j) => (
            <Star key={j} className="w-4 h-4 fill-[hsl(38,92%,55%)] text-[hsl(38,92%,55%)]" />
          ))}
          {Array.from({ length: 5 - review.rating }).map((_, j) => (
            <Star key={`e-${j}`} className="w-4 h-4 text-white/10" />
          ))}
        </div>

        <p className="text-sm text-white/70 leading-relaxed">"{review.review_text}"</p>

        <div className="flex items-center gap-3 pt-2">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[colorIdx]} flex items-center justify-center text-white text-xs font-bold`}>
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-white text-sm">{review.reviewer_name}</p>
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-xs text-white/40">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
          <span className="ml-auto px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-medium text-primary">
            Verified
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
