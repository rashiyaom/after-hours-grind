import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Users, FileWarning, EyeOff, Download, LineChart, CheckCircle2, AlertCircle, Clock, ChevronDown, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useCurrentUser, usePermissions, usePosts, useSystem, useUsers, useAppStore } from "@/hooks/useStore";
import { fetchAdminActivityLogsAPI, fetchAdminStatsAPI, fetchFlaggedContentAPI, fetchHealthAPI } from "@/lib/api";

const AdminDashboard = () => {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);
  const [actionFilter, setActionFilter] = useState<"all" | "moderation" | "user">("all");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submissionsExpanded, setSubmissionsExpanded] = useState(false);
  const currentUser = useCurrentUser();
  const permissions = usePermissions();
  const users = Object.values(useUsers());
  const posts = Object.values(usePosts());
  const { activityLogs } = useSystem();
  const [adminStats, setAdminStats] = useState<{ userCount: number; studentCount: number; trainerCount: number } | null>(null);
  const [moderationStats, setModerationStats] = useState<{ flaggedPosts: number; hiddenPosts: number }>({ flaggedPosts: 0, hiddenPosts: 0 });
  const [activityItems, setActivityItems] = useState<Array<{ id: string; action: string; userId: string; timestamp: string }>>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [health, setHealth] = useState<{ status: string; timestamp?: string; checks?: Record<string, any> } | null>(null);
  const legacySubmissions = useAppStore((s) => s.system.legacySubmissions);
  const approveTaskSubmission = useAppStore((s) => s.approveTaskSubmission);
  const rejectTaskSubmission = useAppStore((s) => s.rejectTaskSubmission);

  const rolePermissions = currentUser ? permissions[currentUser.role] : undefined;
  const canManageUsers = Boolean(rolePermissions?.manage_users);
  const canModerateContent = Boolean(rolePermissions?.moderate_content);

  const totalUsers = adminStats?.userCount ?? users.length;
  const studentCount = adminStats?.studentCount ?? users.filter((u) => u.role === "student").length;
  const trainerCount = adminStats?.trainerCount ?? users.filter((u) => u.role === "trainer").length;
  const flaggedPosts = moderationStats.flaggedPosts;
  const hiddenPosts = moderationStats.hiddenPosts;
  const recentLogs = activityItems.length > 0
    ? activityItems.slice(0, 6)
    : [...activityLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 6).map((log) => ({
        id: log.id,
        action: log.action,
        userId: log.userId,
        timestamp: log.timestamp,
      }));

  const loadAdminDashboard = async () => {
    try {
      setAdminLoading(true);
      const [statsRes, moderationRes, activityRes, healthRes] = await Promise.allSettled([
        fetchAdminStatsAPI(),
        fetchFlaggedContentAPI(),
        fetchAdminActivityLogsAPI(),
        fetchHealthAPI(),
      ]);

      if (statsRes.status === "fulfilled") {
        setAdminStats({
          userCount: Number(statsRes.value.userCount ?? 0),
          studentCount: Number(statsRes.value.studentCount ?? 0),
          trainerCount: Number(statsRes.value.trainerCount ?? 0),
        });
      }

      if (moderationRes.status === "fulfilled") {
        const flagged = Array.isArray(moderationRes.value.flaggedPosts) ? moderationRes.value.flaggedPosts : [];
        setModerationStats({
          flaggedPosts: flagged.filter((p) => p && p.status === "under-review").length,
          hiddenPosts: flagged.filter((p) => p && p.status === "hidden").length,
        });
      }

      if (activityRes.status === "fulfilled") {
        const items: Array<{ id: string; action: string; userId: string; timestamp: string }> = [];
        const usersLogs = Array.isArray(activityRes.value.users) ? activityRes.value.users : [];
        const postLogs = Array.isArray(activityRes.value.posts) ? activityRes.value.posts : [];
        const submissionLogs = Array.isArray(activityRes.value.submissions) ? activityRes.value.submissions : [];

        for (const user of usersLogs) {
          items.push({
            id: `user-${String(user.id ?? Math.random())}`,
            action: "user-created",
            userId: String(user.id ?? "unknown"),
            timestamp: String(user.createdAt ?? new Date().toISOString()),
          });
        }

        for (const post of postLogs) {
          items.push({
            id: `post-${String(post.id ?? Math.random())}`,
            action: "post-created",
            userId: String(post.user?.id ?? "unknown"),
            timestamp: String(post.createdAt ?? new Date().toISOString()),
          });
        }

        for (const submission of submissionLogs) {
          items.push({
            id: `submission-${String(submission.id ?? Math.random())}`,
            action: `submission-${String(submission.status ?? "pending").toLowerCase()}`,
            userId: String(submission.student?.id ?? "unknown"),
            timestamp: String(submission.createdAt ?? new Date().toISOString()),
          });
        }

        items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setActivityItems(items);
      }

      if (healthRes && healthRes.status === "fulfilled") {
        setHealth(healthRes.value as { status: string; timestamp?: string; checks?: Record<string, any> });
      }
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminDashboard();
  }, []);

  const analyticsData = useMemo(() => {
    const days = rangeDays;
    const labels: string[] = [];
    const map = new Map<string, { label: string; moderationActions: number; userActions: number }>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { weekday: "short" });
      labels.push(key);
      map.set(key, { label, moderationActions: 0, userActions: 0 });
    }

    for (const log of activityLogs) {
      const key = log.timestamp.slice(0, 10);
      if (!map.has(key)) continue;
      const entry = map.get(key)!;
      if (log.action.includes("moderation")) {
        if (actionFilter === "all" || actionFilter === "moderation") entry.moderationActions += 1;
      }
      if (log.action.includes("user") || log.action.includes("trainer")) {
        if (actionFilter === "all" || actionFilter === "user") entry.userActions += 1;
      }
    }

    return labels.map((key) => map.get(key)!);
  }, [activityLogs, rangeDays, actionFilter]);

  const exportAuditCsv = () => {
    const rows = activityLogs.map((log) => {
      const detail = JSON.stringify(log.details).replace(/"/g, '""');
      return `"${log.id}","${log.timestamp}","${log.userId}","${log.action}","${detail}"`;
    });
    const csv = ["id,timestamp,userId,action,details", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxValue = Math.max(1, ...analyticsData.map((d) => d.moderationActions + d.userActions));

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-x-hidden">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={exportAuditCsv}>
          <Download className="h-4 w-4" />
          Export Audit CSV
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> User Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Total users: <span className="font-semibold text-foreground">{totalUsers}</span></p>
            <p className="text-sm text-muted-foreground">Students: <span className="font-semibold text-foreground">{studentCount}</span></p>
            <p className="text-sm text-muted-foreground">Trainers: <span className="font-semibold text-foreground">{trainerCount}</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileWarning className="h-4 w-4" /> Moderation Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Under review: <span className="font-semibold text-foreground">{flaggedPosts}</span></p>
            <p className="text-sm text-muted-foreground">Hidden posts: <span className="font-semibold text-foreground">{hiddenPosts}</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Media Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Provider: <span className="font-semibold text-foreground">{String(health?.checks?.media?.provider ?? "local")}</span></p>
            <p className="text-sm text-muted-foreground">Status: <span className="font-semibold text-foreground">{String(health?.checks?.media?.status ?? "disabled")}</span></p>
            {health?.checks?.media?.message && (
              <p className="text-xs text-rose-400 mt-2">{String(health.checks.media.message)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Admin Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {canManageUsers && (
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/admin/users">Manage Users</Link>
              </Button>
            )}
            {canModerateContent && (
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/admin/content">Moderate Content</Link>
              </Button>
            )}
            {canManageUsers && (
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/admin/permissions">Permissions Matrix</Link>
              </Button>
            )}
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/admin/achievements">🏆 Achievement Manager</Link>
            </Button>
            {!canManageUsers && !canModerateContent && (
              <p className="text-xs text-muted-foreground">No admin actions available for current permissions.</p>
            )}
            <p className="pt-1 text-xs text-muted-foreground inline-flex items-center gap-2"><EyeOff className="h-3 w-3" /> Audit trail ready</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2"><LineChart className="h-4 w-4" /> {rangeDays}-Day Admin Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {[7, 14, 30].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={rangeDays === d ? "default" : "outline"}
                onClick={() => setRangeDays(d as 7 | 14 | 30)}
              >
                {d} days
              </Button>
            ))}
            <Button
              size="sm"
              variant={actionFilter === "all" ? "default" : "outline"}
              onClick={() => setActionFilter("all")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={actionFilter === "moderation" ? "default" : "outline"}
              onClick={() => setActionFilter("moderation")}
            >
              Moderation
            </Button>
            <Button
              size="sm"
              variant={actionFilter === "user" ? "default" : "outline"}
              onClick={() => setActionFilter("user")}
            >
              User Ops
            </Button>
          </div>
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-3">
              {analyticsData.map((day, idx) => {
                const total = day.moderationActions + day.userActions;
                const height = Math.max(8, Math.round((total / maxValue) * 120));
                return (
                  <div key={`${day.label}-${idx}`} className="flex w-12 flex-col items-center gap-2">
                    <div className="flex h-36 w-full items-end justify-center rounded-md border bg-muted/20 p-2">
                      <div style={{ height: `${height}px` }} className="w-7 rounded-sm bg-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">{day.label}</span>
                    <span className="text-[10px] text-foreground">{total}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
            <span>Range: {rangeDays} days</span>
            <span>Filter: {actionFilter === "all" ? "All actions" : actionFilter}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admin activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium text-foreground">{log.action}</p>
                  <p className="text-xs text-muted-foreground">Actor: {log.userId}</p>
                  <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Approval Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="inline-flex items-center justify-between gap-2 w-full">
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Task Submission Reviews
              {legacySubmissions.filter((s) => s.status === "pending").length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-[10px] font-bold text-black">
                  {legacySubmissions.filter((s) => s.status === "pending").length}
                </span>
              )}
            </span>
            <button
              onClick={() => setSubmissionsExpanded(!submissionsExpanded)}
              className="text-xs font-medium text-muted-foreground"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${submissionsExpanded ? "rotate-180" : ""}`} />
            </button>
          </CardTitle>
        </CardHeader>
        {submissionsExpanded && (
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">
              As admin, you can approve or reject task submissions for all students. Trainers can only approve their assigned students.
            </p>
            <div className="space-y-3">
              {legacySubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No task submissions yet.</p>
              ) : (
                legacySubmissions.map((sub) => (
                  <div key={sub.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{sub.studentName}</p>
                        <p className="text-xs text-muted-foreground">{sub.taskName} · {sub.timestamp}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize border ${
                          sub.status === "approved" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          sub.status === "rejected" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}>{sub.status}</span>
                        {sub.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReviewingId(reviewingId === sub.id ? null : sub.id)}
                          >
                            {reviewingId === sub.id ? <X className="h-3 w-3" /> : "Review"}
                          </Button>
                        )}
                      </div>
                    </div>
                    {reviewingId === sub.id && sub.status === "pending" && (
                      <div className="pt-2 border-t space-y-2">
                        <textarea
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          placeholder="Admin feedback (required for rejection)..."
                          className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              await approveTaskSubmission(sub.id, reviewNote || undefined, sub.points ?? 10);
                              await loadAdminDashboard();
                              setReviewingId(null);
                              setReviewNote("");
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (!reviewNote.trim()) return;
                              await rejectTaskSubmission(sub.id, reviewNote);
                              await loadAdminDashboard();
                              setReviewingId(null);
                              setReviewNote("");
                            }}
                          >
                            <AlertCircle className="h-3 w-3 mr-1" /> Request Changes
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        )}
      </Card>
      {adminLoading && <p className="mt-4 text-xs text-muted-foreground">Refreshing admin data...</p>}
    </div>
  );
};

export default AdminDashboard;
