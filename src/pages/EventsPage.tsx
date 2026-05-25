import { useState, useEffect } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { Calendar, MapPin, ArrowRight, Zap, Users, Trophy, Clock, Tag, ExternalLink, Video } from "lucide-react";
import { useAppStore } from "@/hooks/useStore";
import { AHGEvent } from "@/types";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const revealUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.7, ease, delay },
});

function StatusBadge({ status }: { status: AHGEvent["status"] }) {
  const cfg = {
    upcoming: { label: "Upcoming", bg: "rgba(201,248,90,0.12)", border: "rgba(201,248,90,0.3)", color: "#C9F85A" },
    live: { label: "🔴 Live Now", bg: "rgba(255,60,60,0.12)", border: "rgba(255,60,60,0.3)", color: "#FF3C3C" },
    completed: { label: "Completed", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" },
  }[status];
  return <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", padding: "4px 10px", borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, textTransform: "uppercase" }}>{cfg.label}</span>;
}

const isSafeExternalLink = (link?: string): boolean => {
  if (!link) return false;
  try {
    const url = new URL(link);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

function EventCard({ event, idx }: { event: AHGEvent; idx: number }) {
  const d = new Date(event.date);
  const hasRegistrationLink = isSafeExternalLink(event.registrationLink);
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.65, ease, delay: idx * 0.1 }} whileHover={{ y: -8, boxShadow: "0 24px 48px rgba(201,248,90,0.1)" }} style={{ background: "#080808", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", transition: "all 0.3s ease" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,248,90,0.35)")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
      <motion.div whileHover="hover" style={{ position: "relative", height: "clamp(190px,34vw,238px)", overflow: "hidden" }}>
        {event.mediaType === "video" ? (
          <motion.video
            variants={{ hover: { scale: 1.08 } }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            src={event.mediaUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover", transformOrigin: "center" }}
            muted
            loop
            autoPlay
            playsInline
          />
        ) : (
          <motion.img
            variants={{ hover: { scale: 1.08 } }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            src={event.mediaUrl}
            alt={event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", transformOrigin: "center" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080808 0%, transparent 55%)" }} />
        <div style={{ position: "absolute", top: 14, left: 14, right: 14, display: "flex", justifyContent: "space-between" }}><StatusBadge status={event.status} /><span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.5)", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: 999, textTransform: "uppercase" }}>{event.category}</span></div>
        <div style={{ position: "absolute", bottom: 14, left: 14, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(201,248,90,0.22)", borderRadius: 12, padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#C9F85A", lineHeight: 1 }}>{d.getDate()}</div>
          <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.18em", color: "rgba(201,248,90,0.75)" }}>{d.toLocaleString("en", { month: "short" }).toUpperCase()}</div>
        </div>
      </motion.div>
      <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#EFEFEF", margin: 0, lineHeight: 1.3 }}>{event.title}</h3>
        <p style={{ fontSize: "0.85rem", fontWeight: 300, color: "rgba(239,239,239,0.45)", lineHeight: 1.7, margin: 0 }}>{event.description.length > 120 ? event.description.slice(0, 120) + "…" : event.description}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={12} color="rgba(201,248,90,0.7)" /><span style={{ fontSize: "0.75rem", color: "rgba(239,239,239,0.4)" }}>{event.location}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {event.mediaType === "video" ? <Video size={12} color="rgba(201,248,90,0.7)" /> : <Users size={12} color="rgba(201,248,90,0.7)" />}
            <span style={{ fontSize: "0.75rem", color: "rgba(239,239,239,0.4)" }}>
              {event.mediaType === "video" ? "Video event" : "Poster event"}
            </span>
          </div>
        </div>
        <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
          {event.registrationOpen && event.status !== "completed" && hasRegistrationLink ? (
            <a
              href={event.registrationLink}
              target="_blank"
              rel="noreferrer"
              style={{ width: "100%", padding: "12px", background: "transparent", border: "1px solid rgba(201,248,90,0.35)", borderRadius: 10, color: "#C9F85A", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.1em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textTransform: "uppercase", transition: "all 0.2s", textDecoration: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#C9F85A"; e.currentTarget.style.color = "#0E1400"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C9F85A"; }}
            >
              Register Now <ExternalLink size={14} />
            </a>
          ) : event.registrationOpen && event.status !== "completed" ? (
            <div style={{ padding: "12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center", fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Registration Link Coming Soon</div>
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
  const [filter, setFilter] = useState<"all" | "upcoming" | "live" | "completed">("all");
  const filtered = events.filter((e) => filter === "all" || e.status === filter);
  const liveEventsCount = events.filter((e) => e.status === "live").length;
  const upcomingEventsCount = events.filter((e) => e.status === "upcoming").length;
  const categoriesCount = [...new Set(events.map((e) => e.category))].length;
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    const onResize = () => setIsPhone(window.innerWidth < 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
    <div onMouseMove={handlePointerMove} style={{ minHeight: "100vh", background: "linear-gradient(180deg, #040502 0%, #060904 38%, #020401 100%)", color: "#EFEFEF", fontFamily: "'Outfit','Inter',system-ui,sans-serif", overflowX: "hidden", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(1100px 520px at 10% 4%, rgba(173,255,47,0.16) 0%, transparent 62%), radial-gradient(900px 520px at 88% 12%, rgba(255,205,88,0.12) 0%, transparent 64%), linear-gradient(transparent 0%, rgba(0,0,0,0.18) 100%)" }} />

      {/* PERSISTENT MOUSE GLOW */}
      <motion.div
        className="hidden md:block pointer-events-none fixed"
        style={{
          x: smoothMouseX,
          y: smoothMouseY,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,248,90,0.12) 0%, rgba(201,248,90,0.04) 35%, rgba(201,248,90,0) 70%)",
          filter: "blur(24px)",
          mixBlendMode: "screen",
          zIndex: 5,
        }}
      />

      {/* HERO */}
      <section style={{ position: "relative", padding: "calc(64px + clamp(0.8rem,3.2vw,2.1rem)) clamp(1rem,5vw,7vw) clamp(2.4rem,7vw,5rem)", overflow: "hidden", zIndex: 10 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)", backgroundSize: "84px 84px" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1300, margin: "0 auto", display: "grid", gridTemplateColumns: isPhone ? "1fr" : "minmax(0,1.25fr) minmax(290px,0.75fr)", gap: "clamp(1.2rem,3vw,3rem)", alignItems: "stretch" }}>
          <motion.div {...revealUp(0)} style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 22, padding: isPhone ? "1.1rem" : "1.5rem", background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 50%, rgba(201,248,90,0.07) 100%)", boxShadow: "0 24px 42px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: "1rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.22em", color: "#C9F85A", padding: "6px 14px", border: "1px solid rgba(201,248,90,0.36)", borderRadius: 999, textTransform: "uppercase" }}><Zap size={10} /> Events Control Lane</span>
              <span style={{ fontSize: "0.66rem", color: "rgba(239,239,239,0.55)", textTransform: "uppercase", letterSpacing: "0.14em" }}>{liveEventsCount} live now</span>
            </div>

            <motion.h1 {...revealUp(0.1)} style={{ fontSize: isPhone ? "clamp(2rem,14vw,3.2rem)" : "clamp(2.7rem,6.2vw,5.6rem)", fontWeight: 800, lineHeight: 0.95, letterSpacing: "-0.03em", textTransform: "uppercase", margin: 0 }}>
              <span style={{ color: "#F4FFD9" }}>Built For</span><br />
              <span style={{ color: "#C9F85A" }}>Real Competition</span>
            </motion.h1>

            <motion.p {...revealUp(0.2)} style={{ maxWidth: 620, fontSize: "clamp(0.92rem,2.1vw,1.05rem)", fontWeight: 350, lineHeight: 1.75, color: "rgba(239,239,239,0.6)", margin: "1rem 0 0" }}>
              From city-level throwdowns to niche skill masterclasses, this is your single command center to discover, register, and show up prepared.
            </motion.p>

            <motion.div {...revealUp(0.28)} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.6rem", marginTop: "1.2rem" }}>
              {[
                { label: "Total Events", value: events.length, icon: Trophy },
                { label: "Upcoming", value: upcomingEventsCount, icon: Clock },
                { label: "Categories", value: categoriesCount, icon: Tag },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} style={{ border: "1px solid rgba(201,248,90,0.2)", borderRadius: 14, padding: "0.72rem 0.8rem", background: "rgba(8,14,5,0.55)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: "0.63rem", color: "rgba(239,239,239,0.52)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                    <Icon size={12} color="rgba(201,248,90,0.95)" />
                  </div>
                  <div style={{ fontSize: "1.3rem", lineHeight: 1, fontWeight: 800, color: "#F2FFD0" }}>{value}</div>
                </div>
              ))}
            </motion.div>

            <motion.div {...revealUp(0.36)} style={{ marginTop: "1.2rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <a href="#events-grid" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "0.9rem 1.35rem", borderRadius: 12, background: "#C9F85A", color: "#0E1400", textDecoration: "none", fontSize: "0.76rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Enter Events <ArrowRight size={15} />
              </a>
              <button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.84rem 1.15rem", borderRadius: 12, border: "1px solid rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.03)", color: "rgba(239,239,239,0.86)", fontSize: "0.73rem", fontWeight: 700, letterSpacing: "0.11em", textTransform: "uppercase", cursor: "pointer" }}>
                Browse Tracks
              </button>
            </motion.div>
          </motion.div>

          <motion.div {...revealUp(0.18)} style={{ display: "grid", gap: "0.72rem", alignSelf: "stretch" }}>
            {[
              { icon: Trophy, title: "Live Events", sub: "Compete in real-time" },
              { icon: Calendar, title: "Upcoming", sub: "Plan your next month" },
              { icon: MapPin, title: "Nationwide", sub: "Multiple cities and online" },
            ].map(({ icon: Icon, title, sub }, idx) => (
              <motion.div key={title} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.1 + idx * 0.08 }} style={{ border: "1px solid rgba(255,255,255,0.09)", background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)", borderRadius: 16, padding: "0.9rem 1rem", display: "flex", alignItems: "center", gap: "0.85rem", backdropFilter: "blur(10px)", boxShadow: "0 14px 30px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(201,248,90,0.13)", border: "1px solid rgba(201,248,90,0.24)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={16} color="#C9F85A" /></div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.98rem", fontWeight: 680, color: "rgba(239,239,239,0.96)" }}>{title}</p>
                  <p style={{ margin: "0.18rem 0 0", fontSize: "0.78rem", color: "rgba(239,239,239,0.44)" }}>{sub}</p>
                </div>
              </motion.div>
            ))}

            <div style={{ border: "1px solid rgba(201,248,90,0.18)", borderRadius: 16, padding: "0.9rem", background: "rgba(9,16,5,0.55)" }}>
              <p style={{ margin: 0, fontSize: "0.62rem", letterSpacing: "0.16em", color: "rgba(201,248,90,0.8)", textTransform: "uppercase" }}>Active Categories</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.48rem", marginTop: "0.62rem" }}>
                {["Competition", "Workshop", "Masterclass", "Challenge"].map((item) => (
                  <span key={item} style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.38rem 0.68rem", borderRadius: 999, border: "1px solid rgba(201,248,90,0.22)", color: "rgba(201,248,90,0.92)", background: "rgba(201,248,90,0.08)" }}>{item}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FILTER BAR */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1rem clamp(1rem,5vw,7vw)" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", gap: "0.5rem", flexWrap: "nowrap", alignItems: "center", overflowX: "auto", paddingBottom: 2 }}>
          <Tag size={12} color="rgba(255,255,255,0.25)" />
          {(["all", "upcoming", "live", "completed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 16px", border: filter === f ? "1px solid rgba(201,248,90,0.45)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 999, background: filter === f ? "rgba(201,248,90,0.12)" : "transparent", color: filter === f ? "#C9F85A" : "rgba(239,239,239,0.4)", fontSize: "0.72rem", fontWeight: filter === f ? 700 : 500, letterSpacing: "0.12em", textTransform: "capitalize", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0 }}>{f === "all" ? "All Events" : f}</button>
          ))}
        </div>
      </div>

      {/* GRID */}
      <section id="events-grid" style={{ padding: "clamp(2.2rem,7vw,5rem) clamp(1rem,5vw,7vw)" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem 0" }}><p style={{ fontSize: "1.1rem", color: "rgba(239,239,239,0.3)", fontWeight: 300 }}>No events found.</p></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" }}>
              {filtered.map((e, i) => <EventCard key={e.id} event={e} idx={i} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
