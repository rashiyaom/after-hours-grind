import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import * as Sentry from "@sentry/react";
import { Component, ErrorInfo } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/hooks/useStore";
import { AlertCircle, RefreshCw } from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";

const PublicLayout = lazy(() => import("@/layouts/PublicLayout"));
const AppLayout = lazy(() => import("@/layouts/AppLayout"));

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RequestAccessPage = lazy(() => import("@/pages/RequestAccessPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const UnauthorizedPage = lazy(() => import("@/pages/UnauthorizedPage"));

const StudentDashboard = lazy(() => import("@/pages/student/Dashboard"));
const DailyPlan = lazy(() => import("@/pages/student/DailyPlan"));
const Progress = lazy(() => import("@/pages/student/Progress"));
const Feed = lazy(() => import("@/pages/student/Feed"));
const UploadPage = lazy(() => import("@/pages/student/UploadPage"));
const Leaderboard = lazy(() => import("@/pages/student/Leaderboard"));
const Profile = lazy(() => import("@/pages/student/Profile"));
const Community = lazy(() => import("@/pages/student/Community"));
const Notifications = lazy(() => import("@/pages/student/Notifications"));
const Settings = lazy(() => import("@/pages/student/Settings"));
const Achievements = lazy(() => import("@/pages/student/Achievements"));
const FitnessOnboardingPage = lazy(() => import("@/pages/student/FitnessOnboarding"));
const PlanApprovalStatusPage = lazy(() => import("@/pages/student/PlanApprovalStatus"));
const Explore = lazy(() => import("@/pages/student/Explore"));
const FeatureStudioPage = lazy(() => import("@/pages/student/FeatureStudio"));

const TrainerDashboard = lazy(() => import("@/pages/trainer/Dashboard"));
const PlanBuilder = lazy(() => import("@/pages/trainer/PlanBuilder"));
const AutoPlansQueuePage = lazy(() => import("@/pages/trainer/AutoPlansQueue"));
const StudentRoster = lazy(() => import("@/pages/trainer/StudentRoster"));
const StudentDetail = lazy(() => import("@/pages/trainer/StudentDetail"));

const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const UserManagement = lazy(() => import("@/pages/admin/UserManagement"));
const UserQuestionnaire = lazy(() => import("@/pages/admin/UserQuestionnaire"));
const ContentModeration = lazy(() => import("@/pages/admin/ContentModeration"));
const Permissions = lazy(() => import("@/pages/admin/Permissions"));
const AdminEventsManager = lazy(() => import("@/pages/admin/EventsManager"));
const AdminTemplates = lazy(() => import("@/pages/admin/Templates"));
const AdminAchievementsManager = lazy(() => import("@/pages/admin/AchievementsManager"));
const PointsManagerPage = lazy(() => import("@/pages/admin/PointsManager"));

const EventsPage = lazy(() => import("@/pages/EventsPage"));
const AthletesPage = lazy(() => import("@/pages/AthletesPage"));
const SentryTestPage = lazy(() => import("@/pages/SentryTestPage"));

const queryClient = new QueryClient();

const AppRouteFallback = () => (
  <div className="min-h-screen bg-background" aria-busy="true" />
);

// Error boundary fallback component
const ErrorFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
    <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
      <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-gray-600 mb-6">
        We've logged this error and will look into it. Please try refreshing the page.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
      >
        <RefreshCw className="h-5 w-5" />
        Refresh Page
      </button>
      <p className="text-xs text-gray-500 mt-6">
        If the problem persists, please contact support.
      </p>
    </div>
  </div>
);

// DEBUG: Temporary ErrorBoundary to show error details for local debugging
class DebugErrorBoundary extends Component<{ children: React.ReactNode }, { error?: Error; info?: ErrorInfo }> {
  constructor(props: any) {
    super(props);
    this.state = {};
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    // Store error so we can display it
    // Also send to Sentry for records
    Sentry.captureException(error, { extra: info });
    // eslint-disable-next-line react/no-unused-state
    this.setState({ error, info });
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-red-50 p-6">
          <div className="max-w-4xl mx-auto bg-white rounded p-6">
            <h2 className="text-xl font-bold text-red-700 mb-2">Debug: Caught error</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-900">{String(this.state.error.stack || this.state.error.message)}</pre>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600">Component stack</summary>
              <pre className="whitespace-pre-wrap text-xs text-gray-700">{this.state.info?.componentStack}</pre>
            </details>
            <div className="mt-4">
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-500 text-white rounded">Reload</button>
            </div>
          </div>
        </div>
      );
    }
    // Render children normally
    // @ts-ignore
    return this.props.children;
  }
}

const App = () => {
  // Use the store's getter to avoid subscribing to the function reference
  // which can cause a changing dependency and re-run the effect repeatedly.
  useEffect(() => {
    void useAppStore.getState().initializeSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <DebugErrorBoundary>
          <BrowserRouter>
            <Suspense fallback={<AppRouteFallback />}>
              <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/athletes" element={<AthletesPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/request-access" element={<RequestAccessPage />} />
          <Route path="/signup" element={<Navigate to="/request-access" replace />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/sentry-test" element={<SentryTestPage />} />

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
              <Route path="explore" element={<Explore />} />
              <Route path="features" element={<FeatureStudioPage />} />
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
              <Route path="community" element={<Community />} />
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
                <Route path="users/:userId/questionnaire" element={<UserQuestionnaire />} />
                <Route path="permissions" element={<Permissions />} />
                <Route path="templates" element={<AdminTemplates />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["admin"]} requiredPermission="moderate_content" />}>
                <Route path="content" element={<ContentModeration />} />
              </Route>
              <Route path="events" element={<AdminEventsManager />} />
              <Route path="achievements" element={<AdminAchievementsManager />} />
              <Route path="points" element={<PointsManagerPage />} />
            </Route>
          </Route>

          {/* Not Found */}
          <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </DebugErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
