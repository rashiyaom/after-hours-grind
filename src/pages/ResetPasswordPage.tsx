import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { forgotPasswordBackend, resetPasswordBackend, verifyForgotPasswordCodeBackend } from "@/lib/api";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const isResetMode = token.length > 0;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [forgotStep, setForgotStep] = useState<"request" | "verify">("request");

  const title = useMemo(() => (isResetMode ? "Set New Password" : "Forgot Password"), [isResetMode]);

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordBackend(email.trim());
      setForgotStep("verify");
      toast.success("If your email exists, a verification code has been sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    const code = verificationCode.trim();
    if (!/^\d{6}$/.test(code)) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      await verifyForgotPasswordCodeBackend(email.trim(), code);
      toast.success("Code verified. A second email with reset instructions has been sent.");
      navigate("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Code verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordBackend(token, newPassword);
      toast.success("Password has been reset. Please sign in.");
      navigate("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-8">
        <h1 className="text-2xl font-semibold text-white mb-2">{title}</h1>
        <p className="text-sm text-white/60 mb-6">
          {isResetMode ? "Enter a new password for your account." : "Step 1: request a code. Step 2: verify code to receive reset instructions."}
        </p>

        {!isResetMode ? (
          forgotStep === "request" ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-white"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary text-black py-3 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-white"
                required
              />
              <input
                type="text"
                placeholder="6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-white tracking-[0.2em]"
                inputMode="numeric"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary text-black py-3 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
              <button
                type="button"
                onClick={() => setForgotStep("request")}
                className="w-full rounded-xl border border-white/20 text-white py-3 text-sm font-medium"
              >
                Back
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-white"
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-white"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary text-black py-3 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-6 text-sm text-white/70">
          <Link to="/login" className="hover:text-primary transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
