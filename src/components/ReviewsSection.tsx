import { ReviewItem } from "@/components/ReviewItem";
import type { TmdbReview } from "@/lib/tmdb/types";

export function ReviewsSection({ reviews }: { reviews: TmdbReview[] }) {
  return (
    <div className="glass-card space-y-4 rounded-2xl p-5">
      <h3 className="font-display text-lg text-foreground">Online Reviews</h3>
      {reviews.length === 0 ? (
        <p className="text-sm text-muted">
          No online reviews found yet. Your personal review can be the first one in your diary.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
