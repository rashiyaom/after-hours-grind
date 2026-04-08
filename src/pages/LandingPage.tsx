import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Zap, Lock, BarChart3, Clock, ChevronDown } from "lucide-react";
import { useRef } from "react";

/* ─── motion helpers ─────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.9, ease: "easeOut" as const, delay },
});

/* ─── data ───────────────────────────────────────────── */
const pillars = [
  {
    num: "01",
    title: "SMART PLAN ENGINE",
    body: "Your goals, timeline, and history fuel a structured 30-day execution blueprint — generated in seconds, built to last.",
    icon: Zap,
    accent: "#FF4D00",
  },
  {
    num: "02",
    title: "TRAINER APPROVAL GATE",
    body: "No plan goes live without expert eyes. Every programme is locked until your assigned trainer signs off.",
    icon: Lock,
    accent: "#6B21FF",
  },
  {
    num: "03",
    title: "PROOF LOOP SYSTEM",
    body: "Daily uploads. Check-in streaks. Hard data. Discipline isn't a feeling — it's a number we track for you.",
    icon: BarChart3,
    accent: "#FF4D00",
  },
  {
    num: "04",
    title: "THE HOURS THAT COUNT",
    body: "Most people train when it's convenient. You train after hours — when the room is empty and the results are earned.",
    icon: Clock,
    accent: "#6B21FF",
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

/* ─── component ──────────────────────────────────────── */
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: "#000",
        color: "#EFEFEF",
        fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
      }}
    >

      {/* ── NAV ──────────────────────────────────────────── */}
      <motion.nav
        {...fadeIn(0)}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              width: 28, height: 28,
              background: "linear-gradient(135deg, #FF4D00 0%, #6B21FF 100%)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 800, fontSize: "0.875rem", letterSpacing: "0.18em", color: "#fff" }}>
            AFTER HOURS
          </span>
        </div>

        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <Link to="/login" style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          >
            SIGN IN
          </Link>
          <Link
            to="/signup"
            style={{
              fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em",
              padding: "8px 20px",
              background: "#FF4D00",
              color: "#fff",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            GET STARTED
          </Link>
        </div>
      </motion.nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <div ref={heroRef} style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }}>

        {/* Background grid pattern */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />

        {/* Gradient blob */}
        <motion.div style={{ y: heroY, position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
          <div style={{
            position: "absolute",
            top: "10%", left: "-10%",
            width: "60vw", height: "60vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,77,0,0.12) 0%, transparent 70%)",
            filter: "blur(40px)",
          }} />
          <div style={{
            position: "absolute",
            top: "20%", right: "-10%",
            width: "50vw", height: "50vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(107,33,255,0.1) 0%, transparent 70%)",
            filter: "blur(40px)",
          }} />
        </motion.div>

        {/* hero content */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 6vw 10vh", maxWidth: 1400, width: "100%" }}>

          {/* Eyebrow */}
          <motion.div {...fadeUp(0.1)} style={{ marginBottom: "2rem" }}>
            <span style={{
              display: "inline-block",
              fontSize: "0.7rem", fontWeight: 700,
              letterSpacing: "0.28em",
              color: "#FF4D00",
              padding: "6px 14px",
              border: "1px solid rgba(255,77,0,0.3)",
            }}>
              AFTER HOURS GRIND — EST. THE GRIND NEVER STOPS
            </span>
          </motion.div>

          {/* Big headline */}
          <div style={{ overflow: "hidden" }}>
            <motion.h1
              {...fadeUp(0.18)}
              style={{
                fontSize: "clamp(3.5rem, 10vw, 9rem)",
                fontWeight: 800,
                lineHeight: 0.92,
                letterSpacing: "-0.03em",
                color: "#EFEFEF",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              NO FLUFF.
            </motion.h1>
          </div>
          <div style={{ overflow: "hidden" }}>
            <motion.h1
              {...fadeUp(0.24)}
              style={{
                fontSize: "clamp(3.5rem, 10vw, 9rem)",
                fontWeight: 800,
                lineHeight: 0.92,
                letterSpacing: "-0.03em",
                margin: 0,
                textTransform: "uppercase",
                WebkitTextStroke: "1px rgba(255,255,255,0.2)",
                color: "transparent",
              }}
            >
              JUST EXECUTION.
            </motion.h1>
          </div>
          <div style={{ overflow: "hidden" }}>
            <motion.h1
              {...fadeUp(0.30)}
              style={{
                fontSize: "clamp(3.5rem, 10vw, 9rem)",
                fontWeight: 800,
                lineHeight: 0.92,
                letterSpacing: "-0.03em",
                color: "#FF4D00",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              AFTER HOURS.
            </motion.h1>
          </div>

          {/* sub copy + CTA row */}
          <motion.div
            {...fadeUp(0.42)}
            style={{ marginTop: "3.5rem", display: "flex", flexWrap: "wrap", gap: "3rem", alignItems: "flex-end" }}
          >
            <p style={{
              maxWidth: 400,
              fontSize: "1rem",
              fontWeight: 300,
              lineHeight: 1.75,
              color: "rgba(239,239,239,0.55)",
              margin: 0,
              borderLeft: "2px solid #FF4D00",
              paddingLeft: "1.25rem",
            }}>
              A precision coaching platform built for people who train when the rest of the world is asleep.
              Smart plans. Expert sign-off. Daily proof. No excuses accepted.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Link
                to="/signup"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: "#FF4D00",
                  color: "#fff",
                  textDecoration: "none",
                  padding: "16px 32px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  transition: "transform 0.2s, background 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = "#e64400"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = "#FF4D00"; }}
              >
                Start Your Grind
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  color: "rgba(239,239,239,0.45)",
                  textDecoration: "none",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  transition: "color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#EFEFEF")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(239,239,239,0.45)")}
              >
                Already grinding? Sign in
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* scroll hint */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}
          style={{ position: "absolute", bottom: "2rem", right: "6vw", zIndex: 2, display: "flex", alignItems: "center", gap: 8 }}
        >
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)" }}>SCROLL</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}>
            <ChevronDown size={14} color="rgba(255,255,255,0.25)" />
          </motion.div>
        </motion.div>
      </div>

      {/* ── STATS BAR ────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              style={{
                padding: "2.5rem 2rem",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: 800, color: i % 2 === 0 ? "#FF4D00" : "#6B21FF", lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(239,239,239,0.35)", textTransform: "uppercase" }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── MANIFESTO TICKER ─────────────────────────────── */}
      <div style={{ padding: "5rem 6vw", overflow: "hidden" }}>
        {manifesto.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: "clamp(1.5rem, 4.5vw, 4rem)",
              fontWeight: 200,
              letterSpacing: "0.05em",
              lineHeight: 1.2,
              color: i === 1 ? "rgba(239,239,239,0.15)" : "rgba(239,239,239,0.6)",
              textAlign: i === 1 ? "right" : "left",
              textTransform: "uppercase",
              paddingLeft: i === 1 ? "0" : "0",
              borderBottom: i < manifesto.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              paddingBottom: "2rem",
              marginBottom: i < manifesto.length - 1 ? "2rem" : 0,
            }}
          >
            {line}
          </motion.div>
        ))}
      </div>

      {/* ── PILLARS ──────────────────────────────────────── */}
      <section style={{ padding: "2rem 6vw 6rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {/* section label */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "4rem" }}>
          <span style={{ width: 32, height: 1, background: "#FF4D00", display: "inline-block" }} />
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.25em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
            The System
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1px", background: "rgba(255,255,255,0.06)" }}>
          {pillars.map((p, idx) => (
            <motion.div
              key={p.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: "#000",
                padding: "2.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                cursor: "default",
                transition: "background 0.3s",
              }}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)" }}>
                  {p.num}
                </span>
                <div style={{
                  width: 36, height: 36,
                  background: p.accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <p.icon size={16} color="#fff" />
                </div>
              </div>

              <h2 style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "#EFEFEF",
                textTransform: "uppercase",
                margin: 0,
              }}>
                {p.title}
              </h2>

              <p style={{
                fontSize: "0.875rem",
                fontWeight: 300,
                lineHeight: 1.75,
                color: "rgba(239,239,239,0.45)",
                margin: 0,
              }}>
                {p.body}
              </p>

              <div style={{ height: 1, background: `linear-gradient(90deg, ${p.accent}40, transparent)` }} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── IDENTITY SECTION ─────────────────────────────── */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "60vh", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Left: brand statement */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1 }}
          style={{
            background: "#FF4D00",
            padding: "5rem 4rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.25em", color: "rgba(0,0,0,0.5)", textTransform: "uppercase" }}>
            After Hours Grind
          </span>
          <div>
            <div style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.03em", color: "#000", textTransform: "uppercase" }}>
              BUILT FOR THOSE WHO SHOW UP.
            </div>
            <Link
              to="/signup"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                marginTop: "2.5rem",
                background: "#000",
                color: "#fff",
                textDecoration: "none",
                padding: "14px 28px",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Start Now <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>

        {/* Right: gradient + copy */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, delay: 0.15 }}
          style={{
            background: "linear-gradient(135deg, #6B21FF 0%, #FF4D00 100%)",
            padding: "5rem 4rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: "1.5rem",
          }}
        >
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.25em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
            The Identity
          </span>
          <p style={{ fontSize: "1.25rem", fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.9)", margin: 0 }}>
            "After hours" isn't a time — it's a <strong style={{ fontWeight: 700, color: "#fff" }}>mindset</strong>. It's the version of yourself that trades late-night scrolling for structured reps, discipline for excuses, and proof for promises.
          </p>
          <div style={{ display: "flex", gap: "2rem", marginTop: "0.5rem" }}>
            {["GRIND", "PROVE", "GROW"].map(w => (
              <span key={w} style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.25em", color: "rgba(255,255,255,0.35)" }}>{w}</span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section style={{ padding: "8rem 6vw", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.28em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
            Ready?
          </span>
          <h2 style={{
            fontSize: "clamp(2.5rem, 7vw, 6rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 0.95,
            textTransform: "uppercase",
            margin: "1rem 0 2.5rem",
            color: "#EFEFEF",
          }}>
            YOUR PLAN. YOUR PROOF.<br />
            <span style={{ color: "#FF4D00" }}>YOUR GRIND.</span>
          </h2>
          <p style={{ maxWidth: 460, margin: "0 auto 3rem", fontSize: "0.9rem", fontWeight: 300, lineHeight: 1.8, color: "rgba(239,239,239,0.4)" }}>
            Join the platform where accountability isn't optional and progress is measurable. From day one to day thirty — we watch every rep.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link
              to="/signup"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "#FF4D00",
                color: "#fff",
                textDecoration: "none",
                padding: "18px 40px",
                fontSize: "0.85rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                transition: "transform 0.2s, opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Create Free Account
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(239,239,239,0.5)",
                textDecoration: "none",
                padding: "18px 40px",
                fontSize: "0.85rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#EFEFEF"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(239,239,239,0.5)"; }}
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2.5rem 6vw", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 20, height: 20, background: "linear-gradient(135deg, #FF4D00, #6B21FF)", display: "inline-block" }} />
          <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)" }}>AFTER HOURS GRIND</span>
        </div>
        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em" }}>
          © 2025 — GRIND NEVER STOPS
        </span>
      </footer>

    </div>
  );
}
