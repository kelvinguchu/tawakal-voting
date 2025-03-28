import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Loading skeleton for an individual poll card
export function PollCardSkeleton() {
  return (
    <Card className='h-full flex flex-col hover:shadow-sm transition-shadow'>
      <CardHeader className='pb-2 border-b'>
        <Skeleton className='h-5 w-3/4' />
        <Skeleton className='h-3 w-1/2 mt-2' />
      </CardHeader>
      <CardContent className='pt-4 pb-3 flex-grow flex flex-col'>
        <Skeleton className='h-4 w-full mt-1' />
        <Skeleton className='h-4 w-5/6 mt-1' />
        <Skeleton className='h-4 w-4/6 mt-1' />
        <Skeleton className='h-9 w-full mt-auto' />
      </CardContent>
    </Card>
  );
}

// Loading state for a grid of polls
export function PollsLoading() {
  return (
    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <PollCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Empty state placeholder
export function EmptyPollsState({
  type,
}: {
  type: "active" | "scheduled" | "closed";
}) {
  return (
    <div className='text-center py-8 border rounded-lg'>
      <p className='text-muted-foreground'>
        No {type} polls available at this time.
      </p>
    </div>
  );
}
