import { Skeleton } from "@/components/ui/skeleton";

/**
 * The account pages fetch from the database, so every navigation into them has a
 * beat of waiting. One skeleton keeps the rail layout while the real one loads,
 * so the page does not jump from blank to full in one frame.
 */
export default function AccountLoading() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-64 max-w-full" />
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}