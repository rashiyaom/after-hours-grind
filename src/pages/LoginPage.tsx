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

    const success = await login(email, password);
    setLoading(false);

    if (!success) {
      toast.error("Login failed. Please check your credentials.");
      return;
    }

    toast.success("Welcome back! Live backend sync enabled.");
    navigateByRole();
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
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <div className="absolute inset-0 bg-grid-pattern bg-center [mask-image:linear-gradient(to_bottom,white_5%,transparent_80%)]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.jpg" alt="THE afterhour socials" className="h-14 w-14 rounded-full border-2 border-neon-green" />
              <span className="text-2xl font-bold tracking-tighter text-white font-display">
                After-Hours Grind
              </span>
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-8 backdrop-blur-md"
          >
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white font-display">
                Secure Sign In
              </h1>
              <p className="mt-2 text-sm text-neutral-400">
                Access your personalized dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-neutral-300"
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
                  className="h-12 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 text-white placeholder-neutral-500 transition-colors focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-neutral-300"
                  >
                    Password
                  </label>
                  <Link
                    to="/reset-password"
                    className="text-xs text-neon-yellow hover:underline"
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
                    className="h-12 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 pr-12 text-white placeholder-neutral-500 transition-colors focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
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
                className="group relative flex h-12 w-full items-center justify-center rounded-lg bg-neon-green text-black font-bold transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
              className="font-medium text-neon-yellow hover:underline"
            >
              Request Access
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

