import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  LayoutDashboard, Calendar, BarChart3, Rss, Trophy, User, Users,
  Bell, Settings, Flame, Menu, X, ChevronLeft,
  ClipboardList, Award, LogOut, Plus, Search, Zap, Activity, Shield
} from "lucide-react";
import { useAppStore } from "@/hooks/useStore";

const studentNav = [
  { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
  { label: "Daily Plan", path: "/student/daily-plan", icon: Calendar },
  { label: "Progress", path: "/student/progress", icon: BarChart3 },
  { label: "Feed", path: "/student/feed", icon: Rss },
  { label: "Community", path: "/student/community", icon: Users },
  { label: "Leaderboard", path: "/student/leaderboard", icon: Trophy },
  { label: "Profile", path: "/student/profile", icon: User },
  { label: "Achievements", path: "/student/achievements", icon: Award },
];

const mobileStudentBottomNav = [
  { label: "Home", path: "/student/dashboard", icon: LayoutDashboard },
  { label: "Search", path: "/student/community", icon: Search },
  { label: "Upload", path: "/student/upload", icon: Plus, isAction: true },
  { label: "Tasks", path: "/student/daily-plan", icon: Calendar },
  { label: "Profile", path: "/student/profile", icon: User },
];

const mobileTrainerBottomNav = [
  { label: "Home", path: "/trainer/dashboard", icon: LayoutDashboard },
  { label: "Builder", path: "/trainer/plan-builder", icon: ClipboardList },
  { label: "Verify", path: "/trainer/dashboard", icon: Zap, isAction: true },
  { label: "Roster", path: "/trainer/dashboard", icon: Users },
  { label: "Stats", path: "/trainer/dashboard", icon: Activity },
];

const trainerNav = [
  { label: "Dashboard", path: "/trainer/dashboard", icon: LayoutDashboard },
  { label: "Plan Builder", path: "/trainer/plan-builder", icon: ClipboardList },
];

const adminNav = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Content", path: "/admin/content", icon: Rss },
  { label: "Permissions", path: "/admin/permissions", icon: Shield },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = location.pathname.startsWith("/admin");
  const isTrainer = location.pathname.startsWith("/trainer");
  const {
    session: { currentUser },
    system: { notifications, permissions },
    logout,
  } = useAppStore();

  const rolePermissions = currentUser ? permissions[currentUser.role] : undefined;
  const canManageUsers = Boolean(rolePermissions?.manage_users);
  const canModerateContent = Boolean(rolePermissions?.moderate_content);
  const canBuildPlans = Boolean(rolePermissions?.build_plans);
  const canPostFeed = Boolean(rolePermissions?.post_feed);

  const nav = isAdmin
    ? adminNav.filter((item) => {
        if (item.path.endsWith("/users") || item.path.endsWith("/permissions")) return canManageUsers;
        if (item.path.endsWith("/content")) return canModerateContent;
        return true;
      })
    : isTrainer
      ? trainerNav.filter((item) => (item.path.endsWith("/plan-builder") ? canBuildPlans : true))
      : studentNav;

  const mobileBottomNav = isAdmin
    ? []
    : isTrainer
      ? mobileTrainerBottomNav.filter((item) => (item.path.endsWith("/plan-builder") ? canBuildPlans : true))
      : mobileStudentBottomNav.filter((item) => (item.path.endsWith("/upload") ? canPostFeed : true));

  const topAction = isAdmin
    ? canModerateContent
      ? { to: "/admin/content", label: "Review Queue" }
      : canManageUsers
        ? { to: "/admin/users", label: "Manage Users" }
        : null
    : isTrainer
      ? canBuildPlans
        ? { to: "/trainer/plan-builder", label: "New Plan" }
        : null
      : canPostFeed
        ? { to: "/student/upload", label: "Create Post" }
        : null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen border-r border-white/5 bg-sidebar transition-all duration-300 z-40 ${collapsed ? "w-[80px]" : "w-64"}`}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/5">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 transition-transform group-hover:scale-105">
                 <Flame className="h-5 w-5 text-primary" />
              </div>
              <span className="font-display font-bold text-sm tracking-widest text-foreground uppercase">After Hours</span>
            </Link>
          )}
          {collapsed && (
             <div className="mx-auto w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <Flame className="h-6 w-6 text-primary" />
             </div>
          )}
        </div>
        
        {topAction && (
          <div className={!collapsed ? "px-6 pt-8 pb-4" : "px-3 pt-8 pb-4"}>
            <Link 
              to={topAction.to} 
              className={`flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-black rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95 group overflow-hidden relative`}
            >
              <Plus className="h-4 w-4 relative z-10 transition-transform group-hover:rotate-90" />
              {!collapsed && <span className="relative z-10">{topAction.label}</span>}
            </Link>
          </div>
        )}

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {nav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all relative group ${
                  active
                    ? "bg-zinc-900 text-foreground border border-white/5 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.02]"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <item.icon className={`h-[18px] w-[18px] flex-shrink-0 transition-all ${active ? "text-primary" : "group-hover:text-primary"}`} />
                {!collapsed && <span>{item.label}</span>}
                {active && (
                   <motion.div layoutId="nav-glow" className="absolute left-[-12px] w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-xs font-semibold tracking-wide text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-2xl border-b border-white/5 z-40 flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
             <Flame className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display font-bold text-xs tracking-widest text-foreground uppercase border border-white/10 rounded-md bg-zinc-900 px-2 py-0.5">After Hours</span>
        </Link>
        <div className="flex items-center gap-4">
          {!isTrainer && (
            <Link to={isTrainer ? "/trainer/dashboard" : "/student/notifications"} className="relative text-muted-foreground hover:text-primary transition-all active:scale-90">
              <Bell className="h-5 w-5" />
              {!isTrainer && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-black flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
          <button onClick={() => setMobileOpen(true)} className="text-foreground active:scale-90 transition-all">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Refined for Premium Feel) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 bg-background/90 backdrop-blur-md z-[100]" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="lg:hidden fixed top-0 right-0 h-full w-full max-w-[280px] bg-card border-l border-white/10 z-[101] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
               <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-display font-semibold text-lg text-foreground tracking-tight">Menu</h3>
                  <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"><X className="h-5 w-5" /></button>
               </div>
               <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {nav.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                      <Link 
                        key={item.path} 
                        to={item.path} 
                        onClick={() => setMobileOpen(false)} 
                        className={`flex items-center justify-between p-4 rounded-xl text-sm font-medium transition-all border ${active ? "bg-primary/10 border-primary/30 text-foreground" : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"}`}
                      >
                        <div className="flex items-center gap-4">
                           <item.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                           <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
               </nav>
               <div className="p-6 border-t border-white/5 space-y-4">
                  <div className="bg-zinc-900 p-5 rounded-2xl border border-white/5 mb-4">
                     <p className="text-xs font-semibold text-muted-foreground mb-1">Status</p>
                     <p className="text-xs font-semibold text-green-500 flex items-center gap-2">
                        <Activity className="h-3 w-3" /> Online
                     </p>
                  </div>
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold bg-destructive/10 text-destructive hover:bg-destructive hover:text-black transition-all">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation (Immersive Instagram Style) */}
      {!isAdmin && (
        <div className="lg:hidden fixed bottom-6 left-6 right-6 h-20 bg-card/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] z-40 flex items-center justify-around px-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {mobileBottomNav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="relative flex flex-col items-center justify-center w-full h-full group">
                {item.isAction ? (
                  <div className="absolute -top-6 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg border-4 border-card hover:scale-105 active:scale-95 transition-transform">
                    <item.icon className="h-6 w-6 text-black" />
                  </div>
                ) : (
                  <div className={`flex flex-col items-center gap-1.5 transition-all relative ${active ? "scale-110" : "scale-90 opacity-40 hover:opacity-100"}`}>
                    <item.icon className={`h-6 w-6 ${active ? "text-primary" : "text-foreground"}`} />
                    {active && (
                       <motion.div layoutId="bottom-glow" className="w-1.2 w-1.2 h-1.2 rounded-full bg-primary shadow-[0_0_10px_rgba(255,255,255,0.5)] mt-1" />
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? "lg:ml-[80px]" : "lg:ml-64"} pt-16 lg:pt-0 pb-24 lg:pb-0 relative`}>
        {/* Cinematic background glow */}
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,165,0,0.03),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(0,255,170,0.02),transparent_40%)] pointer-events-none" />
        
        <div className="relative z-10 min-h-screen">
           <AnimatePresence mode="wait">
             <motion.div 
               key={location.pathname} 
               initial={{ opacity: 0, x: 20 }} 
               animate={{ opacity: 1, x: 0 }} 
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.3, ease: "easeOut" }} 
               className="min-h-screen"
             >
               <Outlet />
             </motion.div>
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
