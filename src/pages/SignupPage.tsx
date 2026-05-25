import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/hooks/useStore";
import { toast } from "sonner";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAppStore();

  // Controlled form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    collegeId: "",
    height: "",
    weight: "",
    fitnessGoal: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
    if (!form.phoneNumber.trim()) errs.phoneNumber = "Phone number is required";
    else if (!/^\+?[0-9]{8,15}$/.test(form.phoneNumber.trim())) errs.phoneNumber = "Invalid phone number";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Min 8 characters";
    if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    
    if (!form.collegeId.trim()) errs.collegeId = "College ID is required";
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      await signup({
        name: form.name,
        email: form.email,
        phoneNumber: form.phoneNumber,
        password: form.password,
        role: "STUDENT",
        collegeId: form.collegeId || undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        fitnessGoal: form.fitnessGoal || undefined,
      });
      toast.success("Account created successfully!");
      navigate("/student/onboarding");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (field: string) =>
    `w-full bg-background border ${errors[field] ? "border-red-500/50" : "border-white/10"} rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center section-padding py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,165,0,0.1),transparent_70%)]" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={LUXURY_TWEEN_SLOW} className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-[#4DD2FF]/10 mb-6 group transition-all overflow-hidden border border-[#4DD2FF]/20 shadow-[0_0_15px_rgba(77,210,255,0.15)]">
             <img src="/logo.jpg" alt="THE afterhour socials" className="h-14 w-14 object-cover rounded-xl" />
          </div>
          <h1 className="text-4xl font-display font-semibold text-foreground tracking-tight leading-none">Create Account</h1>
          <p className="text-xs text-muted-foreground mt-4">Join THE afterhour socials community.</p>
        </div>

        <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={LUXURY_TWEEN_MEDIUM}>
          <div className="glass-card p-8 space-y-6 relative overflow-hidden border border-white/5">
            <h2 className="text-xl font-display font-semibold text-foreground">
               Student Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
                <input type="text" value={form.name} onChange={e => updateField("name", e.target.value)} placeholder="Enter your name" className={fieldClass("name")} />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                <input type="email" value={form.email} onChange={e => updateField("email", e.target.value)} placeholder="Enter your email" className={fieldClass("email")} />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone Number</label>
                <input type="tel" value={form.phoneNumber} onChange={e => updateField("phoneNumber", e.target.value)} placeholder="e.g. +919876543210" className={fieldClass("phoneNumber")} />
                {errors.phoneNumber && <p className="text-xs text-red-400 mt-1">{errors.phoneNumber}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                <input type="password" value={form.password} onChange={e => updateField("password", e.target.value)} placeholder="Min 8 characters" className={fieldClass("password")} />
                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={e => updateField("confirmPassword", e.target.value)} placeholder="Re-enter your password" className={fieldClass("confirmPassword")} />
                {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">College ID</label>
                <input value={form.collegeId} onChange={e => updateField("collegeId", e.target.value)} placeholder="e.g. COL2024XXX" className={fieldClass("collegeId")} />
                {errors.collegeId && <p className="text-xs text-red-400 mt-1">{errors.collegeId}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Height (cm)</label>
                  <input type="number" value={form.height} onChange={e => updateField("height", e.target.value)} placeholder="175" className={fieldClass("height")} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Weight (kg)</label>
                  <input type="number" value={form.weight} onChange={e => updateField("weight", e.target.value)} placeholder="70" className={fieldClass("weight")} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Fitness Goal</label>
                <input value={form.fitnessGoal} onChange={e => updateField("fitnessGoal", e.target.value)} placeholder="e.g. Build lean muscle" className={fieldClass("fitnessGoal")} />
              </div>
              
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="group w-full h-14 bg-foreground text-background rounded-xl font-display font-semibold transition-all flex items-center justify-center shadow-lg active:scale-95 space-x-2 hover:bg-primary hover:text-black overflow-hidden relative disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </div>
                ) : (
                  <span className="relative z-10">Create Account</span>
                )}
              </button>

              <div className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary font-medium hover:underline underline-offset-4">Sign In</Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
