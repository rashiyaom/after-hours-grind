import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppStore, useCurrentUser, useIsAuthenticated, usePermissions } from "@/hooks/useStore";
import { PermissionKey, Student, UserRole } from "@/types";
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
  const plans = useAppStore((state) => state.plans);

  // During refresh/session bootstrap, avoid a false unauthorized redirect.
  if (isAuthenticated && !currentUser) {
    return null;
  }

  if (isAuthenticated && currentUser?.role === "student") {
    const student = currentUser as Student;
    const onboardingIncomplete = student.onboardingStatus !== "completed";
    const isOnboardingRoute = location.pathname.startsWith("/student/onboarding");

    if (onboardingIncomplete && !isOnboardingRoute) {
      return <Navigate to="/student/onboarding" state={{ from: location }} replace />;
    }

    const currentPlan = student.currentPlanId ? plans[student.currentPlanId] : null;
    const isPlanStatusRoute = location.pathname.startsWith("/student/plan-status");
    const isDailyPlanRoute = location.pathname.startsWith("/student/daily-plan");
    const isBlockedByApproval = currentPlan?.status === "pending_trainer_approval" || currentPlan?.status === "rejected";

    if (isBlockedByApproval && isDailyPlanRoute && !isPlanStatusRoute) {
      return <Navigate to="/student/plan-status" state={{ from: location }} replace />;
    }
  }

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
