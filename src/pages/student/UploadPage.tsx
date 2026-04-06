import { motion } from "framer-motion";
import { Upload as UploadIcon, Camera, Video, MapPin, Footprints, Hash, FileText } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Daily Check-in</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload your proof and log today's progress</p>
      </motion.div>

      {/* Upload Areas */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 text-center cursor-pointer hover:bg-card/80 transition-colors">
          <Video className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Workout Video</p>
          <p className="text-xs text-muted-foreground">Record or upload your workout clip</p>
          <div className="mt-4 border-2 border-dashed border-border rounded-xl p-6">
            <UploadIcon className="h-5 w-5 text-muted-foreground/50 mx-auto" />
            <p className="text-[11px] text-muted-foreground/50 mt-2">Drag & drop or tap to browse</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-8 text-center cursor-pointer hover:bg-card/80 transition-colors">
          <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Meal Photo</p>
          <p className="text-xs text-muted-foreground">Snap a photo of your meal</p>
          <div className="mt-4 border-2 border-dashed border-border rounded-xl p-6">
            <UploadIcon className="h-5 w-5 text-muted-foreground/50 mx-auto" />
            <p className="text-[11px] text-muted-foreground/50 mt-2">Drag & drop or tap to browse</p>
          </div>
        </motion.div>
      </div>

      {/* Caption */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-foreground" />
          <h3 className="font-display font-semibold text-foreground">Progress Note</h3>
        </div>
        <textarea placeholder="How did today's session go? Any PRs? Struggles?" rows={4} className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
      </motion.div>

      {/* Metadata */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid sm:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Location</label>
          </div>
          <input placeholder="College Gym" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Footprints className="h-4 w-4 text-muted-foreground" />
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Step Count</label>
          </div>
          <input type="number" placeholder="8,432" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
      </motion.div>

      {/* Tags */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Tags</label>
        </div>
        <div className="flex flex-wrap gap-2">
          {["#chestday", "#pushday", "#gains", "#discipline", "#afterhours"].map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-accent text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">{tag}</span>
          ))}
        </div>
      </motion.div>

      {/* Submit */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <button className="w-full bg-foreground text-background py-3.5 rounded-xl font-medium text-sm hover:bg-foreground/90 transition-colors">
          Submit Check-in
        </button>
      </motion.div>
    </div>
  );
}
