import { PermissionKey, User, UserRole } from "@/types";

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
  if (!currentUser || !allowedRoles.includes(currentUser.role)) return "/unauthorized";
  if (currentUser.role === "admin") return null;
  if (requiredPermission && !permissions[currentUser.role][requiredPermission]) return "/unauthorized";
  return null;
};
