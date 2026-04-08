import { Link } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useInView,
  animate,
} from "framer-motion";
import { ArrowRight, ArrowUpRight, Zap, Lock, BarChart3, Clock, ChevronDown, Calendar, Trophy, MapPin } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useAppStore } from "@/hooks/useStore";

/* ─── easing curves ──────────────────────────────────── */
const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
const snappyEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─── reusable scroll-reveal helpers ────────────────── */
const revealUp = (delay = 0, distance = 32) => ({
  initial: { opacity: 0, y: distance },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.75, ease: snappyEase, delay },
});

const revealLeft = (delay = 0) => ({
  initial: { opacity: 0, x: -36 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.7, ease: snappyEase, delay },
});

const revealRight = (delay = 0) => ({
  initial: { opacity: 0, x: 36 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.7, ease: snappyEase, delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.9, ease: smoothEase, delay },
});

/* hero-only — fires immediately, not on scroll */
const heroUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: smoothEase, delay },
});

/* ─── Animated counter hook ─────────────────────────── */
function useCounter(target: number, duration = 1.4) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setCount(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, target, duration]);

  return { count, ref };
}

/* ─── Data ───────────────────────────────────────────── */
const pillars = [
  {
    num: "01",
    title: "SMART PLAN ENGINE",
    body: "Your goals, timeline, and history fuel a structured 30-day execution blueprint — generated in seconds, built to last.",
    icon: Zap,
    accent: "#4DD2FF", // Cyan
  },
  {
    num: "02",
    title: "TRAINER APPROVAL GATE",
    body: "No plan goes live without expert eyes. Every programme is locked until your assigned trainer signs off.",
    icon: Lock,
    accent: "#A78BFA", // Violet
  },
  {
    num: "03",
    title: "PROOF LOOP SYSTEM",
    body: "Daily uploads. Check-in streaks. Hard data. Discipline isn't a feeling — it's a number we track for you.",
    icon: BarChart3,
    accent: "#4DD2FF",
  },
  {
    num: "04",
    title: "THE HOURS THAT COUNT",
    body: "Most people train when it's convenient. You train after hours — when the room is empty and the results are earned.",
    icon: Clock,
    accent: "#A78BFA",
  },
];

const stats = [
  { value: "94%", label: "Plan completion rate" },
  { value: "30-day", label: "Structured output cycles" },
  { value: "100%", label: "Trainer-reviewed programmes" },
  { value: "∞", label: "Accountability, always on" },
];

const manifesto = [
  "THE GRIND DOESN'T WAIT FOR MOTIVATION.",
  "IT STARTS AFTER HOURS.",
  "WHEN THE EXCUSES STOP — WE BEGIN.",
];

