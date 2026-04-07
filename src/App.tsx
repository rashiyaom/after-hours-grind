import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import PublicLayout from "@/layouts/PublicLayout";
import AppLayout from "@/layouts/AppLayout";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import NotFound from "@/pages/NotFound";

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

import TrainerDashboard from "@/pages/trainer/Dashboard";
import PlanBuilder from "@/pages/trainer/PlanBuilder";

import { StoreProvider } from "@/hooks/useStore";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StoreProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Student */}
            <Route element={<AppLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/daily-plan" element={<DailyPlan />} />
              <Route path="/student/progress" element={<Progress />} />
              <Route path="/student/feed" element={<Feed />} />
              <Route path="/student/upload" element={<UploadPage />} />
              <Route path="/student/leaderboard" element={<Leaderboard />} />
              <Route path="/student/profile" element={<Profile />} />
              <Route path="/student/profile/:userId" element={<Profile />} />
              <Route path="/student/community" element={<Community />} />
              <Route path="/student/notifications" element={<Notifications />} />
              <Route path="/student/settings" element={<Settings />} />
              <Route path="/student/achievements" element={<Achievements />} />
            </Route>

            {/* Trainer */}
            <Route element={<AppLayout />}>
              <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
              <Route path="/trainer/plan-builder" element={<PlanBuilder />} />
            </Route>

            {/* Index redirect */}
            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/trainer" element={<Navigate to="/trainer/dashboard" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
