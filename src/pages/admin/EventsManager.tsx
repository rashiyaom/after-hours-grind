import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit3, X, Users, Calendar, MapPin, Tag, Link as LinkIcon, Video } from "lucide-react";
import { useAppStore } from "@/hooks/useStore";
import { AHGEvent } from "@/types";
import { toast } from "sonner";

const CATEGORIES = ["Competition", "Workshop", "Seminar", "Social", "Challenge", "Masterclass"];

const inputCls: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "rgba(201,248,90,0.05)", border: "1px solid rgba(201,248,90,0.16)",
  borderRadius: 8, color: "#EFEFEF", fontSize: "0.875rem", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
};

/* ─── Event Form Modal ──────────────────────────────── */
function EventFormModal({ existing, onClose }: { existing?: AHGEvent; onClose: () => void }) {
  const createEvent = useAppStore((s) => s.createEvent);
  const updateEvent = useAppStore((s) => s.updateEvent);
  const currentUser = useAppStore((s) => s.session.currentUser);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [date, setDate] = useState(existing?.date ? existing.date.slice(0, 16) : "");
  const [location, setLocation] = useState(existing?.location ?? "");
  const [category, setCategory] = useState(existing?.category ?? CATEGORIES[0]);
  const [status, setStatus] = useState<AHGEvent["status"]>(existing?.status ?? "upcoming");
  const [mediaType, setMediaType] = useState<AHGEvent["mediaType"]>(existing?.mediaType ?? "image");
  const [mediaUrl, setMediaUrl] = useState(existing?.mediaUrl ?? "");
  const [registrationLink, setRegistrationLink] = useState(existing?.registrationLink ?? "");
  const [regOpen, setRegOpen] = useState(existing?.registrationOpen ?? true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) { toast.error("Title and date are required."); return; }
    const payload = {
      title,
      description,
      date: new Date(date).toISOString(),
      location,
      category,
      status,
      mediaType,
      mediaUrl,
      registrationLink,
      registrationOpen: regOpen,
      formFields: [],
      createdBy: currentUser?.id ?? "admin",
    };
    if (existing) { updateEvent(existing.id, payload); toast.success("Event updated!"); }
    else { createEvent(payload); toast.success("Event created!"); }
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem 1rem", overflowY: "auto" }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} onClick={(e) => e.stopPropagation()} style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, width: "100%", maxWidth: 680, padding: "clamp(1.5rem,4vw,2.5rem)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#EFEFEF", margin: 0 }}>{existing ? "Edit Event" : "Create New Event"}</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Basic Info */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.25rem" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", color: "rgba(201,248,90,0.75)", marginBottom: "1rem", textTransform: "uppercase" }}>Event Details</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>EVENT TITLE *</label>
                <input required style={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summer Shred Challenge 2026" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>DESCRIPTION</label>
                <textarea rows={3} style={{ ...inputCls, resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your event…" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>DATE & TIME *</label>
                  <input type="datetime-local" required style={{ ...inputCls, colorScheme: "dark" }} value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>LOCATION</label>
                  <input style={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Mumbai / Online" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>CATEGORY</label>
                  <select style={{ ...inputCls, cursor: "pointer" }} value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>STATUS</label>
                  <select style={{ ...inputCls, cursor: "pointer" }} value={status} onChange={(e) => setStatus(e.target.value as AHGEvent["status"])}><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option></select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>MEDIA TYPE</label>
                  <select style={{ ...inputCls, cursor: "pointer" }} value={mediaType} onChange={(e) => setMediaType(e.target.value as AHGEvent["mediaType"])}>
                    <option value="image">Poster Image</option>
                    <option value="video">Promo Video</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>
                    {mediaType === "video" ? "VIDEO URL" : "POSTER IMAGE URL"}
                  </label>
                  <input
                    style={inputCls}
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder={mediaType === "video" ? "https://example.com/event-promo.mp4" : "https://images.unsplash.com/..."}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>REGISTRATION FORM LINK</label>
                <input
                  style={inputCls}
                  value={registrationLink}
                  onChange={(e) => setRegistrationLink(e.target.value)}
                  placeholder="https://docs.google.com/forms/..."
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.85rem", color: "rgba(239,239,239,0.7)" }}>
                <input type="checkbox" checked={regOpen} onChange={(e) => setRegOpen(e.target.checked)} style={{ accentColor: "#C9F85A" }} />
                Registration Open
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "13px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "rgba(239,239,239,0.5)", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button type="submit" style={{ flex: 2, minWidth: 220, padding: "13px", background: "#C9F85A", border: "none", borderRadius: 10, color: "#0E1400", fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em" }}>{existing ? "Save Changes" : "Create Event"}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Manager ──────────────────────────────────── */
export default function AdminEventsManager() {
  const events = useAppStore((s) => s.system.events);
  const deleteEvent = useAppStore((s) => s.deleteEvent);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AHGEvent | null>(null);

  return (
    <div style={{ padding: "clamp(1rem,4vw,2.5rem)", minHeight: "100vh", background: "radial-gradient(800px 420px at 20% 0%, rgba(201,248,90,0.14) 0%, transparent 60%), linear-gradient(180deg, #050804 0%, #040603 45%, #030502 100%)", color: "#EFEFEF", fontFamily: "'Outfit',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.4rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.25rem,4.2vw,1.85rem)", fontWeight: 800, color: "#F3FFD2", margin: 0, letterSpacing: "-0.02em" }}>Events Manager</h1>
          <p style={{ fontSize: "0.85rem", color: "rgba(239,239,239,0.56)", margin: "4px 0 0" }}>Create, manage and review registrations from one control center.</p>
        </div>
        <button onClick={() => setCreating(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#C9F85A", border: "1px solid rgba(201,248,90,0.4)", borderRadius: 12, color: "#111A00", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer", letterSpacing: "0.09em", transition: "opacity 0.2s", textTransform: "uppercase" }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
          <Plus size={16} /> New Event
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.8rem", marginBottom: "1.6rem" }}>
        {[
          { label: "Total Events", value: events.length, color: "#C9F85A" },
          { label: "Upcoming", value: events.filter((e) => e.status === "upcoming").length, color: "#D9FF84" },
          { label: "Links Added", value: events.filter((e) => Boolean(e.registrationLink?.trim())).length, color: "#9BE53D" },
          { label: "Live Now", value: events.filter((e) => e.status === "live").length, color: "#FF7A70" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "0.9rem" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: "0.7rem", color: "rgba(239,239,239,0.4)", marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Events list */}
      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 0", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 16 }}>
          <Calendar size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: "1rem" }} />
          <p style={{ color: "rgba(255,255,255,0.3)" }}>No events yet. Create your first event!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {events.map((event) => (
            <div key={event.id} style={{ display: "flex", gap: "0.9rem", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, background: "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)", padding: "0.9rem", alignItems: "center", flexWrap: "wrap", boxShadow: "0 16px 30px rgba(0,0,0,0.24)" }}>
              {event.mediaUrl && (
                event.mediaType === "video" ? (
                  <video src={event.mediaUrl} style={{ width: "clamp(72px,24vw,120px)", height: "clamp(56px,18vw,84px)", objectFit: "cover", borderRadius: 10, flexShrink: 0 }} muted loop playsInline autoPlay />
                ) : (
                  <img src={event.mediaUrl} alt={event.title} style={{ width: "clamp(72px,24vw,120px)", height: "clamp(56px,18vw,84px)", objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
                )
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#EFEFEF" }}>{event.title}</span>
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.14em",
                    background: event.status === "upcoming" ? "rgba(201,248,90,0.12)" : event.status === "live" ? "rgba(255,60,60,0.1)" : "rgba(255,255,255,0.05)",
                    color: event.status === "upcoming" ? "#C9F85A" : event.status === "live" ? "#FF7979" : "rgba(255,255,255,0.35)",
                    border: `1px solid ${event.status === "upcoming" ? "rgba(201,248,90,0.28)" : event.status === "live" ? "rgba(255,60,60,0.25)" : "rgba(255,255,255,0.08)"}`,
                  }}>{event.status}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "rgba(239,239,239,0.4)" }}><Calendar size={11} />{new Date(event.date).toLocaleDateString()}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "rgba(239,239,239,0.4)" }}><MapPin size={11} />{event.location || "TBD"}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "rgba(239,239,239,0.4)" }}><Tag size={11} />{event.category}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "rgba(239,239,239,0.4)" }}>
                    {event.mediaType === "video" ? <Video size={11} /> : <Users size={11} />}
                    {event.mediaType === "video" ? "Video" : "Poster"}
                  </span>
                  {event.registrationLink?.trim() && <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "rgba(201,248,90,0.75)" }}><LinkIcon size={11} />Registration Link Added</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap" }}>
                <button onClick={() => setEditing(event)} title="Edit" style={{ padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(239,239,239,0.6)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}><Edit3 size={13} />Edit</button>
                <button onClick={() => { if (confirm(`Delete "${event.title}"?`)) deleteEvent(event.id); }} title="Delete" style={{ padding: "8px", background: "rgba(255,60,60,0.06)", border: "1px solid rgba(255,60,60,0.15)", borderRadius: 8, color: "rgba(255,100,100,0.6)", cursor: "pointer", display: "flex" }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {creating && <EventFormModal onClose={() => setCreating(false)} />}
        {editing && <EventFormModal existing={editing} onClose={() => setEditing(null)} />}
      </AnimatePresence>
    </div>
  );
}
