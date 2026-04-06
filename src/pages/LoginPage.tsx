import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center section-padding py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Flame className="h-8 w-8 text-streak mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Continue your streak</p>
        </div>
        <div className="glass-card p-8 space-y-5">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Email</label>
            <input type="email" placeholder="you@college.edu" className="w-full mt-2 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Password</label>
            <div className="relative mt-2">
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Link to="/student/dashboard" className="block w-full bg-foreground text-background text-center py-3 rounded-xl font-medium text-sm hover:bg-foreground/90 transition-colors">
            Log In
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-foreground hover:underline">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
