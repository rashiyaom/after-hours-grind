import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, User, Dumbbell, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/hooks/useStore";
import { toast } from "sonner";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

export default function SignupPage() {
  const [role, setRole] = useState<"student" | "trainer" | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAppStore();

  // Controlled form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    collegeId: "",
    height: "",
    weight: "",
    fitnessGoal: "",
    specialization: "",
    whatsappNumber: "",
    experience: "",
    certifications: "",
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
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Min 8 characters";
    
    if (role === "student") {
      if (!form.collegeId.trim()) errs.collegeId = "College ID is required";
    }
    if (role === "trainer") {
      if (!form.specialization.trim()) errs.specialization = "Specialization is required";
      if (!form.whatsappNumber.trim()) errs.whatsappNumber = "WhatsApp number is required";
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!role || !validate()) return;
    
    setLoading(true);
    try {
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        collegeId: form.collegeId || undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        fitnessGoal: form.fitnessGoal || undefined,
        specialization: form.specialization || undefined,
        whatsappNumber: form.whatsappNumber || undefined,
        experience: form.experience ? parseInt(form.experience) : undefined,
        certifications: form.certifications || undefined,
      });
      toast.success("Account created successfully!");
      navigate(role === "student" ? "/student/onboarding" : "/trainer/dashboard");
    } catch {
      toast.error("Signup failed. Please try again.");
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
             <img src="/logo.jpg" alt="TheAfterHour Socials" className="h-14 w-14 object-cover rounded-xl" />
          </div>
          <h1 className="text-4xl font-display font-semibold text-foreground tracking-tight leading-none">Create Account</h1>
          <p className="text-xs text-muted-foreground mt-4">Join TheAfterHour Socials community.</p>
        </div>

        <AnimatePresence mode="wait">
          {!role ? (
            <motion.div key="role" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={LUXURY_TWEEN_MEDIUM} className="space-y-6">
              <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground mb-8">Choose Your Role</p>
              {[
                { value: "student" as const, label: "Student / Athlete", desc: "Track progress & discover routines", icon: User },
                { value: "trainer" as const, label: "Gym Trainer", desc: "Guide students & assign protocols", icon: Dumbbell },
              ].map((r) => (
                <button 
                  key={r.value} 
                  onClick={() => setRole(r.value)} 
                  className="w-full glass-card p-6 text-left flex items-center gap-6 group relative overflow-hidden transition-all hover:bg-white/5 border border-white/5"
                >
                  <div className="p-4 rounded-xl bg-background border border-white/10 group-hover:border-primary/40 transition-colors">
                    <r.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{r.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
              <div className="pt-8 text-center">
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary font-medium hover:underline underline-offset-4">Sign In</Link>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={LUXURY_TWEEN_MEDIUM}>
              <button 
                onClick={() => { setRole(null); setErrors({}); }} 
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary mb-8 transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Roles
              </button>
              
              <div className="glass-card p-8 space-y-6 relative overflow-hidden border border-white/5">
                <h2 className="text-xl font-display font-semibold text-foreground">
                   {role === "student" ? "Student Details" : "Trainer Details"}
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
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                    <input type="password" value={form.password} onChange={e => updateField("password", e.target.value)} placeholder="Min 8 characters" className={fieldClass("password")} />
                    {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                  </div>
                  
                  {role === "student" ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Specialization</label>
                        <input value={form.specialization} onChange={e => updateField("specialization", e.target.value)} placeholder="e.g. Strength & Conditioning" className={fieldClass("specialization")} />
                        {errors.specialization && <p className="text-xs text-red-400 mt-1">{errors.specialization}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">WhatsApp Number</label>
                        <input value={form.whatsappNumber} onChange={e => updateField("whatsappNumber", e.target.value)} placeholder="e.g. +919876543210" className={fieldClass("whatsappNumber")} />
                        {errors.whatsappNumber && <p className="text-xs text-red-400 mt-1">{errors.whatsappNumber}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Experience (Yrs)</label>
                        <input type="number" value={form.experience} onChange={e => updateField("experience", e.target.value)} placeholder="5" className={fieldClass("experience")} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Certifications</label>
                        <input value={form.certifications} onChange={e => updateField("certifications", e.target.value)} placeholder="e.g. NSCA, ACE, NASM" className={fieldClass("certifications")} />
                      </div>
                    </>
                  )}
                  
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
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
