import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  Flame, Target, Trophy, Users, ArrowRight, Zap, 
  Calendar, BarChart3, Activity, Shield, Sparkles, 
  LogIn, ChevronLeft, ChevronRight, Play, CheckCircle
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useRef } from "react";

const features = [
  { icon: Calendar, title: "Structured Plans", desc: "Custom 28-day workout & diet plans crafted by elite trainers, tailored to your exact physiology." },
  { icon: Flame, title: "Streak Tracking", desc: "Build unshakeable consistency with daily streaks and earn exclusive badges for your milestones." },
  { icon: Trophy, title: "Leaderboards", desc: "Compete natively with your college community and dominate the elite tier rankings." },
  { icon: BarChart3, title: "Smart Dashboards", desc: "Visualize your transformation over time with our surgical precision data tracking." },
  { icon: Users, title: "Social Network", desc: "Share progress, follow peers, and build collective accountability within your circle." },
  { icon: Zap, title: "Milestone System", desc: "Unlock levels, optimize your routine, and stay relentlessly focused on your goal." },
];

const steps = [
  { num: "01", title: "Join the Network", desc: "Sign up with your credentials and define your primary fitness objectives." },
  { num: "02", title: "Get Your Plan", desc: "Connect with a trainer to receive your custom 28-day routine and diet." },
  { num: "03", title: "Execute Daily", desc: "Complete workouts, optimize nutrition, and hit your target steps." },
  { num: "04", title: "Prove Your Work", desc: "Submit daily photos and logs to maintain your streak and climb the ranks." },
];

const carouselSlides = [
  { title: "Real-time Analytics", desc: "Watch your progress map instantly as you log daily tasks. Stay informed and ahead of the curve.", color: "from-blue-500/20 to-transparent", border: "border-blue-500/20" },
  { title: "Elite Programming", desc: "Access the best custom plans tailored specifically for ambitious athletes.", color: "from-purple-500/20 to-transparent", border: "border-purple-500/20" },
  { title: "Social Accountability", desc: "Don't train alone. Post your proof, get verified, and celebrate with peers.", color: "from-emerald-500/20 to-transparent", border: "border-emerald-500/20" },
  { title: "Achievement Engine", desc: "Unlock exclusive badges by pushing past your perceived limits and staying consistent.", color: "from-amber-500/20 to-transparent", border: "border-amber-500/20" },
];

