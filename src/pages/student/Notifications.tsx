import { motion } from "framer-motion";
import NotificationRow from "@/components/NotificationRow";
import { CheckCheck, Bell } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";
import { NotificationListSkeleton } from "@/components/Skeletons";

export default function NotificationsPage() {
  const { notifications: items, markNotificationRead, markAllNotificationsRead } = useStore();

  const unread = items.filter((n) => !n.read);
  const read = items.filter((n) => n.read);

  const markAllRead = () => markAllNotificationsRead();

  const markRead = (id: string) => markNotificationRead(id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unread.length > 0 ? `${unread.length} new` : "All caught up!"}
          </p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </motion.div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-16 text-center"
        >
          <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </motion.div>
      ) : (
        <>
          {unread.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.05 }} className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-1">New</p>
              <div className="glass-card p-1 space-y-0.5">
                {unread.map((n) => (
                  <div key={n.id} onClick={() => markRead(n.id)}>
                    <NotificationRow notification={n} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {read.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.1 }} className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-1">Earlier</p>
              <div className="glass-card p-1 space-y-0.5">
                {read.map((n) => (
                  <NotificationRow key={n.id} notification={n} />
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
