import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Check, Play, Sparkles, TrendingUp, Users, Timer } from "lucide-react";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
};

function TiltCard({ children, className = "" }: TiltCardProps) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const smoothRotateX = useSpring(rotateX, { stiffness: 180, damping: 16, mass: 0.6 });
  const smoothRotateY = useSpring(rotateY, { stiffness: 180, damping: 16, mass: 0.6 });
  const glareX = useTransform(smoothRotateY, [-14, 14], [0, 100]);
  const glareY = useTransform(smoothRotateX, [-14, 14], [100, 0]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    rotateY.set((px - 0.5) * 18);
    rotateX.set((0.5 - py) * 16);
  };

  const resetTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <div className="[perspective:1200px]">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
        onBlur={resetTilt}
        style={{ rotateX: smoothRotateX, rotateY: smoothRotateY, transformStyle: "preserve-3d" }}
        className={`relative overflow-hidden rounded-3xl border border-black/10 bg-white/70 shadow-[0_25px_80px_rgba(10,15,20,0.12)] backdrop-blur-xl ${className}`}
      >
        <motion.div
          aria-hidden
          style={{
            left: useTransform(glareX, (v) => `${v}%`),
            top: useTransform(glareY, (v) => `${v}%`),
            transform: "translate(-50%, -50%)",
          }}
          className="pointer-events-none absolute h-40 w-40 rounded-full bg-white/40 blur-2xl"
        />
        <div className="relative" style={{ transform: "translateZ(22px)" }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

const minimalFeatures = [
  "Daily plan focus mode",
  "Clean streak intelligence",
  "Smart social accountability",
];

const metrics = [
  { label: "Active streaks", value: "12,840", accent: "bg-[#f5c98f]" },
  { label: "Proof uploads", value: "1.4M", accent: "bg-[#9fd5c9]" },
  { label: "Completion rate", value: "97%", accent: "bg-[#b3c1ed]" },
];

const experiencePillars = [
  {
    icon: TrendingUp,
    title: "Calm Analytics",
    text: "High-signal charts with clear next actions, no dashboard fatigue.",
    color: "from-[#e6f2ea] to-[#f8f6f1]",
  },
  {
    icon: Users,
    title: "Quiet Community",
    text: "Social momentum without noise. Proof posts stay focused and meaningful.",
    color: "from-[#f5ede2] to-[#f8f6f1]",
  },
  {
    icon: Timer,
    title: "Time Aware",
    text: "Built for busy routines with structured reminders and frictionless check-ins.",
    color: "from-[#e8ecf9] to-[#f8f6f1]",
  },
];

const workflow = [
  { step: "01", title: "Set the pace", description: "Choose your target rhythm and preferred daily window." },
  { step: "02", title: "Show up", description: "Complete workouts, upload proof, and keep streak pressure healthy." },
  { step: "03", title: "Climb quietly", description: "Progress moves to charts and leaderboard with zero busywork." },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-[#f8f6f1] text-[#111111]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#d7e5de] blur-3xl" />
        <div className="absolute right-0 top-0 h-[26rem] w-[26rem] rounded-full bg-[#efe3cf] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#dbe1ef] blur-3xl" />
        <div className="absolute bottom-24 right-1/4 h-40 w-40 rounded-full bg-[#f4d7d1] blur-3xl" />
      </div>

      <section className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-28 md:grid-cols-2 md:items-center md:gap-16 md:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/70">
            <Sparkles className="h-3.5 w-3.5" />
            Minimal Fitness OS
          </div>

          <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Designed to feel calm.
            <span className="block text-black/55">Built to keep you consistent.</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-black/70 sm:text-lg">
            After Hours strips everything down to what actually matters: your plan, your streak, your proof, your progress.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-black/20 bg-white/70 px-7 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-white"
            >
              <Play className="h-4 w-4" />
              Sign In
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="md:justify-self-end"
        >
          <TiltCard className="p-6 sm:p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">Today</p>
                <span className="rounded-full bg-black px-3 py-1 text-[11px] font-semibold text-white">82% complete</span>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
                <p className="text-sm font-medium text-black/60">Focus Session</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">Push + Core</p>
              </div>

              <div className="space-y-3">
                {minimalFeatures.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/65 px-4 py-3">
                    <div className="rounded-full bg-black/90 p-1 text-white">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm font-medium text-black/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </TiltCard>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-20 md:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          className="grid gap-4 rounded-3xl border border-black/10 bg-white/60 p-5 backdrop-blur-xl sm:grid-cols-3 sm:p-7"
        >
          {metrics.map((item, index) => (
            <div key={item.label} className="rounded-2xl border border-black/10 bg-white/80 p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${item.accent}`} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">{item.label}</p>
              </div>
              <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{item.value}</p>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, delay: 0.12 * index }}
                className="mt-4 h-[3px] rounded-full bg-gradient-to-r from-black/30 via-black/10 to-transparent"
              />
            </div>
          ))}
        </motion.div>
      </section>

      <section id="features" className="relative mx-auto max-w-7xl px-6 pb-20 md:px-10 lg:px-14">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: "Zero clutter", body: "One clear action path each day. No dashboard noise." },
            { title: "Soft depth", body: "Layered cards and subtle shadows create premium focus." },
            { title: "Live feel", body: "3D mouse response makes your plan feel tactile and active." },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <TiltCard className="h-full p-6">
                <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-black/65">{item.body}</p>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 md:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Minimal, but expressive</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/65 sm:text-base">
            The interface is intentionally light, but never flat. Every interaction adds subtle depth so the product feels alive while staying easy on the eyes.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {experiencePillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <TiltCard className={`h-full bg-gradient-to-b p-6 ${pillar.color}`}>
                <div className="mb-5 inline-flex rounded-xl border border-black/10 bg-white/80 p-2.5">
                  <pillar.icon className="h-5 w-5 text-black/80" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-black/65">{pillar.text}</p>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl px-6 pb-24 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
        </motion.div>

        <div className="space-y-4">
          {workflow.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="rounded-2xl border border-black/10 bg-white/70 p-5 backdrop-blur-xl sm:p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Step {item.step}</span>
                <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-black/65">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-28 md:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <TiltCard className="grid gap-6 bg-gradient-to-r from-[#f8f2e8] via-white/80 to-[#e9eef9] p-8 sm:grid-cols-[1.2fr_0.8fr] sm:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">Ready when you are</p>
              <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                A colorful minimal homepage with real depth and interaction.
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/65 sm:text-base">
                Start your account and experience the 3D interactions, structured workflow, and calm visual system across the platform.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-7 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                >
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-black/20 bg-white/70 px-7 py-3 text-sm font-semibold text-black transition-colors hover:bg-white"
                >
                  Sign In
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:content-center">
              {["Interactive 3D cards", "Minimal but colorful tone", "Expanded long-form homepage"].map((point) => (
                <div key={point} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/75 px-4 py-3">
                  <div className="rounded-full bg-black/90 p-1 text-white">
                    <Check className="h-3 w-3" />
                  </div>
                  <p className="text-sm font-medium text-black/80">{point}</p>
                </div>
              ))}
            </div>
          </TiltCard>
        </motion.div>
      </section>
    </div>
  );
}
