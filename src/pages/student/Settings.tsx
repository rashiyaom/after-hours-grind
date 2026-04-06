import { motion } from "framer-motion";
import { User, Bell, Shield, Palette, Smartphone, Footprints, LogOut, ChevronRight } from "lucide-react";

const settingsGroups = [
  {
    title: "Account",
    items: [
      { label: "Account Info", desc: "Name, email, college ID", icon: User },
      { label: "Profile Settings", desc: "Bio, avatar, fitness goals", icon: User },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "Privacy", desc: "Profile visibility, data sharing", icon: Shield },
      { label: "Notifications", desc: "Push, email, in-app alerts", icon: Bell },
      { label: "Appearance", desc: "Theme, display preferences", icon: Palette },
    ],
  },
  {
    title: "Integrations",
    items: [
      { label: "Connected Devices", desc: "Coming soon", icon: Smartphone, comingSoon: true },
      { label: "Step Sync", desc: "Sync with health apps — coming soon", icon: Footprints, comingSoon: true },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
      </motion.div>

      {settingsGroups.map((group) => (
        <motion.div key={group.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{group.title}</p>
          <div className="glass-card divide-y divide-border/50">
            {group.items.map((item) => (
              <button key={item.label} className="w-full flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                <div className="p-2 rounded-xl bg-accent">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    {item.label}
                    {item.comingSoon && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Soon</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
              </button>
            ))}
          </div>
        </motion.div>
      ))}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <button className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </motion.div>
    </div>
  );
}
