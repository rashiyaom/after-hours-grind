import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import PublicLayout from "@/layouts/PublicLayout";
import AppLayout from "@/layouts/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import NotFound from "@/pages/NotFound";
import UnauthorizedPage from "@/pages/UnauthorizedPage";

// Student Pages
import StudentDashboard from "@/pages/student/Dashboard";
import DailyPlan from "@/pages/student/DailyPlan";
import Progress from "@/pages/student/Progress";
import Feed from "@/pages/student/Feed";
import UploadPage from "@/pages/student/UploadPage";
import Leaderboard from "@/pages/student/Leaderboard";
import Profile from "@/pages/student/Profile";
import Community from "@/pages/student/Community";
import Notifications from "@/pages/student/Notifications";
import Settings from "@/pages/student/Settings";
import Achievements from "@/pages/student/Achievements";
import FitnessOnboardingPage from "@/pages/student/FitnessOnboarding";
import PlanApprovalStatusPage from "@/pages/student/PlanApprovalStatus";

// Trainer Pages
import TrainerDashboard from "@/pages/trainer/Dashboard";
import PlanBuilder from "@/pages/trainer/PlanBuilder";
import AutoPlansQueuePage from "@/pages/trainer/AutoPlansQueue";
import StudentRoster from "@/pages/trainer/StudentRoster";
import StudentDetail from "@/pages/trainer/StudentDetail";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import UserManagement from "@/pages/admin/UserManagement";
import ContentModeration from "@/pages/admin/ContentModeration";
import Permissions from "./pages/admin/Permissions";
import AdminEventsManager from "@/pages/admin/EventsManager";

// Public pages
import EventsPage from "@/pages/EventsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/events" element={<EventsPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={["student"]} requiredPermission="view_dashboard" />}>
            <Route path="/student" element={<AppLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="onboarding" element={<FitnessOnboardingPage />} />
              <Route path="plan-status" element={<PlanApprovalStatusPage />} />
              <Route path="daily-plan" element={<DailyPlan />} />
              <Route path="progress" element={<Progress />} />
              <Route path="feed" element={<Feed />} />
              <Route element={<ProtectedRoute allowedRoles={["student"]} requiredPermission="post_feed" />}>
                <Route path="upload" element={<UploadPage />} />
              </Route>
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:userId" element={<Profile />} />
              <Route path="community" element={<Community />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
              <Route path="achievements" element={<Achievements />} />
            </Route>
          </Route>

          {/* Trainer Routes */}
          <Route element={<ProtectedRoute allowedRoles={["trainer"]} requiredPermission="view_dashboard" />}>
            <Route path="/trainer" element={<AppLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TrainerDashboard />} />
              <Route path="auto-plans" element={<AutoPlansQueuePage />} />
              <Route path="students" element={<StudentRoster />} />
              <Route path="students/:studentId" element={<StudentDetail />} />
              <Route element={<ProtectedRoute allowedRoles={["trainer"]} requiredPermission="build_plans" />}>
                <Route path="plan-builder" element={<PlanBuilder />} />
              </Route>
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} requiredPermission="view_dashboard" />}>
            <Route path="/admin" element={<AppLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route element={<ProtectedRoute allowedRoles={["admin"]} requiredPermission="manage_users" />}>
                <Route path="users" element={<UserManagement />} />
                <Route path="permissions" element={<Permissions />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["admin"]} requiredPermission="moderate_content" />}>
                <Route path="content" element={<ContentModeration />} />
              </Route>
              <Route path="events" element={<AdminEventsManager />} />
            </Route>
          </Route>

          {/* Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
