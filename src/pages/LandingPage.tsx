import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
} from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  ScanEye,
  Trophy,
  Sparkles,
  Play,
} from "lucide-react";
import { LUXURY_SPRING, LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

type Feature = {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
  tone: string;
  glow: string;
};

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "Smart Plans",
    description: "Adaptive daily plans tuned for your real schedule.",
    tone: "from-[#EAF2FF] to-[#F8FAFF]",
    glow: "group-hover:shadow-[0_14px_30px_rgba(59,130,246,0.18)]",
  },
  {
    icon: ShieldCheck,
    title: "Trainer Review System",
    description: "Every auto-plan is verified before activation.",
    tone: "from-[#E9FBF1] to-[#F8FFFB]",
    glow: "group-hover:shadow-[0_14px_30px_rgba(16,185,129,0.18)]",
  },
  {
    icon: ScanEye,
    title: "Proof-Based Progress",
    description: "Uploads and check-ins turn consistency into signal.",
    tone: "from-[#FFF2EA] to-[#FFF9F5]",
    glow: "group-hover:shadow-[0_14px_30px_rgba(249,115,22,0.18)]",
  },
  {
    icon: Trophy,
    title: "Gamified Discipline",
    description: "Streaks and ranks reward showing up after hours.",
    tone: "from-[#F1EEFF] to-[#FAF9FF]",
    glow: "group-hover:shadow-[0_14px_30px_rgba(124,58,237,0.18)]",
  },
];

const highlightStats = [
  { label: "Active After Hours Streaks", value: "12.8K", color: "bg-[#3B82F6]" },
  { label: "Trainer Reviews Completed", value: "98.2K", color: "bg-[#10B981]" },
  { label: "Proof Check-ins Submitted", value: "1.4M", color: "bg-[#F97316]" },
];

const floatingSignals = [
  { label: "After Hours Signal", value: "Live Queue +42", tone: "from-[#EAF2FF] to-white" },
  { label: "Discipline Index", value: "91.6%", tone: "from-[#E9FBF1] to-white" },
  { label: "Proof Stream", value: "2,148 uploads", tone: "from-[#FFF2EA] to-white" },
];

const scrollMoments = [
  {
    label: "01",
    title: "Open After Hours Grind",
    description: "One clear home screen. No noise, no decision fatigue.",
  },
  {
    label: "02",
    title: "Execute the Daily Plan",
    description: "Focused tasks, fixed blocks, and zero clutter between you and the work.",
  },
  {
    label: "03",
    title: "Submit Proof, Stay Accountable",
    description: "Trainer review closes the loop and keeps the system honest.",
  },
];

function BrandChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/15 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/65">
      {label}
    </span>
  );
}