/* ─── Pillar card — self-contained for clean stagger ── */
function PillarCard({ p, idx }: { p: any; idx: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, amount: 0.18 });

  return (
    <motion.div
      ref={cardRef}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      initial={{ opacity: 0, y: 32 }}
      transition={{ duration: 0.68, ease: snappyEase }}
      style={{
        background: "#000",
        padding: "clamp(1.8rem,5vw,2.5rem)",
        display: "flex",
        flexDirection: "column",
        gap: "1.4rem",
        cursor: "default",
      }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.025)" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <motion.span
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.18)" }}
        >
          {p.num}
        </motion.span>
        <motion.div
          animate={inView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -20 }}
          transition={{ duration: 0.42, ease: snappyEase, delay: 0.12 }}
          style={{ width: 36, height: 36, background: p.accent, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <p.icon size={16} color="#fff" />
        </motion.div>
      </div>

      <motion.h2
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5, ease: snappyEase, delay: 0.22 }}
        style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "0.06em", color: "#EFEFEF", textTransform: "uppercase", margin: 0 }}
      >
        {p.title}
      </motion.h2>

      <motion.p
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.5, ease: snappyEase, delay: 0.32 }}
        style={{ fontSize: "0.875rem", fontWeight: 300, lineHeight: 1.75, color: "rgba(239,239,239,0.42)", margin: 0 }}
      >
        {p.body}
      </motion.p>

      <motion.div
        animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.55, ease: snappyEase, delay: 0.4 }}
        style={{ height: 1, background: `linear-gradient(90deg, ${p.accent}55, transparent)`, transformOrigin: "left" }}
      />
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────── */
export default function LandingPage() {
  const { scrollYProgress: pageProgress } = useScroll();
  const scaleX = useSpring(pageProgress, { stiffness: 200, damping: 30, mass: 0.5 });

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  const mouseX = useMotionValue(-240);
  const mouseY = useMotionValue(-240);
  const smoothMouseX = useSpring(mouseX, { stiffness: 140, damping: 24, mass: 0.35 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 140, damping: 24, mass: 0.35 });

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseX.set(e.clientX - 300);
    mouseY.set(e.clientY - 300);
  };

  const { count: count94, ref: ref94 } = useCounter(94);
  const { count: count100, ref: ref100 } = useCounter(100, 1.6);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      onMouseMove={handlePointerMove}
      style={{ background: "#000", color: "#EFEFEF", fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" }}
    >
      {/* ── PERSISTENT MOUSE GLOW ─────────────────────────── */}
      <motion.div
        className="hidden sm:block pointer-events-none fixed"
        style={{
          x: smoothMouseX,
          y: smoothMouseY,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(77,210,255,0.25) 0%, rgba(77,210,255,0.08) 35%, rgba(77,210,255,0) 70%)",
          filter: "blur(24px)",
          mixBlendMode: "screen",
          zIndex: 5,
        }}
      />

      {/* ── SCROLL PROGRESS BAR ───────────────────────────── */}
      <motion.div
        style={{
          scaleX,
          position: "fixed", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, #4DD2FF, #A78BFA)",
          transformOrigin: "left", zIndex: 100,
        }}
      />

      {/* ── HERO ─────────────────────────────────────────── */}
      <div
        ref={heroRef}
        className="relative flex flex-col justify-start overflow-hidden sm:min-h-screen"
      >
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "clamp(88px,14vw,112px) clamp(88px,14vw,112px)",
        }} />

        <motion.div style={{ y: heroY, position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "10%", left: "-10%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(77,210,255,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", top: "20%", right: "-10%", width: "50vw", height: "50vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
        </motion.div>

        <div style={{ position: "relative", zIndex: 2, padding: "calc(64px + clamp(1.8rem,5vw,1.9rem)) clamp(1.5rem,5vw,6vw) clamp(2.5rem,6vh,3rem)", maxWidth: 1400, width: "100%", flex: 1 }}>
          <motion.div {...heroUp(0.1)} className="hidden sm:block" style={{ marginBottom: "1.6rem" }}>
            <span style={{ display: "inline-block", fontSize: "clamp(0.58rem,1.9vw,0.7rem)", fontWeight: 700, letterSpacing: "0.18em", color: "#4DD2FF", padding: "5px 10px", border: "1px solid rgba(77,210,255,0.3)" }}>
              AFTER HOURS GRIND — EST. THE GRIND NEVER STOPS
            </span>
          </motion.div>

          <div style={{ overflow: "hidden" }}>
            <motion.h1 {...heroUp(0.18)} style={{ fontSize: "clamp(2.6rem,9.6vw,9rem)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.03em", color: "#EFEFEF", margin: 0, textTransform: "uppercase" }}>
              NO FLUFF.
            </motion.h1>
          </div>
          <div className="hidden sm:block" style={{ overflow: "hidden" }}>
            <motion.h1 {...heroUp(0.24)} style={{ fontSize: "clamp(3.5rem,10vw,9rem)", fontWeight: 800, lineHeight: 0.92, letterSpacing: "-0.03em", margin: 0, textTransform: "uppercase", WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>
              JUST EXECUTION.
            </motion.h1>
          </div>
          <div style={{ overflow: "hidden" }}>
            <motion.h1 {...heroUp(0.30)} style={{ fontSize: "clamp(2.9rem,10vw,9rem)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.03em", color: "#4DD2FF", margin: 0, textTransform: "uppercase" }}>
              AFTER HOURS.
            </motion.h1>
          </div>

          <motion.div
            {...heroUp(0.42)}
            className="mt-6 flex flex-col items-start gap-6 sm:mt-[clamp(1.2rem,2.4vh,2.5rem)] sm:flex-row sm:flex-wrap sm:items-end sm:gap-[clamp(1rem,3vw,3rem)]"
          >
            <p style={{ maxWidth: 420, fontSize: "clamp(0.88rem,2.6vw,1rem)", fontWeight: 300, lineHeight: 1.7, color: "rgba(239,239,239,0.5)", margin: 0, borderLeft: "2px solid rgba(77,210,255,0.6)", paddingLeft: "1rem" }}>
              A precision coaching platform built for people who train when the rest of the world is asleep.
              Smart plans. Expert sign-off. Daily proof.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
              <Link
                to="/signup"
                className="sm:w-auto"
                style={{
                  position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  background: "#4DD2FF", color: "#000", textDecoration: "none",
                  padding: "17px 28px", fontSize: "0.83rem", fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  transition: "transform 0.2s, background 0.2s", borderRadius: 8,
                  width: "100%", overflow: "hidden",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = "#3ab8e6"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = "#4DD2FF"; }}
              >
                <motion.span
                  style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)", backgroundSize: "200% 100%" }}
                  animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 1.2 }}
                />
                Start Your Grind
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(239,239,239,0.38)", textDecoration: "none", fontSize: "0.73rem", fontWeight: 400, letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#EFEFEF")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(239,239,239,0.38)")}
              >
                Already grinding? Sign in
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </motion.div>

          <motion.div
            {...heroUp(0.65)}
            className="flex sm:hidden"
            style={{ marginTop: "3.5rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)", gap: "3rem", alignItems: "flex-start" }}
          >
            <div ref={ref94}>
              <div style={{ fontSize: "2.1rem", fontWeight: 800, color: "#4DD2FF", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{count94}%</div>
              <div style={{ marginTop: "0.45rem", fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(239,239,239,0.28)", textTransform: "uppercase" }}>Plan completion</div>
            </div>
            <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
            <div ref={ref100}>
              <div style={{ fontSize: "2.1rem", fontWeight: 800, color: "#A78BFA", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{count100}%</div>
              <div style={{ marginTop: "0.45rem", fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(239,239,239,0.28)", textTransform: "uppercase" }}>Trainer-reviewed</div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.8 }} className="flex sm:hidden" style={{ marginTop: "2.5rem", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>Scroll</span>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}><ChevronDown size={13} color="rgba(255,255,255,0.22)" /></motion.div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }} className="hidden sm:flex" style={{ position: "absolute", bottom: "3rem", right: "6vw", zIndex: 2, alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)" }}>SCROLL</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}><ChevronDown size={14} color="rgba(255,255,255,0.25)" /></motion.div>
        </motion.div>
      </div>

      {/* ── STATS BAR (desktop only) ──────────────────────── */}
      <motion.section className="hidden sm:block" {...fadeIn(0)} style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="grid grid-cols-4 border-l border-white/10" style={{ gap: 0 }}>
          {stats.map((s, i) => (
            <motion.div key={s.label} {...revealUp(i * 0.08)} className="border-r border-b border-white/10" style={{ padding: "clamp(1.1rem,3.2vw,2.2rem) clamp(1rem,3vw,2rem)", textAlign: "center" }}>
              <div style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", fontWeight: 800, color: i % 2 === 0 ? "#4DD2FF" : "#A78BFA", lineHeight: 1 }}>{s.value}</div>
              <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(239,239,239,0.35)", textTransform: "uppercase" }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── MANIFESTO ─────────────────────────────────────── */}
      <div style={{ padding: "clamp(3.5rem,10vw,6.5rem) clamp(1.5rem,6vw,6vw)", overflow: "hidden" }}>
        {manifesto.map((line, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -44 : 44 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 0.8, ease: snappyEase }} style={{ fontSize: "clamp(1.05rem,5.3vw,4rem)", fontWeight: 300, letterSpacing: "0.04em", lineHeight: 1.25, color: i === 1 ? "rgba(239,239,239,0.14)" : "rgba(239,239,239,0.62)", textAlign: i === 1 ? "right" : "left", textTransform: "uppercase", borderBottom: i < manifesto.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", paddingBottom: "clamp(1.4rem,4vw,2.8rem)", marginBottom: i < manifesto.length - 1 ? "clamp(1.4rem,4vw,2.8rem)" : 0 }}>
            {line}
          </motion.div>
        ))}
      </div>

      {/* ── PILLARS ──────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <motion.div {...revealLeft(0)} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "2.5rem clamp(1.5rem,6vw,6vw) 0", marginBottom: "2.5rem" }}>
          <motion.span initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, ease: snappyEase }} style={{ width: 32, height: 1, background: "#4DD2FF", display: "inline-block", transformOrigin: "left" }} />
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.25em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>The System</span>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1px", background: "rgba(255,255,255,0.06)" }}>
          {pillars.map((p, idx) => <PillarCard key={p.num} p={p} idx={idx} />)}
        </div>
      </section>

      {/* ── IDENTITY SECTION ─────────────────────────────── */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", minHeight: "60vh", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <motion.div {...revealUp(0, 40)} style={{ background: "#4DD2FF", padding: "clamp(2.5rem,7vw,5rem) clamp(1.5rem,6vw,4rem)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <motion.span {...fadeIn(0.2)} style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.25em", color: "rgba(0,0,0,0.5)", textTransform: "uppercase" }}>After Hours Grind</motion.span>
          <div>
            <motion.div {...revealUp(0.15, 24)} style={{ fontSize: "clamp(2.2rem,5vw,4.5rem)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.03em", color: "#000", textTransform: "uppercase" }}>BUILT FOR THOSE WHO SHOW UP.</motion.div>
            <motion.div {...revealUp(0.3)}>
              <Link to="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: "2.5rem", background: "#000", color: "#fff", textDecoration: "none", padding: "14px 28px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", transition: "opacity 0.2s", borderRadius: 8 }} onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>Start Now <ArrowRight size={15} /></Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div {...revealUp(0.12, 40)} style={{ background: "#F5F5F7", padding: "clamp(2.5rem,7vw,5rem) clamp(1.5rem,6vw,4rem)", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "1.5rem", borderLeft: "1px solid rgba(0,0,0,0.05)" }}>
          <motion.span {...fadeIn(0.25)} style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.25em", color: "rgba(0,0,0,0.4)", textTransform: "uppercase" }}>The Identity</motion.span>
          <motion.p {...revealUp(0.2, 16)} style={{ fontSize: "clamp(1.05rem,2.6vw,1.8rem)", fontWeight: 300, lineHeight: 1.7, color: "#1A1A1A", margin: 0 }}>"After hours" isn't a time — it's a <strong style={{ fontWeight: 800, color: "#000" }}>mindset</strong>. It's the version of yourself that trades late-night scrolling for structured reps, discipline for excuses, and proof for promises.</motion.p>
          <motion.div {...revealUp(0.3)} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.5rem" }}>
            {["GRIND", "PROVE", "GROW"].map((w, i) => <motion.span key={w} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.35, ease: snappyEase, delay: 0.35 + i * 0.07 }} style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.25em", color: "#000", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", padding: "6px 10px", borderRadius: 999 }}>{w}</motion.span>)}
          </motion.div>
        </motion.div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section style={{ padding: "clamp(3.5rem,9vw,8rem) clamp(1.5rem,6vw,6vw)", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <motion.span {...fadeIn(0)} style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.28em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>Ready?</motion.span>
        <motion.h2 {...revealUp(0.08, 36)} style={{ fontSize: "clamp(2.4rem,7vw,6rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 0.95, textTransform: "uppercase", margin: "1.2rem 0 2rem", color: "#EFEFEF" }}>
          YOUR PLAN. YOUR PROOF.<br />
          <motion.span initial={{ color: "#EFEFEF" }} whileInView={{ color: "#4DD2FF" }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.65, delay: 0.3 }}>YOUR GRIND.</motion.span>
        </motion.h2>
        <motion.p {...revealUp(0.18)} style={{ maxWidth: 460, margin: "0 auto 2.5rem", fontSize: "0.9rem", fontWeight: 300, lineHeight: 1.8, color: "rgba(239,239,239,0.4)" }}>Join the platform where accountability isn't optional and progress is measurable. From day one to day thirty — we watch every rep.</motion.p>
        <motion.div {...revealUp(0.26)} className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4">
          <Link to="/signup" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#4DD2FF", color: "#000", textDecoration: "none", padding: "18px 40px", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", transition: "opacity 0.2s", overflow: "hidden", borderRadius: 8 }} onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            <motion.span style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.3) 50%, transparent 65%)", backgroundSize: "200% 100%" }} animate={{ backgroundPosition: ["200% 0", "-200% 0"] }} transition={{ duration: 2.6, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }} />
            Create Free Account <ArrowRight size={16} />
          </Link>
          <Link to="/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid rgba(255,255,255,0.12)", color: "rgba(239,239,239,0.5)", textDecoration: "none", padding: "18px 40px", fontSize: "0.85rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", transition: "border-color 0.2s, color 0.2s", borderRadius: 8 }} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#EFEFEF"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(239,239,239,0.5)"; }}>
            Sign In
          </Link>
        </motion.div>
      </section>

      {/* ── EVENTS TEASER ───────────────────────────────── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "clamp(3rem,9vw,7rem) clamp(1.5rem,6vw,6vw)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: "40vw", height: "40vw", background: "radial-gradient(circle, rgba(77,210,255,0.06) 0%, transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1400 }}>
          <motion.div {...revealUp(0)} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
            <motion.span initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, ease: snappyEase }} style={{ width: 32, height: 1, background: "#4DD2FF", display: "inline-block", transformOrigin: "left" }} />
            <span style={{ fontSize: "0.65rem", letterSpacing: "0.25em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Events & Competitions</span>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "3rem", alignItems: "center" }}>
            <div>
              <motion.h2 {...revealUp(0.08)} style={{ fontSize: "clamp(2rem,5.5vw,4.5rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 0.95, textTransform: "uppercase", margin: "0 0 1.5rem", color: "#EFEFEF" }}>EVENTS WHERE<br /><span style={{ color: "#4DD2FF" }}>ATHLETES RISE.</span></motion.h2>
              <motion.p {...revealUp(0.15)} style={{ maxWidth: 460, fontSize: "clamp(0.88rem,2.2vw,1rem)", fontWeight: 300, lineHeight: 1.75, color: "rgba(239,239,239,0.45)", margin: "0 0 2rem" }}>Competitions, workshops, and masterclasses — all in one place. Register, compete, and prove you earned it.</motion.p>
              <motion.div {...revealUp(0.22)} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "2rem" }}>
                {["Competition", "Workshop", "Masterclass", "Challenge"].map((tag) => <span key={tag} style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(77,210,255,0.7)", background: "rgba(77,210,255,0.06)", border: "1px solid rgba(77,210,255,0.15)", padding: "5px 12px", borderRadius: 999, textTransform: "uppercase" }}>{tag}</span>)}
              </motion.div>
              <motion.div {...revealUp(0.28)}>
                <Link to="/events" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 28px", background: "#4DD2FF", color: "#000", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 8, transition: "opacity 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>View All Events <ArrowRight size={15} /></Link>
              </motion.div>
            </div>
            <motion.div {...revealUp(0.1)} className="hidden sm:flex" style={{ flexDirection: "column", gap: "1rem", minWidth: 220 }}>
              {[{ icon: Trophy, label: "Live Events", sub: "Compete in real-time" }, { icon: Calendar, label: "Upcoming", sub: "Plan ahead" }, { icon: MapPin, label: "Nationwide", sub: "Multiple cities" }].map(({ icon: Icon, label, sub }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(77,210,255,0.08)", border: "1px solid rgba(77,210,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={16} color="#4DD2FF" /></div>
                  <div><div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#EFEFEF" }}>{label}</div><div style={{ fontSize: "0.7rem", color: "rgba(239,239,239,0.35)" }}>{sub}</div></div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <motion.footer {...fadeIn(0)} style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2rem clamp(1rem,6vw,6vw)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 20, height: 20, background: "linear-gradient(135deg, #4DD2FF, #A78BFA)", display: "inline-block" }} />
          <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)" }}>AFTER HOURS GRIND</span>
        </div>
        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em" }}>© 2026 — GRIND NEVER STOPS</span>
      </motion.footer>

    </div>
  );
}
