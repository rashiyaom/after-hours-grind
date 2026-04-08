import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Users, FileWarning, EyeOff, Download, LineChart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useCurrentUser, usePermissions, usePosts, useSystem, useUsers } from "@/hooks/useStore";

const AdminDashboard = () => {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);
  const [actionFilter, setActionFilter] = useState<"all" | "moderation" | "user">("all");
  const currentUser = useCurrentUser();
  const permissions = usePermissions();
  const users = Object.values(useUsers());
  const posts = Object.values(usePosts());
  const { activityLogs } = useSystem();

  const rolePermissions = currentUser ? permissions[currentUser.role] : undefined;
  const canManageUsers = Boolean(rolePermissions?.manage_users);
  const canModerateContent = Boolean(rolePermissions?.moderate_content);

  const totalUsers = users.length;
  const studentCount = users.filter((u) => u.role === "student").length;
  const trainerCount = users.filter((u) => u.role === "trainer").length;
  const flaggedPosts = posts.filter((p) => p.status === "under-review").length;
  const hiddenPosts = posts.filter((p) => p.status === "hidden").length;
  const recentLogs = [...activityLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 6);

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
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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
    </div>
  );
};

export default AdminDashboard;