export default function LandingPage() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="bg-background selection:bg-primary selection:text-black min-h-screen font-sans overflow-x-hidden" ref={containerRef}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
               <Flame className="h-6 w-6 text-black" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tighter uppercase italic">After Hours</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Log In
            </Link>
            <Link to="/signup" className="text-sm font-bold bg-foreground text-background hover:bg-white hover:scale-105 active:scale-95 px-8 py-3 rounded-full transition-all shadow-xl">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[110vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto text-center px-6"
        >
          <motion.div 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.2, duration: 0.8 }}
             className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-10"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Limited Enrollment Active</span>
          </motion.div>
          
          <h1 className="text-7xl sm:text-8xl lg:text-[10rem] font-display font-semibold text-foreground tracking-tighter leading-[0.85] uppercase italic">
             Master Your<br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary/40">After Hours.</span>
          </h1>
          
          <p className="mt-12 text-lg sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            The premium accountability nexus for high-performers. <br className="hidden sm:block" />
            Track workouts, dominate leaderboards, and transform your physiology.
          </p>
          
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-4 bg-primary text-black px-12 py-6 rounded-full font-bold text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.15)]">
              Initialize Protocol <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-4 bg-white/5 border border-white/10 px-12 py-6 rounded-full text-sm font-bold text-foreground hover:bg-white/10 transition-all active:scale-95">
              <LogIn className="h-5 w-5 opacity-50" /> Access Portal
            </Link>
          </div>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0 }} 
           animate={{ opacity: 1 }} 
           transition={{ delay: 1.2, duration: 1 }} 
           className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.5em] vertical-text">Scroll_to_explore</p>
           <div className="w-[1px] h-20 bg-gradient-to-b from-primary/50 to-transparent" />
        </motion.div>
      </section>

      {/* Interactive UI Preview */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="bg-card border border-white/5 rounded-[4rem] p-12 lg:p-24 overflow-hidden relative group">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
             <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">
                <div className="space-y-8">
                   <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                      <Activity className="h-5 w-5 text-primary" />
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">Live Telemetry</span>
                   </div>
                   <h2 className="text-4xl sm:text-6xl font-display font-semibold tracking-tighter leading-tight uppercase italic font-bold">
                      Design that<br />drives action.
                   </h2>
                   <p className="text-muted-foreground text-xl leading-relaxed">
                      We've stripped away the noise. Every button, every chart, and every interaction is surgically engineered to keep you in the flow of your training.
                   </p>
                   <div className="flex gap-4">
                      {[1, 2, 3].map(i => (
                         <div key={i} className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }}
                               whileInView={{ width: "100%" }}
                               transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                               className="h-full bg-primary"
                            />
                         </div>
                      ))}
                   </div>
                </div>
                
                <div className="relative">
                   <motion.div 
                      initial={{ rotateY: 20, rotateX: 10, opacity: 0 }}
                      whileInView={{ rotateY: 0, rotateX: 0, opacity: 1 }}
                      transition={{ duration: 1 }}
                      className="bg-zinc-900 aspect-[4/3] rounded-3xl border border-white/10 shadow-2xl p-8 relative overflow-hidden"
                   >
                      <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                               <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                               <p className="text-xs font-bold text-muted-foreground uppercase opacity-50">Day 14 / 28</p>
                               <p className="text-sm font-bold">Push Session</p>
                            </div>
                         </div>
                         <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            <p className="text-xs font-bold text-primary">82%</p>
                         </div>
                      </div>
                      
                      <div className="space-y-4">
                         {[
                           { name: "Bench Press", sets: "4x10", color: "bg-primary" },
                           { name: "Incline Dumbbell", sets: "3x12", color: "bg-primary/60" },
                           { name: "Cable Flyes", sets: "3x15", color: "bg-primary/30" }
                         ].map((ex, i) => (
                           <div key={i} className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/5">
                              <p className="text-sm font-bold uppercase italic">{ex.name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground">{ex.sets}</p>
                           </div>
                         ))}
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-zinc-900 to-transparent">
                         <button className="w-full bg-foreground text-background py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl">Complete Session</button>
                      </div>
                   </motion.div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Stats Marquee / Social Proof */}
      <section className="border-y border-white/5 bg-white/[0.02] py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x divide-white/5 text-center">
            <div>
               <h3 className="text-4xl font-display font-semibold text-foreground">10k+</h3>
               <p className="text-sm text-muted-foreground mt-2 font-medium">Active Students</p>
            </div>
            <div>
               <h3 className="text-4xl font-display font-semibold text-foreground">1M+</h3>
               <p className="text-sm text-muted-foreground mt-2 font-medium">Workouts Logged</p>
            </div>
            <div>
               <h3 className="text-4xl font-display font-semibold text-foreground">500+</h3>
               <p className="text-sm text-muted-foreground mt-2 font-medium">Elite Trainers</p>
            </div>
            <div>
               <h3 className="text-4xl font-display font-semibold text-foreground">99%</h3>
               <p className="text-sm text-muted-foreground mt-2 font-medium">Completion Rate</p>
            </div>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="py-32 px-6 overflow-hidden relative">
         <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-16">
               <div className="max-w-xl">
                  <h2 className="text-3xl sm:text-5xl font-display font-semibold tracking-tight mb-4">A powerful engine<br/>for your success.</h2>
                  <p className="text-muted-foreground text-lg">Every feature is designed with zero friction to keep you focused on what matters: the work.</p>
               </div>
               <div className="hidden md:flex items-center gap-3">
                  <button onClick={scrollPrev} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
                     <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={scrollNext} className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform">
                     <ChevronRight className="h-5 w-5" />
                  </button>
               </div>
            </div>

            <div className="overflow-hidden" ref={emblaRef}>
               <div className="flex gap-6 pb-8 touch-pan-y">
                  {carouselSlides.map((slide, i) => (
                     <div key={i} className="flex-[0_0_85%] md:flex-[0_0_40%] lg:flex-[0_0_30%] min-w-0">
                        <div className={`h-[400px] rounded-3xl p-8 flex flex-col justify-between bg-card border ${slide.border} relative overflow-hidden group`}>
                           <div className={`absolute inset-0 bg-gradient-to-br ${slide.color} opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
                           <div className="w-14 h-14 rounded-2xl bg-background border border-white/5 flex items-center justify-center shadow-lg relative z-10 group-hover:scale-110 transition-transform duration-500">
                              <BarChart3 className="h-6 w-6 text-foreground" />
                           </div>
                           <div className="relative z-10">
                              <h3 className="text-2xl font-semibold mb-3">{slide.title}</h3>
                              <p className="text-muted-foreground leading-relaxed">{slide.desc}</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-24 px-6 bg-zinc-950/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-20 text-center">
            <h2 className="text-4xl sm:text-5xl font-display font-semibold tracking-tight">Everything you need.</h2>
            <p className="text-muted-foreground mt-4 text-lg">No bloat. Just the tools required to build discipline.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div 
                 key={f.title} 
                 initial={{ opacity: 0, y: 20 }} 
                 whileInView={{ opacity: 1, y: 0 }} 
                 viewport={{ once: true }} 
                 transition={{ delay: i * 0.1 }} 
                 className="bg-card border border-white/5 p-8 rounded-3xl hover:border-primary/20 transition-all group relative"
              >
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                <div className="relative z-10">
                   <div className="p-3 rounded-xl bg-white/5 w-fit mb-6 group-hover:bg-primary/10 transition-colors">
                     <f.icon className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                   </div>
                   <h3 className="text-xl font-semibold text-foreground tracking-tight mb-2">{f.title}</h3>
                   <p className="text-sm text-muted-foreground leading-relaxed font-medium">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Workflow */}
      <section id="how-it-works" className="py-32 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl sm:text-5xl font-display font-semibold tracking-tight">How it works.</h2>
          </div>
          
          <div className="relative space-y-6">
            {steps.map((s, i) => (
              <motion.div 
                 key={s.num} 
                 initial={{ opacity: 0, y: 20 }} 
                 whileInView={{ opacity: 1, y: 0 }} 
                 viewport={{ once: true }} 
                 transition={{ delay: i * 0.1 }} 
                 className="flex flex-col sm:flex-row items-start sm:items-center gap-8 p-8 sm:p-10 rounded-[2.5rem] bg-card border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                   <span className="text-xl font-bold text-muted-foreground group-hover:text-primary transition-colors">{s.num}</span>
                </div>
                <div className="flex-1">
                   <h3 className="text-2xl font-semibold tracking-tight mb-2 flex items-center gap-3">
                      {s.title}
                      <ArrowRight className="h-5 w-5 text-transparent group-hover:text-primary transition-colors -translate-x-4 group-hover:translate-x-0" />
                   </h3>
                   <p className="text-base text-muted-foreground font-medium leading-relaxed max-w-2xl">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual Personas */}
      <section className="py-24 px-6 bg-zinc-950/50 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { role: "For Students", items: ["Follow custom routines", "Track daily progress", "Climb the leaderboard", "Earn achievements"], icon: Target, isPrimary: false },
              { role: "For Trainers", items: ["Manage all clients", "Verify daily uploads", "Build recurring plans", "Track student health"], icon: Shield, isPrimary: true },
            ].map((r) => (
              <motion.div 
                 key={r.role} 
                 initial={{ opacity: 0, scale: 0.95 }} 
                 whileInView={{ opacity: 1, scale: 1 }} 
                 viewport={{ once: true }} 
                 className={`p-10 sm:p-14 rounded-[3rem] relative overflow-hidden group border ${r.isPrimary ? 'bg-primary/5 border-primary/20' : 'bg-card border-white/5'}`}
              >
                <r.icon className={`h-12 w-12 mb-8 ${r.isPrimary ? 'text-primary' : 'text-foreground'}`} />
                <h3 className="text-3xl sm:text-4xl font-display font-semibold text-foreground mb-8 tracking-tight">{r.role}</h3>
                <ul className="space-y-4">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-center gap-4 text-base font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      <CheckCircle className={`h-5 w-5 ${r.isPrimary ? 'text-primary' : 'text-foreground/30'}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Global CTA */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 glass-card p-12 sm:p-24 rounded-[3rem] border border-primary/20">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl sm:text-6xl font-display font-semibold tracking-tight leading-tight mb-6">
               Ready to commit?
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto">
               Join a community of ambitious individuals who value action over words. Your transformation starts here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Link 
                  to="/signup" 
                  className="w-full sm:w-auto bg-foreground text-background px-10 py-5 rounded-full font-bold text-sm hover:scale-105 transition-all shadow-xl hover:shadow-2xl"
               >
                 Create an Account
               </Link>
               <Link 
                  to="/login" 
                  className="w-full sm:w-auto bg-transparent border border-white/10 text-foreground px-10 py-5 rounded-full font-bold text-sm hover:bg-white/5 transition-all"
               >
                 Sign In
               </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6 sm:px-12 bg-background">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                 <Flame className="h-5 w-5 text-primary" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">After Hours</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
               The premium platform for maintaining consistency, logging workouts, and connecting with elite trainers.
            </p>
          </div>
          <div className="flex flex-col gap-4">
             <p className="text-sm font-semibold text-foreground mb-2">Platform</p>
             <Link to="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</Link>
             <Link to="/trainers" className="text-sm text-muted-foreground hover:text-primary transition-colors">Trainers</Link>
             <Link to="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
          </div>
          <div className="flex flex-col gap-4">
             <p className="text-sm font-semibold text-foreground mb-2">Legal</p>
             <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
             <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
             <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-8">
           <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} After Hours. All rights reserved.</p>
           <div className="flex items-center gap-6 mt-4 sm:mt-0">
             <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Activity className="h-5 w-5" /></a>
             <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Users className="h-5 w-5" /></a>
           </div>
        </div>
      </footer>
    </div>
  );
}
