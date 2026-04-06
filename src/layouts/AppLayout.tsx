import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  LayoutDashboard, Calendar, BarChart3, Rss, Upload, Trophy, User, Users,
  Bell, Settings, Flame, Menu, X, ChevronLeft,
  ClipboardList, Dumbbell,
} from "lucide-react";

const studentNav = [
  { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
  { label: "Daily Plan", path: "/student/daily-plan", icon: Calendar },
  { label: "Progress", path: "/student/progress", icon: BarChart3 },
  { label: "Feed", path: "/student/feed", icon: Rss },
  { label: "Upload", path: "/student/upload", icon: Upload },
  { label: "Leaderboard", path: "/student/leaderboard", icon: Trophy },
  { label: "Profile", path: "/student/profile", icon: User },
  { label: "Community", path: "/student/community", icon: Users },
  { label: "Notifications", path: "/student/notifications", icon: Bell },
  { label: "Settings", path: "/student/settings", icon: Settings },
];

const trainerNav = [
  { label: "Dashboard", path: "/trainer/dashboard", icon: LayoutDashboard },
  { label: "Plan Builder", path: "/trainer/plan-builder", icon: ClipboardList },
];

export default function AppLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isTrainer = location.pathname.startsWith("/trainer");
  const nav = isTrainer ? trainerNav : studentNav;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen border-r border-border/50 bg-sidebar transition-all duration-300 z-40 ${collapsed ? "w-[68px]" : "w-60"}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-streak" />
              <span className="font-display font-bold text-sm tracking-tight text-foreground">THE AFTER HOURS</span>
            </Link>
          )}
          {collapsed && <Flame className="h-5 w-5 text-streak mx-auto" />}
          <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border/50">
          {!collapsed && <p className="text-[10px] text-muted-foreground/50 text-center">Built after hours.</p>}
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background/90 backdrop-blur-xl border-b border-border/50 z-50 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-streak" />
          <span className="font-display font-bold text-sm text-foreground">TAH</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="lg:hidden fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-border/50 z-50 py-16 px-3">
              <nav className="space-y-1">
                {nav.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${active ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}>
                      <item.icon className="h-[18px] w-[18px]" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? "lg:ml-[68px]" : "lg:ml-60"} pt-14 lg:pt-0`}>
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-screen">
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
