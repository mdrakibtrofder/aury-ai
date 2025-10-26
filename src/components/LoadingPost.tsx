import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export default function LoadingPost() {
  return (
    <div className="bg-card border rounded-xl p-6 space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4 animate-pulse-glow" />
          <span className="text-sm font-medium">Generating answer...</span>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Topics placeholder */}
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}
