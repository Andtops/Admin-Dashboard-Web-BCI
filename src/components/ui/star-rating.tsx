"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (!readonly) {
      setHoverRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div 
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;
          const isPartiallyFilled = starValue - 0.5 <= displayRating && displayRating < starValue;

          return (
            <button
              key={index}
              type="button"
              className={cn(
                "relative transition-colors duration-150",
                !readonly && "hover:scale-110 cursor-pointer",
                readonly && "cursor-default"
              )}
              onClick={() => handleStarClick(starValue)}
              onMouseEnter={() => handleStarHover(starValue)}
              disabled={readonly}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-colors duration-150",
                  isFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : isPartiallyFilled
                    ? "fill-yellow-200 text-yellow-400"
                    : hoverRating >= starValue && !readonly
                    ? "fill-yellow-300 text-yellow-400"
                    : "text-gray-300"
                )}
              />
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="text-sm font-medium text-muted-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface StarDisplayProps {
  rating: number;
  totalReviews?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  showCount?: boolean;
  className?: string;
}

export function StarDisplay({
  rating,
  totalReviews,
  size = "md",
  showValue = true,
  showCount = true,
  className,
}: StarDisplayProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= rating;
          const isPartiallyFilled = starValue - 0.5 <= rating && rating < starValue;

          return (
            <Star
              key={index}
              className={cn(
                sizeClasses[size],
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : isPartiallyFilled
                  ? "fill-yellow-200 text-yellow-400"
                  : "text-gray-300"
              )}
            />
          );
        })}
      </div>
      
      {showValue && (
        <span className="text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
      
      {showCount && totalReviews !== undefined && (
        <span className="text-sm text-muted-foreground">
          ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}

interface RatingDistributionProps {
  distribution: Record<number, number>;
  totalReviews: number;
  className?: string;
}

export function RatingDistribution({
  distribution,
  totalReviews,
  className,
}: RatingDistributionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

        return (
          <div key={rating} className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 w-12">
              <span className="font-medium">{rating}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-muted-foreground w-8 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}