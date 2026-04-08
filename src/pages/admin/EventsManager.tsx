import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit3, Eye, X, ChevronDown, ChevronUp, GripVertical, Users, Calendar, MapPin, Tag, CheckCircle2, AlertCircle } from "lucide-react";
import { useAppStore } from "@/hooks/useStore";
import { AHGEvent, EventFormField, EventFormFieldType } from "@/types";
import { toast } from "sonner";

const FIELD_TYPES: { value: EventFormFieldType; label: string }[] = [
  { value: "text", label: "Short Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Long Text" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Multiple Choice" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "date", label: "Date" },
];

const CATEGORIES = ["Competition", "Workshop", "Seminar", "Social", "Challenge", "Masterclass"];

const inputCls: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#EFEFEF", fontSize: "0.875rem", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
};

/* ─── Field Editor Row ────────────────────────────────── */
function FieldEditor({ field, onUpdate, onDelete }: { field: EventFormField; onUpdate: (f: EventFormField) => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const needsOptions = ["select", "radio", "checkbox"].includes(field.type);

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <GripVertical size={14} color="rgba(255,255,255,0.2)" />
        <span style={{ flex: 1, fontSize: "0.875rem", color: "#EFEFEF", fontWeight: 500 }}>{field.label || "Untitled Field"}</span>
        <span style={{ fontSize: "0.7rem", color: "rgba(77,210,255,0.7)", background: "rgba(77,210,255,0.08)", border: "1px solid rgba(77,210,255,0.15)", padding: "2px 8px", borderRadius: 999 }}>{field.type}</span>
        {field.required && <span style={{ fontSize: "0.65rem", color: "#FF6B6B" }}>required</span>}
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", color: "rgba(255,100,100,0.5)", cursor: "pointer", padding: 4, display: "flex" }}><Trash2 size={13} /></button>
        {expanded ? <ChevronUp size={14} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.3)" />}
      </div>
      {expanded && (
        <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>LABEL</label>
              <input style={inputCls} value={field.label} onChange={(e) => onUpdate({ ...field, label: e.target.value })} placeholder="Field label" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>TYPE</label>
              <select style={{ ...inputCls, cursor: "pointer" }} value={field.type} onChange={(e) => onUpdate({ ...field, type: e.target.value as EventFormFieldType })}>
                {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          {!["radio", "checkbox", "select", "date"].includes(field.type) && (
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>PLACEHOLDER</label>
              <input style={inputCls} value={field.placeholder ?? ""} onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })} />
            </div>
          )}
          {needsOptions && (
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>OPTIONS (one per line)</label>
              <textarea rows={3} style={{ ...inputCls, resize: "vertical" }} value={(field.options ?? []).join("\n")} onChange={(e) => onUpdate({ ...field, options: e.target.value.split("\n").filter(Boolean) })} placeholder="Option 1&#10;Option 2&#10;Option 3" />
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.82rem", color: "rgba(239,239,239,0.7)" }}>
            <input type="checkbox" checked={field.required} onChange={(e) => onUpdate({ ...field, required: e.target.checked })} style={{ accentColor: "#4DD2FF" }} />
            Required field
          </label>
        </div>
      )}
    </div>
  );
}

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
  const [mediaUrl, setMediaUrl] = useState(existing?.mediaUrl ?? "");
  const [regOpen, setRegOpen] = useState(existing?.registrationOpen ?? true);
  const [fields, setFields] = useState<EventFormField[]>(existing?.formFields ?? []);

  const addField = () => {
    const f: EventFormField = { id: `ff-${Date.now()}`, type: "text", label: "", required: false };
    setFields((prev) => [...prev, f]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) { toast.error("Title and date are required."); return; }
    const payload = { title, description, date: new Date(date).toISOString(), location, category, status, mediaType: "image" as const, mediaUrl, registrationOpen: regOpen, formFields: fields, createdBy: currentUser?.id ?? "admin" };
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
            <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", color: "rgba(77,210,255,0.7)", marginBottom: "1rem", textTransform: "uppercase" }}>Event Details</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>EVENT TITLE *</label>
                <input required style={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summer Shred Challenge 2026" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>DESCRIPTION</label>
                <textarea rows={3} style={{ ...inputCls, resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your event…" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>DATE & TIME *</label>
                  <input type="datetime-local" required style={{ ...inputCls, colorScheme: "dark" }} value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>LOCATION</label>
                  <input style={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Mumbai / Online" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>CATEGORY</label>
                  <select style={{ ...inputCls, cursor: "pointer" }} value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>STATUS</label>
                  <select style={{ ...inputCls, cursor: "pointer" }} value={status} onChange={(e) => setStatus(e.target.value as AHGEvent["status"])}><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option></select>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "rgba(239,239,239,0.5)", marginBottom: 6, letterSpacing: "0.08em" }}>POSTER IMAGE URL</label>
                <input style={inputCls} value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://images.unsplash.com/…" />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.85rem", color: "rgba(239,239,239,0.7)" }}>
                <input type="checkbox" checked={regOpen} onChange={(e) => setRegOpen(e.target.checked)} style={{ accentColor: "#4DD2FF" }} />
                Registration Open
              </label>
            </div>
          </div>

          {/* Form Builder */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", color: "rgba(77,210,255,0.7)", margin: 0, textTransform: "uppercase" }}>Registration Form Fields</p>
              <button type="button" onClick={addField} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 700, color: "#4DD2FF", background: "rgba(77,210,255,0.08)", border: "1px solid rgba(77,210,255,0.2)", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}><Plus size={13} /> Add Field</button>
            </div>
            {fields.length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "1.5rem 0" }}>No fields yet. Add one above.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {fields.map((f) => (
                  <FieldEditor key={f.id} field={f}
                    onUpdate={(updated) => setFields((prev) => prev.map((x) => x.id === f.id ? updated : x))}
                    onDelete={() => setFields((prev) => prev.filter((x) => x.id !== f.id))}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "13px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "rgba(239,239,239,0.5)", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button type="submit" style={{ flex: 2, padding: "13px", background: "#4DD2FF", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em" }}>{existing ? "Save Changes" : "Create Event"}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ─── Entries Viewer ────────────────────────────────── */
function EntriesModal({ event, onClose }: { event: AHGEvent; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem 1rem", overflowY: "auto" }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} onClick={(e) => e.stopPropagation()} style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, width: "100%", maxWidth: 720, padding: "clamp(1.5rem,4vw,2.5rem)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#EFEFEF", margin: 0 }}>{event.title}</h2>
            <p style={{ fontSize: "0.75rem", color: "rgba(77,210,255,0.7)", margin: "4px 0 0" }}>{event.entries.length} registered entries</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}><X size={16} /></button>
        </div>
        {event.entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 0" }}><Users size={36} color="rgba(255,255,255,0.1)" style={{ marginBottom: "1rem" }} /><p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>No registrations yet.</p></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {event.entries.map((entry, idx) => (
              <div key={entry.id} style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1rem", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(77,210,255,0.6)" }}>Entry #{idx + 1}</span>
                  <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>{new Date(entry.submittedAt).toLocaleString()}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "0.5rem" }}>
                  {event.formFields.map((f) => {
                    const val = entry.responses[f.id];
                    if (!val || (Array.isArray(val) && val.length === 0)) return null;
                    return (
                      <div key={f.id}>
                        <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "rgba(239,239,239,0.35)", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{f.label}</p>
                        <p style={{ fontSize: "0.85rem", color: "#EFEFEF", margin: 0 }}>{Array.isArray(val) ? val.join(", ") : val}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
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
  const [viewing, setViewing] = useState<AHGEvent | null>(null);

  return (
    <div style={{ padding: "clamp(1.5rem,4vw,2.5rem)", minHeight: "100vh", background: "hsl(0 0% 2%)", color: "#EFEFEF", fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#EFEFEF", margin: 0 }}>Events Manager</h1>
          <p style={{ fontSize: "0.85rem", color: "rgba(239,239,239,0.4)", margin: "4px 0 0" }}>Create, manage and view entries for all After Hours events.</p>
        </div>
        <button onClick={() => setCreating(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#4DD2FF", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", letterSpacing: "0.06em", transition: "opacity 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
          <Plus size={16} /> New Event
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Events", value: events.length, color: "#4DD2FF" },
          { label: "Upcoming", value: events.filter((e) => e.status === "upcoming").length, color: "#A78BFA" },
          { label: "Total Entries", value: events.reduce((s, e) => s + e.entries.length, 0), color: "#34D399" },
          { label: "Live Now", value: events.filter((e) => e.status === "live").length, color: "#FF3C3C" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1rem" }}>
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
            <div key={event.id} style={{ display: "flex", gap: "1rem", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, background: "rgba(255,255,255,0.02)", padding: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              {event.mediaUrl && (
                <img src={event.mediaUrl} alt={event.title} style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#EFEFEF" }}>{event.title}</span>
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.14em",
                    background: event.status === "upcoming" ? "rgba(77,210,255,0.1)" : event.status === "live" ? "rgba(255,60,60,0.1)" : "rgba(255,255,255,0.05)",
                    color: event.status === "upcoming" ? "#4DD2FF" : event.status === "live" ? "#FF3C3C" : "rgba(255,255,255,0.35)",
                    border: `1px solid ${event.status === "upcoming" ? "rgba(77,210,255,0.25)" : event.status === "live" ? "rgba(255,60,60,0.25)" : "rgba(255,255,255,0.08)"}`,
                  }}>{event.status}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "rgba(239,239,239,0.4)" }}><Calendar size={11} />{new Date(event.date).toLocaleDateString()}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "rgba(239,239,239,0.4)" }}><MapPin size={11} />{event.location || "TBD"}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "rgba(239,239,239,0.4)" }}><Tag size={11} />{event.category}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "rgba(239,239,239,0.4)" }}><Users size={11} />{event.entries.length} entries</span>
                  {event.formFields.length > 0 && <span style={{ fontSize: "0.72rem", color: "rgba(167,139,250,0.7)" }}>{event.formFields.length} form fields</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button onClick={() => setViewing(event)} title="View Entries" style={{ padding: "8px 12px", background: "rgba(77,210,255,0.08)", border: "1px solid rgba(77,210,255,0.2)", borderRadius: 8, color: "#4DD2FF", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 600 }}><Eye size={13} />Entries</button>
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
        {viewing && <EntriesModal event={viewing} onClose={() => setViewing(null)} />}
      </AnimatePresence>
    </div>
  );
}
