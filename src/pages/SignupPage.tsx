import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, User, Dumbbell, ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function SignupPage() {
  const [role, setRole] = useState<"student" | "trainer" | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center section-padding py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Flame className="h-8 w-8 text-streak mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground">Join the grind</h1>
          <p className="text-sm text-muted-foreground mt-1">Your transformation starts now</p>
        </div>

        <AnimatePresence mode="wait">
          {!role ? (
            <motion.div key="role" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-center text-sm text-muted-foreground mb-4">I am a...</p>
              {[
                { value: "student" as const, label: "Student", desc: "Follow plans, track progress, compete", icon: User },
                { value: "trainer" as const, label: "Gym Trainer", desc: "Build plans, assign students, review", icon: Dumbbell },
              ].map((r) => (
                <button key={r.value} onClick={() => setRole(r.value)} className="w-full glass-card-hover p-6 text-left flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-accent">
                    <r.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                </button>
              ))}
              <p className="text-center text-xs text-muted-foreground mt-4">
                Already have an account?{" "}
                <Link to="/login" className="text-foreground hover:underline">Log in</Link>
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <button onClick={() => setRole(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="glass-card p-8 space-y-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{role} Signup</p>
                {["Name", "Email", "Password"].map((field) => (
                  <div key={field}>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{field}</label>
                    <input type={field === "Password" ? "password" : field === "Email" ? "email" : "text"} placeholder={field} className="w-full mt-1.5 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                ))}
                {role === "student" ? (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">College ID</label>
                      <input placeholder="COL2024XXX" className="w-full mt-1.5 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider">Height (cm)</label>
                        <input type="number" placeholder="175" className="w-full mt-1.5 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider">Weight (kg)</label>
                        <input type="number" placeholder="70" className="w-full mt-1.5 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">Fitness Goal</label>
                      <select className="w-full mt-1.5 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                        <option>Build lean muscle</option>
                        <option>Lose fat</option>
                        <option>Improve endurance</option>
                        <option>General fitness</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">Specialization</label>
                      <input placeholder="Strength & Conditioning" className="w-full mt-1.5 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">Years of Experience</label>
                      <input type="number" placeholder="5" className="w-full mt-1.5 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">Certifications</label>
                      <input placeholder="NSCA, ACE, etc." className="w-full mt-1.5 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                  </>
                )}
                <button onClick={() => navigate(role === "student" ? "/student/dashboard" : "/trainer/dashboard")} className="w-full bg-foreground text-background py-3 rounded-xl font-medium text-sm hover:bg-foreground/90 transition-colors mt-2">
                  Create Account
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
