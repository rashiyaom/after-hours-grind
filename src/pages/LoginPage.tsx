import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/hooks/useStore";
import { toast } from "sonner";
import { Student, UserRole } from "@/types";
import { LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const success = login(email, password, role);
      setLoading(false);

      if (success) {
        toast.success("Welcome back!");
        const currentSession = useAppStore.getState();
        const currentUser = currentSession.session.currentUser;
        switch (role) {
          case "student": {
            const student = currentUser?.role === "student" ? (currentUser as Student) : null;

            if (!student || student.onboardingStatus !== "completed") {
              navigate("/student/onboarding");
              break;
            }

            navigate("/student/dashboard");
            break;
          }
          case "trainer":
            navigate("/trainer/dashboard");
            break;
          case "admin":
            navigate("/admin/dashboard");
            break;
          default:
            navigate("/");
        }
      } else {
        toast.error("Login failed. Please check your credentials and role.");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center section-padding py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,165,0,0.1),transparent_70%)]" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={LUXURY_TWEEN_SLOW} className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-[#4DD2FF]/10 mb-6 group transition-all overflow-hidden border border-[#4DD2FF]/20 shadow-[0_0_15px_rgba(77,210,255,0.15)]">
             <img src="/logo.jpg" alt="The After Hours Socials" className="h-14 w-14 object-cover rounded-xl" />
          </div>
          <h1 className="text-4xl font-display font-semibold text-foreground tracking-tight">Sign In</h1>
          <p className="text-xs text-muted-foreground mt-4">Welcome back to The After Hours Socials</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6 relative border border-white/5">

          {/* Role toggle */}
          <div className="flex gap-2 p-1.5 bg-background rounded-xl">
            {(["student", "trainer", "admin"] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                  role === r ? "bg-card text-primary shadow-md border border-white/5" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "admin" && <ShieldCheck className="h-4 w-4" />}
                {r}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                 Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`${role}@test.com`}
                required
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                 Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={1}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="button" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 relative overflow-hidden rounded-xl bg-primary text-black font-semibold transition-all hover:opacity-90 active:scale-95 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              New user?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline underline-offset-4">
                Create Account
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
