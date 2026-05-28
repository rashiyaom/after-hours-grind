import { Variants, motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Flame,
  LineChart,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageTitle } from "@/components/ui/PageTitle";

const featureTiles = [
  {
    title: "Daily Plan Engine",
    subtitle: "Execute workouts and meals with real-time status sync.",
    cta: "Open Daily Plan",
    to: "/student/daily-plan",
    icon: Calendar,
  },
  {
    title: "Progress Analytics",
    subtitle: "Track streaks, completion, and performance trends.",
    cta: "View Progress",
    to: "/student/progress",
    icon: LineChart,
  },
  {
    title: "Community Feed",
    subtitle: "Follow athletes, react to posts, and stay in the loop.",
    cta: "Open Feed",
    to: "/student/feed",
    icon: Users,
  },
  {
    title: "Proof Upload",
    subtitle: "Submit evidence and keep your momentum visible.",
    cta: "Upload Now",
    to: "/student/upload",
    icon: Upload,
  },
  {
    title: "Leaderboard",
    subtitle: "Compete with top performers and climb your rank.",
    cta: "Go to Leaderboard",
    to: "/student/leaderboard",
    icon: Trophy,
  },
  {
    title: "Achievements",
    subtitle: "Unlock milestones and badges as you improve.",
    cta: "See Achievements",
    to: "/student/achievements",
    icon: Flame,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

export default function FeatureStudioPage() {
  return (
    <div className="relative min-h-screen w-full bg-black text-white">
      <div className="absolute inset-0 bg-grid-pattern bg-center [mask-image:linear-gradient(to_bottom,white_5%,transparent_80%)]" />
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageTitle
          title="Feature Studio"
          subtitle="Everything you need, one premium control deck."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {featureTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <motion.div key={tile.title} variants={itemVariants}>
                <Link
                  to={tile.to}
                  className="group block h-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 transition-all duration-300 hover:border-neon-green/50 hover:bg-neutral-900 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-neutral-800 p-3">
                      <Icon className="h-6 w-6 text-neon-green" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-neutral-600 transition-transform group-hover:translate-x-1 group-hover:text-neon-yellow" />
                  </div>
                  <div className="mt-4">
                    <h2 className="text-lg font-bold text-white">
                      {tile.title}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-400">
                      {tile.subtitle}
                    </p>
                    <p className="mt-4 text-sm font-semibold text-neon-yellow">
                      {tile.cta}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
