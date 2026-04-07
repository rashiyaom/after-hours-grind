import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload as UploadIcon, Camera, Video, MapPin, Footprints,
  Hash, FileText, Check, Loader2, ShieldCheck, Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { toast } from "sonner";

const suggestedTags = ["#push", "#pull", "#legs", "#discipline", "#afterhours", "#grind", "#bio_sync", "#apex"];

export default function UploadPage() {
  const navigate = useNavigate();
  const { student, addSubmission, addPost } = useStore();
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [steps, setSteps] = useState("");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set(["#afterhours"]));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadType, setUploadType] = useState<"workout" | "meal" | null>(null);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!uploadType) {
      toast.error("MISSION_FAILURE: SELECT UPLOAD TYPE");
      return;
    }
    
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 2200));
    
    const taskName = uploadType === "workout" ? "Daily Workout Session" : "Nutrition Log";
    const mediaType = uploadType === "workout" ? "video" : "image";
    
    addSubmission({
      studentId: student.id,
      studentName: student.name,
      taskName,
      mediaUrl: "", // Mocked
      type: mediaType,
    });

    addPost({
      userId: student.id,
      userName: student.name,
      userAvatar: student.avatar,
      userRole: "student",
      type: mediaType,
      mediaUrl: "",
      caption: `${caption}\n\n${Array.from(activeTags).join(" ")}`,
      location: location || "Command Center",
    });

    setSubmitting(false);
    setSubmitted(true);
    toast.success("Check-in Submitted successfully");
    await new Promise((r) => setTimeout(r, 1500));
    navigate("/student/feed");
  };

  if (submitted) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center">
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 12 }}>
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8">
            <Check className="h-12 w-12 text-primary" />
          </div>
        </motion.div>
        <h2 className="text-3xl font-display font-semibold text-foreground tracking-tight mb-3">Success</h2>
        <p className="text-sm font-medium text-muted-foreground max-w-[300px]">
           Your progress has been submitted and shared with your trainer.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-10 pb-28 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-neon-orange/5 blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-display font-semibold text-foreground tracking-tight">Daily Check-in</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Log your daily progress and upload your proof
        </p>
      </motion.div>

      {/* Upload Type Selector */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid sm:grid-cols-2 gap-4"
      >
        {[
          { type: "workout" as const, icon: Video, label: "Workout Video", desc: "Upload your workout clip" },
          { type: "meal" as const, icon: Camera, label: "Meal Photo", desc: "Upload your nutrition photo" },
        ].map(({ type, icon: Icon, label, desc }) => (
          <button
            key={type}
            onClick={() => setUploadType(uploadType === type ? null : type)}
            className={`glass-card p-6 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${
              uploadType === type ? "border-primary/40 bg-zinc-900/80 shadow-lg scale-[1.02]" : "hover:bg-zinc-900/40 border border-white/5 hover:border-white/10"
            }`}
          >
            <Icon className={`h-8 w-8 mx-auto mb-4 transition-colors ${uploadType === type ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
            <p className={`text-base font-semibold mb-1 transition-colors ${uploadType === type ? "text-foreground" : "text-foreground"}`}>
              {label}
            </p>
            <p className="text-xs text-muted-foreground">{desc}</p>
            <div className={`mt-5 border-2 border-dashed rounded-2xl p-5 transition-all ${uploadType === type ? "border-primary/30 bg-primary/5" : "border-white/5"}`}>
              {uploadType === type ? (
                <div className="flex items-center justify-center gap-2 text-foreground">
                  <div className="p-1 rounded-full bg-primary text-black">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium">Selected</span>
                </div>
              ) : (
                <>
                  <UploadIcon className="h-5 w-5 text-muted-foreground/30 mx-auto group-hover:scale-110 transition-transform group-hover:text-primary/50" />
                  <p className="text-xs text-muted-foreground/50 mt-3 flex items-center justify-center gap-2">
                    Tap to upload
                  </p>
                </>
              )}
            </div>
          </button>
        ))}
      </motion.div>

      {/* Caption */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-6 space-y-4 border border-white/5"
      >
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Caption</h3>
          <span className="ml-auto text-xs text-muted-foreground">{caption.length}/280</span>
        </div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 280))}
          placeholder="How did the session go?"
          rows={4}
          className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors resize-none"
        />
      </motion.div>

      {/* Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid sm:grid-cols-2 gap-4"
      >
        <div className="glass-card p-5 focus-within:border-primary/40 transition-colors group border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <label className="text-xs font-semibold text-muted-foreground group-focus-within:text-foreground transition-colors">Location</label>
          </div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="College Gym"
            className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors"
          />
        </div>
        <div className="glass-card p-5 focus-within:border-primary/40 transition-colors group border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Footprints className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <label className="text-xs font-semibold text-muted-foreground group-focus-within:text-foreground transition-colors">Steps</label>
          </div>
          <input
            type="number"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="8432"
            className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors"
          />
        </div>
      </motion.div>

      {/* Tags */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-6 border border-white/5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-semibold text-foreground">Tags</label>
          <span className="ml-auto text-xs text-muted-foreground">{activeTags.size} selected</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeTags.has(tag)
                  ? "bg-primary text-black border-primary"
                  : "bg-background border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Submit */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3 pt-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 rounded-xl bg-primary text-black font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <UploadIcon className="h-5 w-5" />
              Submit Check-in
            </>
          )}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="w-full py-4 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}
