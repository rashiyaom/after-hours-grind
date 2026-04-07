import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, User, Dumbbell, ArrowLeft, ShieldCheck, Activity, Zap, Shield, Sparkles, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function SignupPage() {
  const [role, setRole] = useState<"student" | "trainer" | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center section-padding py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,165,0,0.1),transparent_70%)]" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 mb-6 group transition-all">
             <Flame className="h-10 w-10 text-primary drop-shadow-[0_0_15px_rgba(255,165,0,0.4)]" />
          </div>
          <h1 className="text-4xl font-display font-semibold text-foreground tracking-tight leading-none">Create Account</h1>
          <p className="text-xs text-muted-foreground mt-4">Join the After Hours community.</p>
        </div>

        <AnimatePresence mode="wait">
          {!role ? (
            <motion.div key="role" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground mb-8">Choose Your Role</p>
              {[
                { value: "student" as const, label: "Student / Athlete", desc: "Track progress & discover routines", icon: User },
                { value: "trainer" as const, label: "Gym Trainer", desc: "Guide students & assign protocols", icon: Dumbbell },
              ].map((r) => (
                <button 
                  key={r.value} 
                  onClick={() => setRole(r.value)} 
                  className={`w-full glass-card p-6 text-left flex items-center gap-6 group relative overflow-hidden transition-all hover:bg-white/5 border border-white/5`}
                >
                  <div className={`p-4 rounded-xl bg-background border border-white/10 group-hover:border-primary/40 transition-colors`}>
                    <r.icon className={`h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors`}>{r.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all`} />
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
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <button 
                onClick={() => setRole(null)} 
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary mb-8 transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Roles
              </button>
              
              <div className="glass-card p-8 space-y-6 relative overflow-hidden border border-white/5">
                <h2 className="text-xl font-display font-semibold text-foreground">
                   {role === "student" ? "Student Details" : "Trainer Details"}
                </h2>
                
                <div className="space-y-4">
                  {["Name", "Email", "Password"].map((field) => (
                    <div key={field}>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{field}</label>
                      <input 
                        type={field === "Password" ? "password" : field === "Email" ? "email" : "text"} 
                        placeholder={`Enter your ${field.toLowerCase()}`} 
                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" 
                      />
                    </div>
                  ))}
                  
                  {role === "student" ? (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">College ID</label>
                        <input placeholder="e.g. COL2024XXX" className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Height (cm)</label>
                          <input type="number" placeholder="175" className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Weight (kg)</label>
                          <input type="number" placeholder="70" className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Specialization</label>
                        <input placeholder="e.g. Strength & Conditioning" className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Experience (Yrs)</label>
                        <input type="number" placeholder="5" className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Certifications</label>
                        <input placeholder="e.g. NSCA, ACE, NASM" className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                      </div>
                    </>
                  )}
                  
                  <button 
                    onClick={() => navigate(role === "student" ? "/student/dashboard" : "/trainer/dashboard")} 
                    className="group w-full h-14 bg-foreground text-background rounded-xl font-display font-semibold transition-all flex items-center justify-center shadow-lg active:scale-95 space-x-2 hover:bg-primary hover:text-black overflow-hidden relative"
                  >
                    <span className="relative z-10">Create Account</span>
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
