import { motion } from "framer-motion";
import NotificationRow from "@/components/NotificationRow";
import { notifications } from "@/data/mockData";

export default function NotificationsPage() {
  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">{unread.length} new</p>
        </div>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Mark all read</button>
      </motion.div>

      {unread.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">New</p>
          {unread.map((n) => <NotificationRow key={n.id} notification={n} />)}
        </div>
      )}

      {read.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Earlier</p>
          {read.map((n) => <NotificationRow key={n.id} notification={n} />)}
        </div>
      )}
    </div>
  );
}
