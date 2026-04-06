import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Target, Trophy, Users, ArrowRight, Zap, Calendar, BarChart3, CheckCircle } from "lucide-react";

const features = [
  { icon: Calendar, title: "Daily Mission Plans", desc: "Custom 28-day workout & diet plans from your trainer" },
  { icon: Flame, title: "Streak Tracking", desc: "Build consistency with daily streaks and fire badges" },
  { icon: Trophy, title: "Leaderboards", desc: "Compete with your college community and climb ranks" },
  { icon: BarChart3, title: "Progress Analytics", desc: "Track your transformation with visual dashboards" },
  { icon: Users, title: "Social Feed", desc: "Share progress, follow peers, build accountability" },
  { icon: Zap, title: "Gamified Goals", desc: "Earn badges, unlock milestones, stay motivated" },
];

const steps = [
  { num: "01", title: "Sign Up", desc: "Join with your college ID and set your fitness goals" },
  { num: "02", title: "Get Assigned", desc: "Your trainer builds a custom plan tailored to you" },
  { num: "03", title: "Execute Daily", desc: "Complete workouts, follow diet, hit your steps" },
  { num: "04", title: "Prove It", desc: "Upload proof, maintain streaks, climb the leaderboard" },
];

export default function LandingPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
        <div className="relative z-10 max-w-4xl mx-auto text-center section-padding py-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-card/40 backdrop-blur-sm mb-8">
              <Flame className="h-3.5 w-3.5 text-streak" />
              <span className="text-xs text-muted-foreground">Discipline compounds.</span>
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-bold text-foreground tracking-tight leading-[0.9]">
              THE AFTER<br />HOURS
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              The fitness accountability platform for students who grind when no one's watching.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-xl font-medium text-sm hover:bg-foreground/90 transition-all">
                Start Your Streak <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 border border-border px-8 py-3.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all">
                Log In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 section-padding">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">Everything you need to<br />stay in motion.</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card-hover p-6">
                <div className="p-2.5 rounded-xl bg-accent w-fit mb-4">
                  <f.icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 section-padding bg-card/30">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">Proof over promises.</h2>
          </motion.div>
          <div className="space-y-6">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-start gap-6 p-6 rounded-2xl hover:bg-accent/30 transition-colors">
                <span className="text-3xl font-display font-bold text-muted-foreground/30">{s.num}</span>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Student vs Trainer */}
      <section className="py-24 section-padding">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">Two roles. One mission.</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { role: "Student", items: ["Follow daily plans", "Track streaks & steps", "Upload proof", "Compete on leaderboard", "Earn badges"], icon: Target },
              { role: "Trainer", items: ["Build custom plans", "Assign to students", "Review progress", "Approve check-ins", "Shape discipline"], icon: Users },
            ].map((r) => (
              <motion.div key={r.role} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-8">
                <r.icon className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-xl font-display font-bold text-foreground mb-4">{r.role}</h3>
                <ul className="space-y-3">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-foreground/40" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 section-padding">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Flame className="h-10 w-10 text-streak mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">Built after hours.</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">Join the community of students who chose discipline over comfort. Your transformation starts tonight.</p>
            <Link to="/signup" className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-xl font-medium text-sm hover:bg-foreground/90 transition-all">
              Join Now <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 section-padding">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-streak" />
            <span className="font-display font-bold text-sm text-foreground">THE AFTER HOURS</span>
          </div>
          <p className="text-xs text-muted-foreground">Stay in motion. © 2024</p>
        </div>
      </footer>
    </div>
  );
}
