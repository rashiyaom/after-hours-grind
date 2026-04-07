import { Outlet, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Features", path: "/#features" },
  { label: "How it Works", path: "/#how-it-works" },
];

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-streak" />
            <span className="font-display font-bold text-lg tracking-tight text-foreground">THE AFTER HOURS</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a key={l.path} href={l.path} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
            <Link to="/signup" className="text-sm bg-foreground text-background px-4 py-2 rounded-lg font-medium hover:bg-foreground/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="pt-16"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
