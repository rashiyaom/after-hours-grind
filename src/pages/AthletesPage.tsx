import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  ChevronRight,
  ShieldCheck,
  Medal,
  Activity,
  LayoutGrid,
  Command,
} from "lucide-react";
import { Link } from "react-router-dom";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";
import { fetchFeaturedAthletesAPI } from "@/lib/api";

type FeaturedAthleteApi = {
  id?: string;
  userId?: string;
  name?: string;
  sport?: string;
  team?: string;
  gender?: string;
  fitnessGoal?: string;
  achievements?: string[];
  user?: {
    name?: string;
    avatar?: string;
  };
};

type AthleteCard = {
  id: string;
  name: string;
  sport: string;
  team: string;
  gender: string;
  photo: string;
  achievements: string[];
  description: string;
  role: string;
};

const SPORTS_LIST = [
  {
    id: "cricket",
    name: "Cricket",
    slug: "Cricket",
    color: "from-[#22C55E] to-[#16A34A]",
    desc: "Legacy of domination.",
    img: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "football",
    name: "Football",
    slug: "Football",
    color: "from-[#C9F85A] to-[#4DD2FF]",
    desc: "Tactical power.",
    img: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "basketball",
    name: "Basketball",
    slug: "Basketball",
    color: "from-[#FF7AE5] to-[#A78BFA]",
    desc: "Vertical supremacy.",
    img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "badminton",
    name: "Badminton",
    slug: "Badminton",
    color: "from-[#4DD2FF] to-[#6F5CFF]",
    desc: "Lightning focus.",
    img: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "kabaddi",
    name: "Kabaddi",
    slug: "Kabaddi",
    color: "from-[#F97316] to-[#EA580C]",
    desc: "Pure Indian grit.",
    img: "https://images.unsplash.com/photo-1612872086822-61ddf4783354?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "chess",
    name: "Chess",
    slug: "Chess",
    color: "from-[#888] to-[#1a1a1a]",
    desc: "Mental combat.",
    img: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=800",
  },
] as const;

function normalizeSportName(value: string): string {
  const trimmed = value.trim();
  const canonical = SPORTS_LIST.find((sport) => sport.slug.toLowerCase() === trimmed.toLowerCase());
  return canonical?.slug ?? trimmed;
}

function toAthleteCard(raw: FeaturedAthleteApi): AthleteCard | null {
  const id = typeof raw.userId === "string" && raw.userId ? raw.userId : typeof raw.id === "string" ? raw.id : "";
  const name = raw.user?.name?.trim() || raw.name?.trim() || "";
  const sportValue = typeof raw.sport === "string" ? raw.sport : "";

  if (!id || !name || !sportValue.trim()) {
    return null;
  }

  const sport = normalizeSportName(sportValue);
  const sportMeta = SPORTS_LIST.find((item) => item.slug === sport);

  return {
    id,
    name,
    sport,
    team: raw.team?.trim() || `${sport} Squad`,
    gender: raw.gender?.trim() || "Unspecified",
    photo: raw.user?.avatar?.trim() || sportMeta?.img || "",
    achievements: Array.isArray(raw.achievements)
      ? raw.achievements.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [],
    description: raw.fitnessGoal?.trim() || "Performance athlete profile",
    role: "Athlete",
  };
}

