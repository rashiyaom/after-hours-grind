import { useState, useRef } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import { Calendar, MapPin, ArrowRight, X, CheckCircle2, Zap, Users, Trophy, Clock, ChevronRight, Tag } from "lucide-react";
import { useAppStore } from "@/hooks/useStore";
import { AHGEvent, EventFormField } from "@/types";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const revealUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.7, ease, delay },
});

function StatusBadge({ status }: { status: AHGEvent["status"] }) {
  const cfg = {
    upcoming: { label: "Upcoming", bg: "rgba(77,210,255,0.12)", border: "rgba(77,210,255,0.3)", color: "#4DD2FF" },
    live: { label: "🔴 Live Now", bg: "rgba(255,60,60,0.12)", border: "rgba(255,60,60,0.3)", color: "#FF3C3C" },
    completed: { label: "Completed", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" },
  }[status];
  return <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", padding: "4px 10px", borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, textTransform: "uppercase" }}>{cfg.label}</span>;
}

function FieldRenderer({ field, value, onChange }: { field: EventFormField; value: string | string[]; onChange: (v: string | string[]) => void }) {
  const base: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#EFEFEF", fontSize: "0.9rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  if (field.type === "textarea") return <textarea required={field.required} placeholder={field.placeholder} value={value as string} onChange={(e) => onChange(e.target.value)} rows={4} style={{ ...base, resize: "vertical" }} />;
  if (field.type === "select") return <select required={field.required} value={value as string} onChange={(e) => onChange(e.target.value)} style={{ ...base, cursor: "pointer" }}><option value="">Select…</option>{field.options?.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
  if (field.type === "radio") return <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>{field.options?.map((o) => <label key={o} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.875rem", color: "rgba(239,239,239,0.8)" }}><input type="radio" name={field.id} value={o} checked={value === o} onChange={() => onChange(o)} style={{ accentColor: "#4DD2FF" }} />{o}</label>)}</div>;
  if (field.type === "checkbox") { const arr = Array.isArray(value) ? value : []; return <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>{field.options?.map((o) => <label key={o} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.875rem", color: "rgba(239,239,239,0.8)" }}><input type="checkbox" checked={arr.includes(o)} onChange={() => onChange(arr.includes(o) ? arr.filter((v) => v !== o) : [...arr, o])} style={{ accentColor: "#4DD2FF" }} />{o}</label>)}</div>; }
  return <input type={field.type === "phone" ? "tel" : field.type} required={field.required} placeholder={field.placeholder} value={value as string} onChange={(e) => onChange(e.target.value)} style={base} />;
}

function RegModal({ event, onClose }: { event: AHGEvent; onClose: () => void }) {
  const submit = useAppStore((s) => s.submitEventEntry);
  const [res, setRes] = useState<Record<string, string | string[]>>(Object.fromEntries(event.formFields.map((f) => [f.id, f.type === "checkbox" ? [] : ""])));
  const [done, setDone] = useState(false);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24, rotateX: -10 }} animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, scale: 0.94, y: -24, rotateX: 10 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: "clamp(1.5rem,5vw,2.5rem)", boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)", perspective: 1000 }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(77,210,255,0.1)", border: "1px solid rgba(77,210,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}><CheckCircle2 size={32} color="#4DD2FF" /></div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#EFEFEF", margin: "0 0 0.5rem" }}>You're Registered!</h3>
            <p style={{ color: "rgba(239,239,239,0.5)", marginBottom: "2rem" }}>Entry for <strong style={{ color: "#EFEFEF" }}>{event.title}</strong> received.</p>
            <button onClick={onClose} style={{ padding: "12px 32px", background: "#4DD2FF", color: "#000", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
              <div><p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", color: "#4DD2FF", marginBottom: 6, textTransform: "uppercase" }}>Register Now</p><h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#EFEFEF", margin: 0 }}>{event.title}</h3></div>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); submit(event.id, res); setDone(true); }} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {event.formFields.map((f) => (
                <div key={f.id}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "rgba(239,239,239,0.7)", marginBottom: "0.5rem" }}>{f.label}{f.required && <span style={{ color: "#FF6B6B", marginLeft: 4 }}>*</span>}</label>
                  <FieldRenderer field={f} value={res[f.id]} onChange={(v) => setRes((p) => ({ ...p, [f.id]: v }))} />
                </div>
              ))}
              <button type="submit" style={{ marginTop: "0.5rem", padding: "14px", background: "#4DD2FF", color: "#000", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Submit Registration <ArrowRight size={16} /></button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function EventCard({ event, idx, onRegister }: { event: AHGEvent; idx: number; onRegister: () => void }) {
  const d = new Date(event.date);
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.65, ease, delay: idx * 0.1 }} whileHover={{ y: -8, boxShadow: "0 24px 48px rgba(77,210,255,0.1)" }} style={{ background: "#080808", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", transition: "all 0.3s ease" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(77,210,255,0.3)")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
      <motion.div whileHover="hover" style={{ position: "relative", height: 220, overflow: "hidden" }}>
        <motion.img 
          variants={{ hover: { scale: 1.08 } }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          src={event.mediaUrl} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover", transformOrigin: "center" }} 
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080808 0%, transparent 55%)" }} />
        <div style={{ position: "absolute", top: 14, left: 14, right: 14, display: "flex", justifyContent: "space-between" }}><StatusBadge status={event.status} /><span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.5)", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: 999, textTransform: "uppercase" }}>{event.category}</span></div>
        <div style={{ position: "absolute", bottom: 14, left: 14, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(77,210,255,0.2)", borderRadius: 12, padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#4DD2FF", lineHeight: 1 }}>{d.getDate()}</div>
          <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(77,210,255,0.7)" }}>{d.toLocaleString("en", { month: "short" }).toUpperCase()}</div>
        </div>
      </motion.div>
      <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#EFEFEF", margin: 0, lineHeight: 1.3 }}>{event.title}</h3>
        <p style={{ fontSize: "0.85rem", fontWeight: 300, color: "rgba(239,239,239,0.45)", lineHeight: 1.7, margin: 0 }}>{event.description.length > 120 ? event.description.slice(0, 120) + "…" : event.description}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={12} color="rgba(77,210,255,0.6)" /><span style={{ fontSize: "0.75rem", color: "rgba(239,239,239,0.4)" }}>{event.location}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Users size={12} color="rgba(77,210,255,0.6)" /><span style={{ fontSize: "0.75rem", color: "rgba(239,239,239,0.4)" }}>{event.entries.length} registered</span></div>
        </div>
        <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
          {event.registrationOpen && event.status !== "completed" ? (
            <button onClick={onRegister} style={{ width: "100%", padding: "12px", background: "transparent", border: "1px solid rgba(77,210,255,0.3)", borderRadius: 10, color: "#4DD2FF", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.1em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textTransform: "uppercase", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#4DD2FF"; e.currentTarget.style.color = "#000"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4DD2FF"; }}>Register Now <ChevronRight size={14} /></button>
          ) : (
            <div style={{ padding: "12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center", fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>{event.status === "completed" ? "Event Completed" : "Registration Closed"}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function EventsPage() {
  const events = useAppStore((s) => s.system.events);
  const [activeEvent, setActiveEvent] = useState<AHGEvent | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "live" | "completed">("all");
  const filtered = events.filter((e) => filter === "all" || e.status === filter);

  // Mouse Glow
  const mouseX = useMotionValue(-300);
  const mouseY = useMotionValue(-300);
  const smoothMouseX = useSpring(mouseX, { stiffness: 140, damping: 24, mass: 0.35 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 140, damping: 24, mass: 0.35 });

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseX.set(e.clientX - 300);
    mouseY.set(e.clientY - 300);
  };

  return (
    <div onMouseMove={handlePointerMove} style={{ minHeight: "100vh", background: "#000", color: "#EFEFEF", fontFamily: "'Outfit','Inter',system-ui,sans-serif", overflowX: "hidden", position: "relative" }}>
      {/* PERSISTENT MOUSE GLOW */}
      <motion.div
        className="hidden md:block pointer-events-none fixed"
        style={{
          x: smoothMouseX,
          y: smoothMouseY,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(77,210,255,0.12) 0%, rgba(77,210,255,0.04) 35%, rgba(77,210,255,0) 70%)",
          filter: "blur(24px)",
          mixBlendMode: "screen",
          zIndex: 5,
        }}
      />

      {/* HERO */}
      <section style={{ position: "relative", padding: "clamp(5rem,14vw,10rem) clamp(1.5rem,6vw,7vw) clamp(3rem,8vw,6rem)", overflow: "hidden", zIndex: 10 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "80px 80px" }} />
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "45vw", height: "45vw", borderRadius: "50%", background: "radial-gradient(circle,rgba(77,210,255,0.09) 0%,transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1300, margin: "0 auto" }}>
          <motion.div {...revealUp(0)} style={{ marginBottom: "1.5rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", color: "#4DD2FF", padding: "6px 14px", border: "1px solid rgba(77,210,255,0.25)", borderRadius: 999, textTransform: "uppercase" }}><Zap size={10} /> After Hours Events</span>
          </motion.div>
          <motion.h1 {...revealUp(0.1)} style={{ fontSize: "clamp(2.5rem,7vw,6.5rem)", fontWeight: 800, lineHeight: 0.92, letterSpacing: "-0.03em", textTransform: "uppercase", margin: 0 }}>
            <span style={{ color: "#EFEFEF" }}>WHERE THE</span><br /><span style={{ color: "#4DD2FF" }}>GRIND MEETS</span><br /><span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", WebkitTextFillColor: "transparent" }}>THE SPOTLIGHT.</span>
          </motion.h1>
          <motion.p {...revealUp(0.2)} style={{ maxWidth: 500, fontSize: "clamp(0.9rem,2.2vw,1.05rem)", fontWeight: 300, lineHeight: 1.75, color: "rgba(239,239,239,0.45)", margin: "2rem 0 0", borderLeft: "2px solid rgba(77,210,255,0.4)", paddingLeft: "1rem" }}>Competitions, workshops, masterclasses. Real events for real athletes. Show up, compete, and earn your place.</motion.p>
          <motion.div {...revealUp(0.3)} style={{ display: "flex", flexWrap: "wrap", gap: "2rem", marginTop: "3rem" }}>
            {[{ icon: Trophy, label: "Events", value: events.length }, { icon: Clock, label: "Upcoming", value: events.filter((e) => e.status === "upcoming").length }, { icon: Zap, label: "Categories", value: [...new Set(events.map((e) => e.category))].length }].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(77,210,255,0.08)", border: "1px solid rgba(77,210,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={15} color="#4DD2FF" /></div>
                <div><div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#EFEFEF", lineHeight: 1 }}>{value}</div><div style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.14em", color: "rgba(239,239,239,0.35)", textTransform: "uppercase" }}>{label}</div></div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FILTER BAR */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1rem clamp(1.5rem,6vw,7vw)" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <Tag size={12} color="rgba(255,255,255,0.25)" />
          {(["all", "upcoming", "live", "completed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 16px", border: filter === f ? "1px solid rgba(77,210,255,0.4)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 999, background: filter === f ? "rgba(77,210,255,0.1)" : "transparent", color: filter === f ? "#4DD2FF" : "rgba(239,239,239,0.4)", fontSize: "0.72rem", fontWeight: filter === f ? 700 : 400, letterSpacing: "0.12em", textTransform: "capitalize", cursor: "pointer", transition: "all 0.2s" }}>{f === "all" ? "All Events" : f}</button>
          ))}
        </div>
      </div>

      {/* GRID */}
      <section style={{ padding: "clamp(2.5rem,7vw,5rem) clamp(1.5rem,6vw,7vw)" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem 0" }}><p style={{ fontSize: "1.1rem", color: "rgba(239,239,239,0.3)", fontWeight: 300 }}>No events found.</p></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "1.5rem" }}>
              {filtered.map((e, i) => <EventCard key={e.id} event={e} idx={i} onRegister={() => setActiveEvent(e)} />)}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>{activeEvent && <RegModal event={activeEvent} onClose={() => setActiveEvent(null)} />}</AnimatePresence>
    </div>
  );
}