function TiltSurface({ children, className = "" }: { children: ReactNode; className?: string }) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const smoothRotateX = useSpring(rotateX, { ...LUXURY_SPRING, stiffness: 170, damping: 22, mass: 0.8 });
  const smoothRotateY = useSpring(rotateY, { ...LUXURY_SPRING, stiffness: 170, damping: 22, mass: 0.8 });

  const glowX = useTransform(smoothRotateY, [-14, 14], [0, 100]);
  const glowY = useTransform(smoothRotateX, [-14, 14], [100, 0]);

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    rotateY.set((px - 0.5) * 12);
    rotateX.set((0.5 - py) * 10);
  };

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <div className="[perspective:1300px]">
      <motion.div
        onMouseMove={onMove}
        onMouseLeave={reset}
        onBlur={reset}
        style={{ rotateX: smoothRotateX, rotateY: smoothRotateY, transformStyle: "preserve-3d" }}
        className={`relative overflow-hidden rounded-3xl border border-black/10 bg-white/68 backdrop-blur-2xl ${className}`}
      >
        <motion.div
          aria-hidden
          style={{
            left: useTransform(glowX, (v) => `${v}%`),
            top: useTransform(glowY, (v) => `${v}%`),
            transform: "translate(-50%, -50%)",
          }}
          className="pointer-events-none absolute h-40 w-40 rounded-full bg-[#3B82F6]/20 blur-3xl"
        />
        <div className="relative" style={{ transform: "translateZ(26px)" }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ ...LUXURY_TWEEN_MEDIUM, delay: index * 0.06 }}
      className={`group rounded-2xl border border-black/10 bg-gradient-to-b ${feature.tone} p-6 backdrop-blur-xl transition-shadow ${feature.glow}`}
      whileHover={{ y: -4 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="h-[2px] w-14 rounded-full bg-gradient-to-r from-[#3B82F6] via-[#10B981] to-transparent" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#0B0B0C]/20" />
      </div>
      <div className="mb-4 inline-flex rounded-xl border border-black/10 bg-[#0B0B0C] p-2.5 text-[#F5F5F7] shadow-[0_8px_26px_rgba(11,11,12,0.16)]">
        <feature.icon className="h-4.5 w-4.5" />
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-[#0B0B0C]">{feature.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-black/62">{feature.description}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const smoothPointerX = useSpring(pointerX, { ...LUXURY_SPRING, stiffness: 80, damping: 18, mass: 0.9 });
  const smoothPointerY = useSpring(pointerY, { ...LUXURY_SPRING, stiffness: 80, damping: 18, mass: 0.9 });

  const { scrollYProgress } = useScroll();
  const narrativeShift = useTransform(scrollYProgress, [0.35, 0.7], [0, -24]);

  const updatePointer = (event: React.MouseEvent<HTMLDivElement>) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 24;
    const y = (event.clientY / window.innerHeight - 0.5) * 24;
    pointerX.set(x);
    pointerY.set(y);
  };

  return (
    <div
      onMouseMove={updatePointer}
      className="relative overflow-hidden bg-[#F5F5F7] text-[#0B0B0C]"
    >
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          style={{ x: smoothPointerX, y: smoothPointerY }}
          className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-[#3B82F6]/14 blur-3xl"
        />
        <motion.div
          style={{ x: useTransform(smoothPointerX, (v) => v * -0.8), y: useTransform(smoothPointerY, (v) => v * -0.8) }}
          className="absolute bottom-16 right-0 h-[24rem] w-[24rem] rounded-full bg-[#10B981]/10 blur-3xl"
        />
        <motion.div
          style={{ x: useTransform(smoothPointerX, (v) => v * 0.5), y: useTransform(smoothPointerY, (v) => v * 0.4) }}
          className="absolute right-[24%] top-[36%] h-56 w-56 rounded-full bg-[#F97316]/10 blur-3xl"
        />
        <motion.div
          style={{ x: useTransform(smoothPointerX, (v) => v * -0.45), y: useTransform(smoothPointerY, (v) => v * 0.45) }}
          className="absolute left-[35%] top-[58%] h-52 w-52 rounded-full bg-[#7C3AED]/10 blur-3xl"
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-light.png')] opacity-[0.18]" />
      </div>

      <section className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 pb-20 pt-28 md:grid-cols-2 md:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={LUXURY_TWEEN_SLOW}
          className="space-y-8"
        >
          <div className="flex flex-wrap items-center gap-3">
            <BrandChip label="After Hours Grind" />
            <BrandChip label="Minimal Fitness OS" />
          </div>

          <h1 className="font-sans text-5xl font-semibold leading-[0.95] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
            Discipline,
            <span className="block bg-gradient-to-r from-[#3B82F6] via-[#10B981] to-[#7C3AED] bg-clip-text text-transparent">
              After Hours.
            </span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-black/66 sm:text-lg">
            After Hours Grind is built for people who show up when it is quiet.
            A premium system for plans, proof, and progress.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0B0B0C] px-7 py-3.5 text-sm font-semibold text-[#F5F5F7] shadow-[0_12px_32px_rgba(11,11,12,0.2)] transition-all hover:scale-[1.02] hover:shadow-[0_14px_34px_rgba(59,130,246,0.24)]"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-black/20 bg-white/75 px-7 py-3.5 text-sm font-semibold text-[#0B0B0C] transition-colors hover:bg-white"
            >
              <Play className="h-4 w-4" />
              View Demo
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_SLOW, delay: 0.1 }}
          className="relative md:justify-self-end"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 hidden w-56 space-y-3 lg:block">
            {floatingSignals.slice(0, 2).map((signal, index) => (
              <motion.div
                key={signal.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.22 + index * 0.06 }}
                className={`rounded-2xl border border-black/10 bg-gradient-to-b ${signal.tone} px-4 py-3 shadow-[0_12px_30px_rgba(11,11,12,0.08)]`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">{signal.label}</p>
                <p className="mt-1 text-sm font-semibold tracking-tight text-black/78">{signal.value}</p>
              </motion.div>
            ))}
          </div>

          <TiltSurface className="p-6 sm:p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                  After Hours Grind Dashboard
                </p>
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold text-black/70">
                  Live
                </span>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/82 p-5">
                <p className="text-xs font-medium text-black/45">Today</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">Push + Core</p>
                <div className="mt-4 h-[3px] w-full rounded-full bg-black/8">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "82%" }}
                    viewport={{ once: true }}
                    transition={LUXURY_TWEEN_SLOW}
                    className="h-full rounded-full bg-[#3B82F6]"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-2.5 py-1 text-[11px] font-semibold text-[#1D4ED8]">
                    Plan: 82%
                  </span>
                  <span className="rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-2.5 py-1 text-[11px] font-semibold text-[#047857]">
                    Streak: 14D
                  </span>
                  <span className="rounded-full border border-[#F97316]/30 bg-[#F97316]/10 px-2.5 py-1 text-[11px] font-semibold text-[#C2410C]">
                    Proof: Ready
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Plan generated and assigned",
                  "Trainer review in queue",
                  "Proof check-in ready",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/80 px-4 py-3">
                    <div className="rounded-full bg-[#0B0B0C] p-1 text-white">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                    <span className="text-sm font-medium text-black/78">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </TiltSurface>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.34 }}
            className="pointer-events-none absolute -bottom-7 left-8 hidden rounded-2xl border border-black/10 bg-gradient-to-b from-[#F1EEFF] to-white px-4 py-3 shadow-[0_12px_30px_rgba(11,11,12,0.08)] lg:block"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">{floatingSignals[2].label}</p>
            <p className="mt-1 text-sm font-semibold tracking-tight text-black/78">{floatingSignals[2].value}</p>
          </motion.div>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 md:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={LUXURY_TWEEN_MEDIUM}
          className="grid gap-4 rounded-3xl border border-black/10 bg-white/72 p-5 backdrop-blur-xl sm:grid-cols-3"
        >
          {highlightStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-black/10 bg-white/82 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${stat.color}`} />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50">{stat.label}</p>
              </div>
              <p className="text-3xl font-semibold tracking-tight text-[#0B0B0C]">{stat.value}</p>
            </div>
          ))}
        </motion.div>
      </section>

      <section id="features" className="relative mx-auto max-w-7xl px-6 pb-24 md:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={LUXURY_TWEEN_MEDIUM}
          className="mb-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">After Hours Grind Features</p>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Built for consistency, not chaos.
          </h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 md:px-10 lg:px-14">
        <div className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={LUXURY_TWEEN_MEDIUM}
            className="rounded-3xl border border-black/10 bg-gradient-to-br from-white to-[#EEF4FF] p-7 shadow-[0_20px_50px_rgba(11,11,12,0.08)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">After Hours Experience</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.02em]">A calm interface with athletic intensity.</h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/66 sm:text-base">
              Every panel in After Hours Grind is tuned for rhythm: decisive color cues, clear hierarchy,
              and interaction depth that feels premium without being loud.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Signal clarity", value: "A+", accent: "bg-[#3B82F6]" },
                { label: "Flow speed", value: "0.8s", accent: "bg-[#10B981]" },
                { label: "Visual depth", value: "3D", accent: "bg-[#7C3AED]" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-black/10 bg-white/78 p-4">
                  <span className={`mb-2 block h-1.5 w-10 rounded-full ${item.accent}`} />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.06 }}
            className="rounded-3xl border border-black/10 bg-gradient-to-br from-[#0B0B0C] to-[#1B1B1F] p-7 text-white shadow-[0_20px_50px_rgba(11,11,12,0.2)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">After Hours Grind Brand</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">Designed for post-hours performers.</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/72">
              The product language keeps repeating one thing: show up, execute, and compound momentum.
            </p>
            <div className="mt-6 space-y-3">
              {[
                "After Hours Grind discipline loop",
                "After Hours Grind proof protocol",
                "After Hours Grind trainer review layer",
              ].map((line) => (
                <div key={line} className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-sm text-white/85">
                  {line}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="relative mx-auto grid max-w-7xl gap-8 px-6 pb-24 md:grid-cols-[0.9fr_1.1fr] md:px-10 lg:px-14">
        <motion.div style={{ y: narrativeShift }} className="md:sticky md:top-28 md:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Scroll Narrative</p>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            After Hours Grind keeps moving as you move.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-black/66 sm:text-base">
            Subtle motion layers and progressive reveals create depth without distraction.
          </p>
        </motion.div>

        <div className="space-y-4">
          {scrollMoments.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.32 }}
              transition={{ ...LUXURY_TWEEN_MEDIUM, delay: index * 0.06 }}
              className="rounded-2xl border border-black/10 bg-white/76 p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Step {item.label}</span>
                <BrandChip label="After Hours" />
              </div>
              <div className="mt-3 h-[3px] w-20 rounded-full bg-gradient-to-r from-[#3B82F6] via-[#10B981] to-[#F97316]" />
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-black/66">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24 text-center md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={LUXURY_TWEEN_MEDIUM}
          className="rounded-3xl border border-black/10 bg-white/76 p-10 backdrop-blur-xl sm:p-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">After Hours Grind</p>
          <h3 className="mt-3 font-sans text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Built for those who show up.
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-black/66 sm:text-base">
            Join After Hours Grind and train inside a calm system designed for high-discipline execution.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#0B0B0C] px-8 py-3.5 text-sm font-semibold text-[#F5F5F7] transition-all hover:scale-[1.02] hover:shadow-[0_12px_28px_rgba(59,130,246,0.25)]"
          >
            Start After Hours Grind
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-black/10 bg-white/70 px-6 py-7 backdrop-blur-xl md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold tracking-tight">After Hours Grind</p>
          <div className="flex items-center gap-6 text-black/62">
            <a href="#" className="hover:text-black transition-colors">About</a>
            <a href="#" className="hover:text-black transition-colors">Contact</a>
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