export default function AthletesPage() {
  const [view, setView] = useState<"sports" | "roster">("sports");
  const [selectedSportId, setSelectedSportId] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteCard | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [athletes, setAthletes] = useState<AthleteCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetchFeaturedAthletesAPI()
      .then((data) => {
        if (!active) return;

        const mapped = (Array.isArray(data) ? data : [])
          .map((entry) => toAthleteCard(entry as FeaturedAthleteApi))
          .filter((entry): entry is AthleteCard => Boolean(entry));

        setAthletes(mapped);
        setLoadError(null);
      })
      .catch(() => {
        if (!active) return;
        setAthletes([]);
        setLoadError("Live athlete data is currently unavailable.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedSport = useMemo(
    () => SPORTS_LIST.find((sport) => sport.id === selectedSportId) ?? null,
    [selectedSportId]
  );

  const filteredAthletes = useMemo(() => {
    if (!selectedSport) return [];
    let list = athletes.filter((athlete) => athlete.sport.toLowerCase() === selectedSport.slug.toLowerCase());

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (athlete) =>
          athlete.name.toLowerCase().includes(q) ||
          athlete.role.toLowerCase().includes(q) ||
          athlete.team.toLowerCase().includes(q)
      );
    }

    return list;
  }, [athletes, searchQuery, selectedSport]);

  const selectedSportSummary = useMemo(() => {
    if (!selectedSport) return null;

    const sportAthletes = athletes.filter(
      (athlete) => athlete.sport.toLowerCase() === selectedSport.slug.toLowerCase()
    );

    if (sportAthletes.length === 0) {
      return {
        name: `${selectedSport.slug} Squad`,
        photo: selectedSport.img,
        achievements: [] as string[],
      };
    }

    const firstTeam = sportAthletes.find((athlete) => athlete.team.trim().length > 0)?.team || `${selectedSport.slug} Squad`;
    const firstPhoto = sportAthletes.find((athlete) => athlete.photo.trim().length > 0)?.photo || selectedSport.img;
    const topAchievements = Array.from(
      new Set(sportAthletes.flatMap((athlete) => athlete.achievements))
    ).slice(0, 3);

    return {
      name: firstTeam,
      photo: firstPhoto,
      achievements: topAchievements,
    };
  }, [athletes, selectedSport]);

  const handleSportClick = (id: string) => {
    setSelectedSportId(id);
    setView("roster");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#03070B] text-white selection:bg-[#4DD2FF] selection:text-black font-display overflow-x-hidden pb-40">
      <div
        className="fixed inset-0 z-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(77,210,255,0.28) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(1100px 420px at 12% 0%, rgba(77,210,255,0.2) 0%, transparent 55%), radial-gradient(900px 500px at 85% 10%, rgba(167,139,250,0.18) 0%, transparent 60%), linear-gradient(180deg, #02060A 0%, #05070D 40%, #020406 100%)",
        }}
      />

      {view === "sports" && (
        <header className="relative z-10 pt-6 sm:pt-8 pb-10 px-6 sm:px-12 max-w-7xl mx-auto overflow-visible">
          <Link
            to="/"
            className="inline-flex items-center gap-3 text-[10px] font-black text-white/20 hover:text-white transition-all uppercase tracking-[0.4em] group mb-10 sm:mb-12 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md"
          >
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
            Terminal Base
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-start">
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <Command className="h-4 w-4 text-[#4DD2FF]" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#4DD2FF]">
                  System // Archive_Registry
                </span>
              </div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-visible">
                <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-[-0.05em] uppercase leading-[1.3] italic m-0">
                  ESTABLISHED <br />
                  <span className="bg-gradient-to-r from-[#4DD2FF] to-[#A78BFA] bg-clip-text text-transparent pb-8 inline-block pr-8">
                    LEGACY
                  </span>
                </h1>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="md:pt-16">
              <div className="space-y-8 pl-10 border-l border-white/5 relative">
                <div className="absolute top-0 left-0 w-[1px] h-12 bg-gradient-to-b from-[#4DD2FF] to-transparent" />
                <p className="text-xs sm:text-sm text-white/40 max-w-md font-medium uppercase tracking-[0.1em] leading-relaxed">
                  Live roster data from the athlete directory.
                </p>
              </div>
            </motion.div>
          </div>
        </header>
      )}

      <main className={`relative z-10 max-w-[1400px] mx-auto px-6 sm:px-12 ${view === "sports" ? "mt-4 sm:mt-6" : "pt-6 sm:pt-8"}`}>
        <AnimatePresence mode="wait">
          {view === "sports" ? (
            <motion.div
              key="sports-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="md:col-span-3 flex items-center justify-between mb-8 border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                  <LayoutGrid className="h-4 w-4 text-[#4DD2FF]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                    Unit Sector Navigation
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/10">
                  {SPORTS_LIST.length} Active Modules
                </span>
              </div>

              {loadError && (
                <div className="md:col-span-3 rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-xs uppercase tracking-[0.2em] text-red-200">
                  {loadError}
                </div>
              )}

              {SPORTS_LIST.map((sport, idx) => {
                const sportCount = athletes.filter(
                  (athlete) => athlete.sport.toLowerCase() === sport.slug.toLowerCase()
                ).length;

                return (
                  <motion.div
                    key={sport.id}
                    onClick={() => handleSportClick(sport.id)}
                    whileHover={{ y: -10, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ ...LUXURY_TWEEN_MEDIUM, delay: idx * 0.05 }}
                    className="group relative h-[360px] overflow-hidden rounded-[40px] cursor-pointer bg-[#0A0A0A] border border-white/5 hover:border-[#4DD2FF]/30 transition-all shadow-2xl"
                  >
                    <div className="absolute inset-0">
                      <img
                        src={sport.img}
                        alt={sport.name}
                        className="w-full h-full object-cover saturate-125 contrast-110 opacity-55 group-hover:opacity-90 transition-all duration-1000 scale-110 group-hover:scale-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#010203]/95 via-[#030811]/45 to-transparent" />
                    </div>
                    <div className="relative z-10 h-full p-10 flex flex-col justify-end">
                      <div className="space-y-4">
                        <h3 className="text-4xl font-black uppercase tracking-tighter leading-none italic m-0">{sport.name}</h3>
                        <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4DD2FF]" />
                          <p className="text-[9px] text-white font-bold uppercase tracking-widest leading-none">{sport.desc}</p>
                        </div>
                      </div>
                      <div className="absolute top-10 right-10 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#4DD2FF] group-hover:text-black transition-all">
                        <ChevronRight size={18} />
                      </div>
                      <div className="absolute bottom-10 right-10 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                        {loading ? "Loading..." : `${sportCount} athlete${sportCount === 1 ? "" : "s"}`}
                      </div>
                    </div>
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${sport.color} transition-opacity duration-700`} />
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="athletes-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-16"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-6">
                  <button
                    onClick={() => setView("sports")}
                    className="flex items-center gap-2 text-[10px] font-black text-[#4DD2FF] uppercase tracking-widest hover:gap-6 transition-all group bg-[#4DD2FF]/5 px-5 py-2 rounded-full border border-[#4DD2FF]/20"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Archives
                  </button>
                  <div className="relative overflow-visible">
                    <h2 className="text-5xl sm:text-6xl font-black uppercase tracking-tighter leading-[1.3] italic m-0 pt-2">
                      {selectedSport?.name} <span className="text-white/20">ROSTER</span>
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-3xl p-2 px-6 backdrop-blur-xl">
                  <Search size={16} className="text-white/20" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search Personnel..."
                    className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-white placeholder:text-white/10 w-48 py-3"
                  />
                </div>
              </div>

              {selectedSportSummary && (
                <section>
                  <div className="relative h-48 rounded-[40px] overflow-hidden border border-white/5 bg-[#080808] flex items-center px-12 gap-12 group transition-all hover:border-[#4DD2FF]/20 overflow-visible">
                    <img
                      src={selectedSportSummary.photo}
                      className="absolute inset-0 w-full h-full object-cover saturate-125 contrast-110 opacity-30 group-hover:opacity-45 transition-all duration-1000"
                    />
                    <div className="relative flex items-center gap-8 pb-4">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/10">
                        <ShieldCheck size={40} className="text-[#4DD2FF]" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-[#4DD2FF] uppercase tracking-[0.4em]">Official Performance Unit</p>
                        <h3 className="text-4xl font-black uppercase tracking-tighter italic m-0">{selectedSportSummary.name}</h3>
                      </div>
                    </div>
                    {selectedSportSummary.achievements.length > 0 && (
                      <div className="hidden lg:flex gap-4 ml-auto pb-4 overflow-visible">
                        {selectedSportSummary.achievements.map((achievement) => (
                          <div
                            key={achievement}
                            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-black text-[9px] font-black uppercase tracking-widest"
                          >
                            <Medal size={14} /> {achievement}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section>
                <div className="flex items-center gap-6 mb-16 border-b border-white/5 pb-8">
                  <div className="w-3 h-3 rounded-full bg-[#4DD2FF] shadow-[0_0_15px_#4DD2FF]" />
                  <h2 className="text-2xl font-black uppercase tracking-tighter m-0 italic">
                    Active <span className="text-white/20">Personnel</span>
                  </h2>
                </div>

                {loading && (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-8 text-xs uppercase tracking-[0.2em] text-white/60">
                    Loading live athlete roster...
                  </div>
                )}

                {!loading && filteredAthletes.length === 0 && (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-8 text-xs uppercase tracking-[0.2em] text-white/60">
                    No live athlete profiles found for this sport.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredAthletes.map((athlete, idx) => (
                    <motion.div
                      key={athlete.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedAthlete(athlete)}
                      className="group relative h-[420px] rounded-[48px] overflow-hidden cursor-pointer border border-white/5 bg-[#080808] transition-all hover:-translate-y-2 hover:border-[#4DD2FF]/40 shadow-2xl"
                    >
                      <div className="absolute inset-0">
                        <img
                          src={athlete.photo}
                          alt={athlete.name}
                          className="w-full h-full object-cover saturate-125 contrast-110 transition-all duration-1000 opacity-70 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020306] via-[#050A14]/35 to-transparent" />
                      </div>

                      <div className="absolute inset-x-8 bottom-10">
                        <div className="space-y-6">
                          <div className="space-y-2 overflow-visible">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 rounded-sm bg-[#4DD2FF]/10 text-[#4DD2FF] text-[8px] font-black uppercase tracking-widest">
                                Arch_ID: {athlete.id}
                              </span>
                              <span className="px-2 py-0.5 rounded-sm bg-white/5 text-white/40 text-[8px] font-black uppercase tracking-widest">
                                Live Registry
                              </span>
                            </div>
                            <p className="text-[10px] font-black text-[#4DD2FF] uppercase tracking-[0.3em]">{athlete.role}</p>
                            <h3 className="text-4xl font-black uppercase tracking-[-0.04em] leading-[1.3] italic m-0 pb-4">{athlete.name}</h3>
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-all delay-100">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#4DD2FF]">Inspect Profile</span>
                            <Activity size={12} className="text-[#4DD2FF] animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedAthlete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAthlete(null)}
              className="absolute inset-0 bg-black/98 backdrop-blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={LUXURY_TWEEN_SLOW}
              className="relative w-full max-w-6xl h-[85vh] bg-[#050505] rounded-[64px] overflow-hidden border border-white/10 flex flex-col md:flex-row shadow-3xl"
            >
              <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden bg-[#111]">
                <img src={selectedAthlete.photo} alt={selectedAthlete.name} className="w-full h-full object-cover saturate-125 contrast-115 opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent md:bg-gradient-to-r" />
                <button
                  onClick={() => setSelectedAthlete(null)}
                  className="absolute top-10 left-10 p-4 rounded-full bg-black/50 border border-white/10 text-white hover:bg-white hover:text-black transition-all"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div className="absolute bottom-12 left-12 space-y-2 overflow-visible">
                  <span className="text-[10px] font-black tracking-[0.5em] text-[#4DD2FF] uppercase bg-[#4DD2FF]/10 px-3 py-1 rounded-full border border-[#4DD2FF]/20">
                    Active Dossier
                  </span>
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-[1.3] pb-4 m-0">Personnel Registry</h2>
                </div>
              </div>

              <div className="w-full md:w-1/2 p-8 sm:p-20 overflow-y-auto custom-scrollbar bg-[#050505]">
                <div className="space-y-16">
                  <div className="space-y-4 overflow-visible">
                    <span className="text-[10px] font-black text-[#4DD2FF] uppercase tracking-[0.5em]">
                      {selectedAthlete.sport} Unit Archive
                    </span>
                    <h2 className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-[-0.05em] leading-[1.1] italic pt-4 m-0 overflow-visible pb-8">
                      {selectedAthlete.name}
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <p className="text-[10px] font-black uppercase opacity-20 tracking-[0.4em] border-b border-white/10 pb-4">Profile</p>
                    <p className="text-2xl text-white/50 font-serif italic leading-relaxed m-0">"{selectedAthlete.description}"</p>
                  </div>

                  {selectedAthlete.achievements.length > 0 && (
                    <div className="space-y-10">
                      <p className="text-[10px] font-black uppercase opacity-20 tracking-[0.4em]">Verified Performance Accolades</p>
                      <div className="grid gap-4">
                        {selectedAthlete.achievements.map((achievement) => (
                          <div key={achievement} className="group flex items-center justify-between p-8 rounded-[36px] bg-white/[0.03] border border-white/5">
                            <div className="flex items-center gap-6">
                              <div className="w-12 h-12 rounded-2xl bg-[#4DD2FF]/5 flex items-center justify-center text-[#4DD2FF]">
                                <Medal size={24} />
                              </div>
                              <span className="text-xs font-black text-white/80 uppercase tracking-widest">{achievement}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
