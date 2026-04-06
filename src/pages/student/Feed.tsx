import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import FeedPostCard from "@/components/FeedPostCard";
import { mockPosts } from "@/data/mockData";
import { Link } from "react-router-dom";

const tabs = ["Following", "Community", "Trainers"];

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState("Following");
  const filtered = activeTab === "Trainers" ? mockPosts.filter(p => p.userRole === "trainer") : mockPosts;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Feed</h1>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-xl">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === t ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filtered.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Floating Create Button */}
      <Link to="/student/upload" className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 p-4 rounded-full bg-foreground text-background shadow-2xl hover:scale-105 transition-transform z-30">
        <Plus className="h-5 w-5" />
      </Link>
    </div>
  );
}
