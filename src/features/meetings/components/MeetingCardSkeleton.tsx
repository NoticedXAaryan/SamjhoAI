import { Skeleton } from '@/components/ui/skeleton';

export function MeetingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/40 p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24 bg-white/10" />
          <Skeleton className="h-5 w-40 bg-white/10" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 flex-1 rounded-md bg-white/10" />
        <Skeleton className="h-8 w-8 rounded-md bg-white/10" />
      </div>
    </div>
  );
}
