import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  LayoutDashboard, Calendar, BarChart3, Rss, Trophy, User, Users,
  Bell, Settings, Flame, Menu, X, ChevronLeft,
  ClipboardList, Award, LogOut, Plus, Search,
} from "lucide-react";
import { useStore } from "@/hooks/useStore";

const studentNav = [
  { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
  { label: "Daily Plan", path: "/student/daily-plan", icon: Calendar },
  { label: "Progress", path: "/student/progress", icon: BarChart3 },
  { label: "Feed", path: "/student/feed", icon: Rss },
  { label: "Community", path: "/student/community", icon: Users },
  { label: "Leaderboard", path: "/student/leaderboard", icon: Trophy },
  { label: "Profile", path: "/student/profile", icon: User },
  { label: "Achievements", path: "/student/achievements", icon: Award },
  { label: "Settings", path: "/student/settings", icon: Settings },
];

const mobileBottomNav = [
  { label: "Home", path: "/student/dashboard", icon: LayoutDashboard },
  { label: "Search", path: "/student/community", icon: Search },
  { label: "Upload", path: "/student/upload", icon: Plus, isAction: true },
  { label: "Tasks", path: "/student/daily-plan", icon: Calendar },
  { label: "Profile", path: "/student/profile", icon: User },
];

const trainerNav = [
  { label: "Dashboard", path: "/trainer/dashboard", icon: LayoutDashboard },
  { label: "Plan Builder", path: "/trainer/plan-builder", icon: ClipboardList },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isTrainer = location.pathname.startsWith("/trainer");
  const nav = isTrainer ? trainerNav : studentNav;
  const { notifications } = useStore();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const handleLogout = () => navigate("/");

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen border-r border-border/50 bg-sidebar transition-all duration-300 z-40 ${collapsed ? "w-[68px]" : "w-60"}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-streak flame-glow" />
              <span className="font-display font-bold text-sm tracking-tight text-foreground">THE AFTER HOURS</span>
            </Link>
          )}
          {collapsed && <Flame className="h-5 w-5 text-streak mx-auto flame-glow" />}
          <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground transition-colors ml-auto">
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
        <div className={!collapsed ? "px-4 pt-4 pb-2" : "hidden"}>
          <Link to={isTrainer ? "/trainer/plan-builder" : "/student/upload"} className="flex items-center justify-center gap-2 w-full py-2.5 bg-foreground text-background rounded-xl font-medium text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
            <Plus className="h-4 w-4" />
            <span>Upload</span>
          </Link>
        </div>
        <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = location.pathname === item.path;
            const isNotif = item.path.includes("notifications");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative ${
                  active
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {isNotif && unreadCount > 0 && (
                  <span className={`${collapsed ? "absolute -top-1 -right-1" : "ml-auto"} min-w-[18px] h-[18px] rounded-full bg-streak text-[10px] font-bold text-background flex items-center justify-center px-1`}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/50 space-y-1">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background/90 backdrop-blur-xl border-b border-border/50 z-40 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-streak flame-glow" />
          <span className="font-display font-bold text-sm text-foreground">TAH</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/student/notifications" className="relative text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-streak text-[9px] font-bold text-background flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
          <button onClick={() => setMobileOpen(true)} className="text-foreground">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Secondary Menu) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="lg:hidden fixed top-0 right-0 h-full w-64 bg-sidebar border-l border-border/50 z-[101] flex flex-col">
              <div className="flex items-center justify-between h-14 px-4 border-b border-border/50">
                <span className="font-display font-bold text-sm text-foreground">Menu</span>
                <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
                {nav.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${active ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}>
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-border/50">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
                  <LogOut className="h-5 w-5" />
                   Log Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation (Instagram Style) */}
      {!isTrainer && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-xl border-t border-border/50 z-40 flex items-center justify-around px-2 pb-safe">
          {mobileBottomNav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="relative flex flex-col items-center justify-center w-full h-full">
                {item.isAction ? (
                  <div className="absolute -top-5 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg shadow-black/50 border-[3px] border-background hover:scale-105 active:scale-95 transition-all">
                    <item.icon className="h-6 w-6" />
                  </div>
                ) : (
                  <div className={`flex flex-col items-center gap-1 transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}>
                    <item.icon className={`h-6 w-6 transition-transform ${active ? "scale-110" : ""}`} />
                  </div>
                )}
                {active && !item.isAction && <motion.div layoutId="bottom-indicator" className="absolute bottom-1 w-1 h-1 rounded-full bg-foreground" />}
              </Link>
            );
          })}
        </div>
      )}

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? "lg:ml-[68px]" : "lg:ml-60"} pt-14 lg:pt-0 pb-16 lg:pb-0`}>
        <motion.div key={location.pathname} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="min-h-screen">
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
