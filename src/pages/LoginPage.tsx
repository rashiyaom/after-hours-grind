import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/hooks/useStore";
import { toast } from "sonner";
import { Student } from "@/types";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigateByRole = () => {
    const currentSession = useAppStore.getState();
    const currentUser = currentSession.session.currentUser;
    switch (currentUser?.role) {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);

    try {
      const success = await login(email, password);
      setLoading(false);

      if (!success) {
        toast.error("Login failed. Please check your credentials.");
        return;
      }

      toast.success("Welcome back! Live backend sync enabled.");
      
      // Wait a tick for state to update, then navigate based on current user
      setTimeout(() => {
        const { session } = useAppStore.getState();
        const user = session.currentUser;
        if (!user) {
          navigate("/");
          return;
        }
        
        if (user.role === "student") {
          navigate("/student/dashboard");
        } else if (user.role === "trainer") {
          navigate("/trainer/dashboard");
        } else if (user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      }, 100);
    } catch (err) {
      setLoading(false);
      toast.error("An unexpected error occurred");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top,rgba(201,248,90,0.12),transparent_28%),linear-gradient(180deg,#040404_0%,#090909_45%,#050505_100%)] text-white">
      <div className="absolute inset-0 bg-grid-pattern bg-center opacity-[0.35] [mask-image:linear-gradient(to_bottom,white_8%,transparent_82%)]" />
      <div className="absolute -top-24 right-[-8rem] h-80 w-80 rounded-full bg-[#C9F85A]/20 blur-[120px]" />
      <div className="absolute -bottom-28 left-[-8rem] h-96 w-96 rounded-full bg-[#4DD2FF]/10 blur-[140px]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.jpg" alt="THE afterhour socials" className="h-14 w-14 rounded-full border-2 border-[#C9F85A] shadow-[0_0_40px_rgba(201,248,90,0.25)]" />
              <span className="text-2xl font-bold tracking-tighter text-white font-display drop-shadow-[0_0_16px_rgba(201,248,90,0.18)]">
                After-Hours Grind
              </span>
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-2xl shadow-[0_30px_120px_rgba(0,0,0,0.55)] hover:border-[#C9F85A]/35 transition-colors"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[#C9F85A]/20 bg-[#C9F85A]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C9F85A]">
                Secure access
              </div>
              <h1 className="text-3xl font-bold text-white font-display">
                Secure Sign In
              </h1>
              <p className="mt-2 text-sm text-white/60">
                Access your personalized dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-white/75"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-white placeholder:text-white/30 transition-colors focus:border-[#C9F85A]/60 focus:outline-none focus:ring-2 focus:ring-[#C9F85A]/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-white/75"
                  >
                    Password
                  </label>
                  <Link
                    to="/reset-password"
                    className="text-xs text-[#C9F85A] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={1}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 px-4 pr-12 text-white placeholder:text-white/30 transition-colors focus:border-[#C9F85A]/60 focus:outline-none focus:ring-2 focus:ring-[#C9F85A]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#C9F85A]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex h-12 w-full items-center justify-center rounded-2xl bg-[#C9F85A] text-[#081100] font-black shadow-[0_10px_40px_rgba(201,248,90,0.22)] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </motion.div>

          <motion.p variants={itemVariants} className="mt-8 text-center text-sm text-neutral-400">
            Don't have an account?{" "}
            <Link
              to="/request-access"
              className="font-medium text-[#C9F85A] hover:underline"
            >
              Request Access
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

