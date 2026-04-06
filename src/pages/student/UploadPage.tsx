import { useState } from "react";
import { motion } from "framer-motion";
import {
  Upload as UploadIcon, Camera, Video, MapPin, Footprints,
  Hash, FileText, Check, X, Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const suggestedTags = ["#chestday", "#pushday", "#gains", "#discipline", "#afterhours", "#grind", "#legday", "#mealprep"];

export default function UploadPage() {
  const navigate = useNavigate();
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
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1800));
    setSubmitting(false);
    setSubmitted(true);
    await new Promise((r) => setTimeout(r, 1200));
    navigate("/student/feed");
  };

  if (submitted) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <div className="w-20 h-20 rounded-full bg-foreground/10 flex items-center justify-center mb-6">
            <Check className="h-10 w-10 text-foreground" />
          </div>
        </motion.div>
        <h2 className="text-xl font-display font-bold text-foreground mb-2">Check-in Submitted!</h2>
        <p className="text-sm text-muted-foreground">Your progress has been shared with your trainer and community.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Daily Check-in</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload your proof and log today's progress</p>
      </motion.div>

      {/* Upload Type Selector */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid sm:grid-cols-2 gap-4"
      >
        {[
          { type: "workout" as const, icon: Video, label: "Workout Video", desc: "Record or upload your workout clip" },
          { type: "meal" as const, icon: Camera, label: "Meal Photo", desc: "Snap a photo of your meal" },
        ].map(({ type, icon: Icon, label, desc }) => (
          <button
            key={type}
            onClick={() => setUploadType(uploadType === type ? null : type)}
            className={`glass-card p-6 text-center cursor-pointer transition-all ${
              uploadType === type ? "border-foreground/40 bg-card/90" : "hover:bg-card/80"
            }`}
          >
            <Icon className={`h-8 w-8 mx-auto mb-3 ${uploadType === type ? "text-foreground" : "text-muted-foreground"}`} />
            <p className={`text-sm font-medium mb-1 ${uploadType === type ? "text-foreground" : "text-foreground"}`}>
              {label}
            </p>
            <p className="text-xs text-muted-foreground">{desc}</p>
            <div className={`mt-4 border-2 border-dashed rounded-xl p-5 transition-colors ${uploadType === type ? "border-foreground/30 bg-foreground/5" : "border-border"}`}>
              {uploadType === type ? (
                <div className="flex items-center justify-center gap-2 text-foreground">
                  <Check className="h-4 w-4" />
                  <span className="text-xs font-medium">Selected</span>
                </div>
              ) : (
                <>
                  <UploadIcon className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                  <p className="text-[11px] text-muted-foreground/50 mt-2">Tap to select</p>
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
        transition={{ delay: 0.1 }}
        className="glass-card p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-foreground" />
          <h3 className="font-display font-semibold text-foreground">Progress Note</h3>
          <span className="ml-auto text-[11px] text-muted-foreground">{caption.length}/280</span>
        </div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 280))}
          placeholder="How did today's session go? Any PRs? Struggles?"
          rows={4}
          className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </motion.div>

      {/* Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid sm:grid-cols-2 gap-4"
      >
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Location</label>
          </div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="College Gym"
            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Footprints className="h-4 w-4 text-muted-foreground" />
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Step Count</label>
          </div>
          <input
            type="number"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="8,432"
            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </motion.div>

      {/* Tags */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Tags</label>
          <span className="ml-auto text-[11px] text-muted-foreground">{activeTags.size} selected</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTags.has(tag)
                  ? "bg-foreground text-background"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Submit */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-foreground text-background py-3.5 rounded-xl font-medium text-sm hover:bg-foreground/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadIcon className="h-4 w-4" />
              Submit Check-in
            </>
          )}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}
