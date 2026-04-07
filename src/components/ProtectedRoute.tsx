import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUser, useIsAuthenticated, usePermissions } from "@/hooks/useStore";
import { PermissionKey, UserRole } from "@/types";
import { resolveProtectedRouteRedirect } from "@/lib/routeAccess";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  requiredPermission?: PermissionKey;
}

const ProtectedRoute = ({ allowedRoles, requiredPermission }: ProtectedRouteProps) => {
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();
  const currentUser = useCurrentUser();
  const permissions = usePermissions();

  const redirectTo = resolveProtectedRouteRedirect({
    isAuthenticated,
    currentUser,
    allowedRoles,
    requiredPermission,
    permissions,
  });

  if (redirectTo) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
