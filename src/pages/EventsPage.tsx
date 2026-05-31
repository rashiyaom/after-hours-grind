import { useMemo, useState } from "react";
import { Variants, motion } from "framer-motion";
import {
  Calendar,
  Clock,
  ExternalLink,
  Filter,
  MapPin,
  Video,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import { useAppStore } from "@/hooks/useStore";
import { AHGEvent } from "@/types";

const FILTERS = ["all", "upcoming", "live", "completed"] as const;
type EventFilter = (typeof FILTERS)[number];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

function StatusBadge({ status }: { status: AHGEvent["status"] }) {
  const statusConfig = {
    upcoming: {
      label: "Upcoming",
      className: "border-white/10 bg-white/5 text-white/70",
    },
    live: {
      label: "Live",
      className: "border-neon-green/50 bg-neon-green/10 text-neon-green animate-pulse",
    },
    completed: {
      label: "Completed",
      className: "border-white/10 bg-black/30 text-white/55",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

const isSafeExternalLink = (link?: string): boolean => {
  if (!link) return false;
  try {
    const url = new URL(link);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

function EventCard({ event, idx }: { event: AHGEvent; idx: number }) {
  const eventDate = new Date(event.date);
  const hasRegistrationLink = isSafeExternalLink(event.registrationLink);

  const renderMedia = () => {
    if (event.mediaType === "video") {
      return (
        <video
          src={event.mediaUrl}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          loop
          autoPlay
          playsInline
        />
      );
    }
    return (
      <img
        src={event.mediaUrl}
        alt={event.title}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  };

  const renderRegistration = () => {
    if (event.status === "completed") {
      return (
        <div className="flex items-center gap-2 text-neutral-400">
          <CheckCircle className="h-4 w-4" />
          <span>Event Completed</span>
        </div>
      );
    }

    if (event.registrationOpen && hasRegistrationLink) {
      return (
        <a
          href={event.registrationLink}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-2 text-neon-yellow transition-colors hover:text-yellow-300"
        >
          <span>Register Now</span>
          <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      );
    }

    if (event.registrationOpen) {
      return (
        <div className="flex items-center gap-2 text-neutral-400">
          <Loader className="h-4 w-4 animate-spin" />
          <span>Registration coming soon</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-neutral-400">
        <XCircle className="h-4 w-4" />
        <span>Registration Closed</span>
      </div>
    );
  };

  return (
    <motion.div
      variants={itemVariants}
      className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] transition-all duration-300 hover:border-[#C9F85A]/35 hover:bg-white/[0.06] shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
    >
      <div className="relative h-48">
        {renderMedia()}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute top-4 left-4">
          <StatusBadge status={event.status} />
        </div>
        {event.mediaType === "video" && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
            <Video className="h-3 w-3" />
            <span>Video</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C9F85A]">
          {event.category}
        </p>
        <h3 className="mt-2 text-lg font-bold text-white">{event.title}</h3>
        <p className="mt-2 text-sm text-white/60 line-clamp-3">
          {event.description}
        </p>
        <div className="mt-4 space-y-2 text-sm text-white/75">
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#C9F85A]/70" />
            <span>{event.location}</span>
          </p>
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#C9F85A]/70" />
            <span>
              {eventDate.toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#C9F85A]/70" />
            <span>
              {eventDate.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </p>
        </div>
        <div className="mt-6 border-t border-white/10 pt-4 text-sm font-semibold">
          {renderRegistration()}
        </div>
      </div>
    </motion.div>
  );
}

export default function EventsPage() {
  const events = useAppStore((s) => s.system.events);
  const [filter, setFilter] = useState<EventFilter>("all");

  const liveCount = events.filter((event) => event.status === "live").length;
  const upcomingCount = events.filter((event) => event.status === "upcoming").length;
  const registrationCount = events.filter((event) => Boolean(event.registrationOpen)).length;

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => e.status === filter);
  }, [events, filter]);

  return (
    <div className="relative min-h-screen w-full bg-[radial-gradient(circle_at_top,rgba(201,248,90,0.1),transparent_24%),linear-gradient(180deg,#040404_0%,#080808_100%)] text-white">
      <div className="absolute inset-0 bg-grid-pattern bg-center opacity-[0.28] [mask-image:linear-gradient(to_bottom,white_5%,transparent_80%)]" />
      <div className="absolute -top-24 right-[-7rem] h-80 w-80 rounded-full bg-[#C9F85A]/15 blur-[120px]" />
      <div className="absolute bottom-[-8rem] left-[-5rem] h-96 w-96 rounded-full bg-[#4DD2FF]/10 blur-[130px]" />
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C9F85A]">Events</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-white">Live Events & Competitions</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Browse upcoming sessions, live competitions, and completed community events.
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="my-8 flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-2 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.18)] transition-colors"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors capitalize
                ${
                  filter === f
                    ? "bg-[#C9F85A] text-[#081100] shadow-[0_8px_24px_rgba(201,248,90,0.18)]"
                    : "text-white/55 hover:bg-white/8 hover:text-white"
                }`}
            >
              {f}
            </button>
          ))}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredEvents.map((event, idx) => (
            <EventCard key={event.id} event={event} idx={idx} />
          ))}
        </motion.div>

        {filteredEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 flex flex-col items-center justify-center gap-4 text-center"
          >
            <div className="rounded-full border border-white/10 bg-white/[0.04] p-4">
              <Calendar className="h-12 w-12 text-[#C9F85A]/50" />
            </div>
            <h3 className="text-xl font-bold">No Events Found</h3>
            <p className="text-white/55">
              There are no events matching the "{filter}" filter.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
