import React from "react";
import { NotificationItem } from "@/types";
import { Flame, TrendingUp, Heart, CheckCircle, MessageCircle, Award, FilePlus, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

const iconMap: Record<string, React.ElementType> = {
  flame: Flame,
  "trending-up": TrendingUp,
  heart: Heart,
  "check-circle": CheckCircle,
  "message-circle": MessageCircle,
  award: Award,
  "file-plus": FilePlus,
  clipboard: ClipboardList,
};

const typeColors: Record<string, string> = {
  streak: "text-streak",
  rank: "text-foreground",
  social: "text-muted-foreground",
  trainer: "text-muted-foreground",
  plan: "text-muted-foreground",
};

export default function NotificationRow({ notification }: { notification: NotificationItem }) {
  const Icon = iconMap[notification.icon] || ClipboardList;
  const iconColor = typeColors[notification.type] || "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-4 p-4 rounded-2xl transition-colors cursor-pointer ${
        notification.read ? "hover:bg-accent/30" : "bg-accent/50 hover:bg-accent/70"
      }`}
    >
      <div className={`p-2.5 rounded-xl flex-shrink-0 ${notification.read ? "bg-muted" : "bg-accent"}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${notification.read ? "text-secondary-foreground" : "text-foreground font-medium"}`}>
          {notification.message}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">{notification.timestamp}</p>
      </div>
      {!notification.read && <div className="w-2 h-2 rounded-full bg-streak mt-2 flex-shrink-0" />}
    </motion.div>
  );
}
