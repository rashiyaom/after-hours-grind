import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload as UploadIcon, MapPin, Activity,
  Hash, FileText, Loader2, X, Image as ImageIcon, Video
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { toast } from "sonner";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";
import { ApiError, uploadMediaFile } from "@/lib/api";

const suggestedTags = ["#push", "#pull", "#legs", "#discipline", "#afterhours", "#grind", "#bio_sync", "#apex"];

export default function UploadPage() {
  const requiresCloudinary = import.meta.env.PROD;
  const navigate = useNavigate();
  const { student, addPost, updateProfile } = useStore();
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set(["#afterhours"]));
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<"image" | "video" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*,video/*";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    const isImage = selected.type.startsWith("image/");
    const isVideo = selected.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Only image and video files are supported.");
      return;
    }

    if (selected.size > 25 * 1024 * 1024) {
      toast.error("File too large. Max 25MB per upload.");
      return;
    }

    setFile(selected);
    setMediaKind(isVideo ? "video" : "image");
    if (filePreview) URL.revokeObjectURL(filePreview);
    const url = URL.createObjectURL(selected);
    setFilePreview(url);

    toast.success(`${selected.name} selected`);
  };

  const clearFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(null);
    setFilePreview(null);
    setMediaKind(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!mediaKind) {
      toast.error("Please choose a photo or video");
      return;
    }
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    setSubmitting(true);
    try {
      const uploaded = await uploadMediaFile(file);
      if (requiresCloudinary && uploaded.provider !== "cloudinary") {
        toast.error("Cloudinary is required in production. Please configure the backend media provider.");
        return;
      }

      const mediaUrl = uploaded.url;
      const tags = Array.from(activeTags).join(" ");
      const normalizedCaption = [caption.trim(), tags].filter(Boolean).join("\n\n");

      await addPost({
        userId: student.id,
        userName: student.name,
        userAvatar: student.avatar,
        userRole: "student",
        source: "general",
        type: mediaKind,
        mediaUrl,
        caption: normalizedCaption,
        location: location || "After Hours Gym",
      });

      toast.success("Post shared to feed");
      navigate("/student/feed");
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "Unable to upload right now. Please try again.");
      } else {
        toast.error("Unable to upload right now. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-10 pb-28 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl pointer-events-none" />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,video/*"
      />

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-display font-semibold text-foreground tracking-tight">Create Post</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Share a photo or video with your community.
        </p>
      </motion.div>

      {/* Media selector / preview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.1 }}
      >
        {file && filePreview ? (
          <div className="glass-card p-6 border border-white/5 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {mediaKind === "video" ? <Video className="h-5 w-5 text-primary" /> : <ImageIcon className="h-5 w-5 text-primary" />}
                <div>
                  <p className="text-sm font-semibold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB · {mediaKind === "video" ? "Video" : "Photo"}</p>
                </div>
              </div>
              <button onClick={clearFile} className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-background border border-white/5">
              {mediaKind === "video" && file.type.startsWith("video/") ? (
                <video src={filePreview} controls className="w-full max-h-64 object-contain" />
              ) : (
                <img src={filePreview} alt="Upload preview" className="w-full max-h-64 object-contain" />
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleFileSelect}
            className="w-full glass-card p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group hover:bg-zinc-900/40 border border-white/5 hover:border-white/10"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <UploadIcon className="h-6 w-6 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground">Upload Photo or Video</p>
            <p className="mt-1 text-sm text-muted-foreground">JPG, PNG, WEBP, MP4, MOV, WEBM · up to 25MB</p>
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-4 text-xs text-muted-foreground/70">
              Tap to choose from your device
            </div>
          </button>
        )}
      </motion.div>

      {/* Caption */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.15 }}
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
          placeholder="Write something about this post..."
          rows={4}
          className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors resize-none"
        />
      </motion.div>

      {/* Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.2 }}
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
            placeholder="Add location"
            className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors"
          />
        </div>
        <div className="glass-card p-5 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <label className="text-xs font-semibold text-muted-foreground">Post Focus</label>
          </div>
          <p className="text-sm text-muted-foreground/80 leading-6">
            Share your workout, meal prep, or recovery win. Keep the context in the caption and tags.
          </p>
        </div>
      </motion.div>

      {/* Tags */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.25 }}
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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.3 }} className="space-y-3 pt-2">
        <button
          onClick={handleSubmit}
          disabled={submitting || !file}
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
              Post to Feed
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
