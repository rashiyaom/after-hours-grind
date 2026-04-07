import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  allowedRole?: "student" | "trainer";
}

export default function ProtectedRoute({ allowedRole }: Props) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    const redirect = user?.role === "trainer" ? "/trainer/dashboard" : "/student/dashboard";
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
}
