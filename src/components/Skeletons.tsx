import { Skeleton } from "@/components/ui/skeleton";

/**
 * Feed Post Card Skeleton
 */
export function FeedPostCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111111]">
      <div className="pointer-events-none absolute inset-0 animate-pulse opacity-60 [background:linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.06)_40%,transparent_60%)]" />
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-2xl bg-white/10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40 bg-white/10" />
            <Skeleton className="h-3 w-28 bg-white/5" />
          </div>
          <Skeleton className="h-7 w-7 rounded-full bg-white/10" />
        </div>

        <Skeleton className="mt-5 aspect-square w-full rounded-3xl bg-white/10" />

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full bg-white/10" />
              <Skeleton className="h-5 w-5 rounded-full bg-white/10" />
              <Skeleton className="h-5 w-5 rounded-full bg-white/10" />
            </div>
            <Skeleton className="h-5 w-5 rounded-full bg-white/10" />
          </div>

          <Skeleton className="h-3.5 w-24 bg-white/10" />
          <Skeleton className="h-3.5 w-full bg-white/10" />
          <Skeleton className="h-3.5 w-3/4 bg-white/5" />
        </div>
      </div>
    </div>
  );
}

/**
 * Feed Grid Skeleton (multiple cards)
 */
export function FeedGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <FeedPostCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Dashboard Card Skeleton
 */
export function DashboardCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <Skeleton className="h-16 w-full rounded" />
    </div>
  );
}

/**
 * Dashboard Grid Skeleton
 */
export function DashboardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <DashboardCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Chart Skeleton
 */
export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 flex-1 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Leaderboard Row Skeleton
 */
export function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-slate-800">
      <Skeleton className="h-6 w-6 rounded" />
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-12" />
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  );
}

/**
 * Leaderboard List Skeleton
 */
export function LeaderboardSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <LeaderboardRowSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Profile Card Skeleton
 */
export function ProfileCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 text-center">
      <div className="flex justify-center mb-4">
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>
      <Skeleton className="h-6 w-40 mx-auto mb-2" />
      <Skeleton className="h-4 w-32 mx-auto mb-4" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * List Item Skeleton
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-slate-800">
      <Skeleton className="h-10 w-10 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-8 w-20 rounded" />
    </div>
  );
}

/**
 * List Skeleton (multiple items)
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-200 dark:border-slate-800">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Table Skeleton
 */
export function TableSkeleton({ rows = 8, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Header Skeleton
 */
export function HeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
}

/**
 * Notification Item Skeleton
 */
export function NotificationItemSkeleton() {
  return (
    <div className="flex gap-3 p-4 border-b border-gray-200 dark:border-slate-800">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  );
}

/**
 * Notification List Skeleton
 */
export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Daily Plan Day Skeleton
 */
export function DailyPlanDaySkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-4">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-16 rounded" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 border border-gray-200 dark:border-slate-800 rounded">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Daily Plan Week Skeleton
 */
export function DailyPlanWeekSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <DailyPlanDaySkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Achievement Badge Skeleton
 */
export function AchievementBadgeSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

/**
 * Achievement Grid Skeleton
 */
export function AchievementGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <AchievementBadgeSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Form Skeleton
 */
export function FormSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 flex-1 rounded" />
        <Skeleton className="h-10 flex-1 rounded" />
      </div>
    </div>
  );
}

/**
 * Page Layout Skeleton
 */
export function PageLayoutSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <DashboardGridSkeleton count={2} />
        </div>
        <div>
          <DashboardCardSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * Student Roster Row Skeleton
 */
export function RosterRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-slate-800">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  );
}

/**
 * Student Roster Skeleton
 */
export function RosterSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-slate-800">
        <Skeleton className="h-8 w-48" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <RosterRowSkeleton key={i} />
      ))}
    </div>
  );
}
