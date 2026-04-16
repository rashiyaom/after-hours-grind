import { PermissionKey, User, UserRole } from "@/types";

const roleHomePath: Record<UserRole, "/student/dashboard" | "/trainer/dashboard" | "/admin/dashboard"> = {
  student: "/student/dashboard",
  trainer: "/trainer/dashboard",
  admin: "/admin/dashboard",
};

export const resolveProtectedRouteRedirect = ({
  isAuthenticated,
  currentUser,
  allowedRoles,
  requiredPermission,
  permissions,
}: {
  isAuthenticated: boolean;
  currentUser: User | null;
  allowedRoles: UserRole[];
  requiredPermission?: PermissionKey;
  permissions: Record<UserRole, Record<PermissionKey, boolean>>;
}): "/login" | "/unauthorized" | null => {
  if (!isAuthenticated) return "/login";
  if (!currentUser) return "/login";
  if (!allowedRoles.includes(currentUser.role)) return roleHomePath[currentUser.role];
  if (currentUser.role === "admin") return null;
  // Keep dashboard reachable even if permission matrix was temporarily misconfigured.
  if (requiredPermission === "view_dashboard") return null;
  if (requiredPermission && !permissions[currentUser.role][requiredPermission]) return "/unauthorized";
  return null;
};
