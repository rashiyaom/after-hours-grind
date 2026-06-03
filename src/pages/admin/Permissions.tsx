import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { useAppStore, usePermissions } from "@/hooks/useStore";
import { PermissionKey } from "@/types";

type RoleKey = "student" | "trainer";

const permissionLabels: Record<PermissionKey, string> = {
  view_dashboard: "View Dashboard",
  manage_users: "Manage Users",
  moderate_content: "Moderate Content",
  build_plans: "Build Plans",
  post_feed: "Create Feed Posts",
  view_analytics: "View Analytics",
};

export default function PermissionsPage() {
  const matrix = usePermissions();
  const setRolePermission = useAppStore((state) => state.setRolePermission);
  const resetPermissions = useAppStore((state) => state.resetPermissions);

  const permissionKeys = useMemo(() => Object.keys(permissionLabels) as PermissionKey[], []);

  const togglePermission = (role: RoleKey, permission: PermissionKey) => {
    setRolePermission(role, permission, !matrix[role][permission]);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permissions Matrix</h1>
          <p className="text-sm text-muted-foreground">Role-based access control preview for Student and Trainer. Admin always has full access.</p>
        </div>
        <Button variant="outline" onClick={resetPermissions}>Reset Defaults</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Access Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left text-xs uppercase tracking-wide text-muted-foreground">Permission</th>
                  <th className="p-3 text-left text-xs uppercase tracking-wide text-muted-foreground">Student</th>
                  <th className="p-3 text-left text-xs uppercase tracking-wide text-muted-foreground">Trainer</th>
                </tr>
              </thead>
              <tbody>
                {permissionKeys.map((permission) => (
                  <tr key={permission} className="border-b">
                    <td className="p-3 text-sm font-medium">{permissionLabels[permission]}</td>
                    {(["student", "trainer"] as RoleKey[]).map((role) => (
                      <td key={`${role}-${permission}`} className="p-3">
                        <button
                          onClick={() => togglePermission(role, permission)}
                          className="inline-flex items-center gap-2"
                        >
                          <Badge variant={matrix[role][permission] ? "default" : "secondary"}>
                            {matrix[role][permission] ? "Allowed" : "Denied"}
                          </Badge>
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
