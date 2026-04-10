import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Users, 
  Star, 
  MapPin, 
  ArrowLeft,
  Search,
  Dumbbell,
  Target,
  Zap,
  ChevronRight,
  ShieldCheck,
  Medal,
  Award,
  ExternalLink,
  Flame,
  LayoutGrid,
  Command,
  Activity,
  ZapOff,
  Filter
} from "lucide-react";
import { Link } from "react-router-dom";
import { Athlete, SportsTeam } from "@/types";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

// --- EXPANDED CHARUSAT DATA ---
const SPORTS_LIST = [
  { id: "cricket", name: "Cricket", icon: "🏏", slug: "Cricket", color: "from-[#22C55E] to-[#16A34A]", desc: "Legacy of domination.", img: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800" },
  { id: "football", name: "Football", icon: "⚽", slug: "Football", color: "from-[#C9F85A] to-[#4DD2FF]", desc: "Tactical power.", img: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=800" },
  { id: "basketball", name: "Basketball", icon: "🏀", slug: "Basketball", color: "from-[#FF7AE5] to-[#A78BFA]", desc: "Vertical supremacy.", img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800" },
  { id: "badminton", name: "Badminton", icon: "🏸", slug: "Badminton", color: "from-[#4DD2FF] to-[#6F5CFF]", desc: "Lightning focus.", img: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&q=80&w=800" },
  { id: "kabaddi", name: "Kabaddi", icon: "🤼", slug: "Kabaddi", color: "from-[#F97316] to-[#EA580C]", desc: "Pure Indian grit.", img: "https://images.unsplash.com/photo-1612872086822-61ddf4783354?auto=format&fit=crop&q=80&w=800" },
  { id: "chess", name: "Chess", icon: "♟️", slug: "Chess", color: "from-[#888] to-[#1a1a1a]", desc: "Mental combat.", img: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=800" },
];

const ATHLETES: Athlete[] = [
  // --- CRICKET (9 players) ---
  { id: "cr1", name: "Jayesh Patel", sport: "Cricket", team: "CHARUSAT XI", gender: "Male", photo: "https://images.unsplash.com/photo-1542178243-bc51c4efdf1a?auto=format&fit=crop&q=80&w=400", achievements: ["University Captain", "Best All-Rounder"], description: "Balanced player known for both pace and batting power.", role: "Captain" },
  { id: "cr2", name: "Smit Shah", sport: "Cricket", team: "CHARUSAT XI", gender: "Male", photo: "https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?auto=format&fit=crop&q=80&w=400", achievements: ["Fastest Fifty", "Opener"], description: "Explosive opener who dominates the powerplay.", role: "Opening Batsman" },
  { id: "cr3", name: "Aryan Dave", sport: "Cricket", team: "CHARUSAT XI", gender: "Male", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400", achievements: ["Leading Wicket Taker"], description: "Lethal left-arm spinner.", role: "Specialist Bowler" },
  { id: "cr4", name: "Parth Rathod", sport: "Cricket", team: "CHARUSAT XI", gender: "Male", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400", achievements: ["Middle Order Wall"], description: "Reliable anchoring batsman.", role: "Anchor" },
  { id: "cr5", name: "Meet Jha", sport: "Cricket", team: "CHARUSAT XI", gender: "Male", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400", achievements: ["Wicket Keeping Maestro"], description: "Lightning fast gloves.", role: "Wicket Keeper" },
  { id: "cr6", name: "Kushal Vora", sport: "Cricket", team: "CHARUSAT XI", gender: "Male", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400", achievements: ["Death Over Specialist"], description: "Unplayable yorkers.", role: "Fast Bowler" },
  { id: "cr7", name: "Rishi Amin", sport: "Cricket", team: "CHARUSAT XI", gender: "Male", photo: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&q=80&w=400", achievements: ["Fielding MVP"], description: "The safest hands in the unit.", role: "All-Rounder" },
  { id: "cr8", name: "Om Parmar", sport: "Cricket", team: "CHARUSAT XI", gender: "Male", photo: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=400", achievements: ["Power Hitter"], description: "Finisher with massive six-hitting capability.", role: "Finisher" },
  { id: "cr9", name: "Yash Rana", sport: "Cricket", team: "CHARUSAT XI", gender: "Male", photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400", achievements: ["Spin Wizard"], description: "Unpredictable leg-breaks.", role: "Leg Spinner" },

  // --- FOOTBALL (8 players) ---
  { id: "f1", name: "Rohan Mehra", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=400", achievements: ["Golden Boot", "Sprint Master"], description: "Lightning-fast striker.", role: "Striker" },
  { id: "f2", name: "Harshil Shah", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400", achievements: ["Clean Sheet Record"], description: "Exceptional reflexes.", role: "Goalkeeper" },
  { id: "f3", name: "Jay Parmar", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400", achievements: ["Tackle King"], description: "Solid center back.", role: "Defender" },
  { id: "f4", name: "Aman Vora", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&q=80&w=400", achievements: ["Wing Wizard"], description: "Dazzling skill on the flank.", role: "Winger" },
  { id: "f5", name: "Smit Patel", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400", achievements: ["Playmaker"], description: "The vision of the team.", role: "Midfielder" },
  { id: "f6", name: "Kenil Soni", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400", achievements: ["Iron Screen"], description: "Physically dominant midfielder.", role: "DM" },
  { id: "f7", name: "Sahil Khan", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400", achievements: ["Full Back Engine"], description: "Incredible overlap speed.", role: "LB" },
  { id: "f8", name: "Parth Joshi", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400", achievements: ["Aerial Threat"], description: "Heading specialist.", role: "CB" },

  // --- BASKETBALL (8 players) ---
  { id: "b1", name: "Aaryan Patel", sport: "Basketball", team: "CHARUSAT Ravens", gender: "Male", photo: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=400", achievements: ["Leading Scorer"], description: "Shot-making specialist.", role: "PG" },
  { id: "b2", name: "Ishita Shah", sport: "Basketball", team: "CHARUSAT Ravens (Girls)", gender: "Female", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400", achievements: ["Spoural MVP"], description: "Defensive wall.", role: "Center" },
  { id: "b3", name: "Rahul Amin", sport: "Basketball", team: "CHARUSAT Ravens", gender: "Male", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400", achievements: ["Clutch Star"], description: "Ice in his veins.", role: "SG" },
  { id: "b4", name: "Sneha Desai", sport: "Basketball", team: "CHARUSAT Ravens (Girls)", gender: "Female", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400", achievements: ["Regional Champ"], description: "Speed dribbler.", role: "SF" },
  { id: "b5", name: "Deep Patel", sport: "Basketball", team: "CHARUSAT Ravens", gender: "Male", photo: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&q=80&w=400", achievements: ["Post Dominator"], description: "Unstoppable in the paint.", role: "PF" },
  { id: "b6", name: "Diya Parikh", sport: "Basketball", team: "CHARUSAT Ravens (Girls)", gender: "Female", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400", achievements: ["Lockdown Defense"], description: "No space given.", role: "SF" },
  { id: "b7", name: "Ayush Shah", sport: "Basketball", team: "CHARUSAT Ravens", gender: "Male", photo: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&q=80&w=400", achievements: ["Transition King"], description: "Fastest player on court.", role: "SG" },
  { id: "b8", name: "Krish Patel", sport: "Basketball", team: "CHARUSAT Ravens", gender: "Male", photo: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=400", achievements: ["Rim Protector"], description: "Blocks everything.", role: "Center" },
];

const TEAMS: Record<string, SportsTeam> = {
  cricket: { name: "CHARUSAT XI", sport: "Cricket", members: ATHLETES.filter(a => a.sport === "Cricket"), achievements: ["All-India Inter-Univ Silver"], photo: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800" },
  football: { name: "CHARUSAT Tigers", sport: "Football", members: ATHLETES.filter(a => a.sport === "Football"), achievements: ["Spoural Winners", "District Champions"], photo: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=1200" },
  basketball: { name: "CHARUSAT Ravens", sport: "Basketball", members: ATHLETES.filter(a => a.sport === "Basketball"), achievements: ["State Finalists", "Open Champ"], photo: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1200" },
};

export default function AthletesPage() {
  const [view, setView] = useState<"sports" | "roster">("sports");
  const [selectedSportId, setSelectedSportId] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("@/lib/api").then(({ fetchFeaturedAthletesAPI }) => fetchFeaturedAthletesAPI()).then((data: any) => {
      // Normalize from Backend StudentProfile + User
      const mapped = data.map((d: any) => ({
        id: d.userId,
        name: d.user.name,
        sport: d.sport,
        team: d.team,
        gender: d.gender || "Male",
        photo: d.user.avatar || "https://images.unsplash.com/photo-1542178243-bc51c4efdf1a?auto=format&fit=crop&q=80&w=400",
        achievements: Array.isArray(d.achievements) ? d.achievements : ["Elite Member"],
        description: d.fitnessGoal || "Professional Athlete",
        role: "Varsity"
      }));
      setAthletes(mapped);
      setLoading(false);
    });
  }, []);

  const selectedSport = useMemo(() => SPORTS_LIST.find(s => s.id === selectedSportId), [selectedSportId]);
  
  const filteredAthletes = useMemo(() => {
    let base = selectedSport ? athletes.filter(a => a.sport === selectedSport.slug) : [];
    if (searchQuery) {
      base = base.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.role.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return base;
  }, [selectedSport, searchQuery, athletes]);

  const handleSportClick = (id: string) => {
    setSelectedSportId(id);
    setView("roster");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#03070B] text-white selection:bg-[#4DD2FF] selection:text-black font-display overflow-x-hidden pb-40">
      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 z-0 opacity-15 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(77,210,255,0.28) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: "radial-gradient(1100px 420px at 12% 0%, rgba(77,210,255,0.2) 0%, transparent 55%), radial-gradient(900px 500px at 85% 10%, rgba(167,139,250,0.18) 0%, transparent 60%), linear-gradient(180deg, #02060A 0%, #05070D 40%, #020406 100%)" }} />

      {/* ── HEADER (Archival View) ── */}
      {view === "sports" && (
        <header className="relative z-10 pt-6 sm:pt-8 pb-10 px-6 sm:px-12 max-w-7xl mx-auto overflow-visible">
          <Link to="/" className="inline-flex items-center gap-3 text-[10px] font-black text-white/20 hover:text-white transition-all uppercase tracking-[0.4em] group mb-10 sm:mb-12 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
            Terminal Base
          </Link>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-start">
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                 <Command className="h-4 w-4 text-[#4DD2FF]" />
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#4DD2FF]">System // Archive_Registry</span>
              </div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-visible">
                <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-[-0.05em] uppercase leading-[1.3] italic m-0">
                  ESTABLISHED <br />
                  <span className="bg-gradient-to-r from-[#4DD2FF] to-[#A78BFA] bg-clip-text text-transparent pb-8 inline-block pr-8">LEGACY</span>
                </h1>
              </motion.div>
            </div>
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="md:pt-16">
              <div className="space-y-8 pl-10 border-l border-white/5 relative">
                 <div className="absolute top-0 left-0 w-[1px] h-12 bg-gradient-to-b from-[#4DD2FF] to-transparent" />
                 <p className="text-xs sm:text-sm text-white/40 max-w-md font-medium uppercase tracking-[0.1em] leading-relaxed">
                   High-performance performance architecture of Charotar University. Documenting Indian collegiate excellence since inception.
                 </p>
              </div>
            </motion.div>
          </div>
        </header>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className={`relative z-10 max-w-[1400px] mx-auto px-6 sm:px-12 ${view === "sports" ? "mt-4 sm:mt-6" : "pt-6 sm:pt-8"}`}>
        <AnimatePresence mode="wait">
          {view === "sports" ? (
            <motion.div 
              key="sports-grid"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="md:col-span-3 flex items-center justify-between mb-8 border-b border-white/5 pb-8">
                 <div className="flex items-center gap-4">
                    <LayoutGrid className="h-4 w-4 text-[#4DD2FF]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Unit Sector Navigation</span>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/10">{SPORTS_LIST.length} Active Modules</span>
              </div>
              {SPORTS_LIST.map((sport, idx) => (
                <motion.div
                  key={sport.id} onClick={() => handleSportClick(sport.id)}
                  whileHover={{ y: -10, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  transition={{ ...LUXURY_TWEEN_MEDIUM, delay: idx * 0.05 }}
                  className="group relative h-[360px] overflow-hidden rounded-[40px] cursor-pointer bg-[#0A0A0A] border border-white/5 hover:border-[#4DD2FF]/30 transition-all shadow-2xl"
                >
                  <div className="absolute inset-0">
                     <img src={sport.img} alt={sport.name} className="w-full h-full object-cover saturate-125 contrast-110 opacity-55 group-hover:opacity-90 transition-all duration-1000 scale-110 group-hover:scale-100" />
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
                  </div>
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${sport.color} transition-opacity duration-700`} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="athletes-view"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-16"
            >
              {/* COMPACT SUB-HEADER */}
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
                      type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Personnel..."
                      className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-white placeholder:text-white/10 w-48 py-3"
                   />
                </div>
              </div>

              {/* COMPACT TEAM CARD */}
              {selectedSportId && TEAMS[selectedSportId] && (
                <section>
                  <div className="relative h-48 rounded-[40px] overflow-hidden border border-white/5 bg-[#080808] flex items-center px-12 gap-12 group transition-all hover:border-[#4DD2FF]/20 overflow-visible">
                    <img src={TEAMS[selectedSportId].photo} className="absolute inset-0 w-full h-full object-cover saturate-125 contrast-110 opacity-30 group-hover:opacity-45 transition-all duration-1000" />
                    <div className="relative flex items-center gap-8 pb-4">
                       <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/10">
                          <ShieldCheck size={40} className="text-[#4DD2FF]" />
                       </div>
                       <div className="space-y-2">
                          <p className="text-[9px] font-black text-[#4DD2FF] uppercase tracking-[0.4em]">Official Performance Unit</p>
                          <h3 className="text-4xl font-black uppercase tracking-tighter italic m-0">{TEAMS[selectedSportId].name}</h3>
                       </div>
                    </div>
                    <div className="hidden lg:flex gap-4 ml-auto pb-4 overflow-visible">
                       {TEAMS[selectedSportId].achievements.map((ach) => (
                          <div key={ach} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-black text-[9px] font-black uppercase tracking-widest">
                             <Medal size={14} /> {ach}
                          </div>
                       ))}
                    </div>
                  </div>
                </section>
              )}

              {/* PREMIUM PLAYER CARDS */}
              <section>
                <div className="flex items-center gap-6 mb-16 border-b border-white/5 pb-8">
                   <div className="w-3 h-3 rounded-full bg-[#4DD2FF] shadow-[0_0_15px_#4DD2FF]" />
                   <h2 className="text-2xl font-black uppercase tracking-tighter m-0 italic">Active <span className="text-white/20">Personnel</span></h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredAthletes.map((athlete, idx) => (
                    <motion.div
                      key={athlete.id} initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedAthlete(athlete)}
                      className="group relative h-[420px] rounded-[48px] overflow-hidden cursor-pointer border border-white/5 bg-[#080808] transition-all hover:-translate-y-2 hover:border-[#4DD2FF]/40 shadow-2xl"
                    >
                       <div className="absolute inset-0">
                         <img src={athlete.photo} className="w-full h-full object-cover saturate-125 contrast-110 transition-all duration-1000 opacity-70 group-hover:opacity-100" />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#020306] via-[#050A14]/35 to-transparent" />
                       </div>
                       
                       <div className="absolute inset-x-8 bottom-10">
                         <div className="space-y-6">
                           <div className="space-y-2 overflow-visible">
                             <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded-sm bg-[#4DD2FF]/10 text-[#4DD2FF] text-[8px] font-black uppercase tracking-widest">Arch_ID: {athlete.id}</span>
                                <span className="px-2 py-0.5 rounded-sm bg-white/5 text-white/40 text-[8px] font-black uppercase tracking-widest">Elite Registry</span>
                             </div>
                             <p className="text-[10px] font-black text-[#4DD2FF] uppercase tracking-[0.3em]">{athlete.role}</p>
                             <h3 className="text-4xl font-black uppercase tracking-[-0.04em] leading-[1.3] italic m-0 pb-4">{athlete.name}</h3>
                           </div>
                           
                           {/* STAT BAR MOCK */}
                           <div className="flex items-center gap-1.5 pt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                              {[1,2,3,4,5].map(i => {
                                const widthPct = ((idx + i) * 19) % 100;
                                return (
                                <div key={i} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#4DD2FF] animate-pulse" style={{ width: `${widthPct}%` }} />
                                </div>
                              )})}
                           </div>

                           <div className="flex items-center justify-between pt-6 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-all delay-100">
                             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#4DD2FF]">Inspect Portfolio</span>
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

      {/* --- MODAL --- */}
      <AnimatePresence>
        {selectedAthlete && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAthlete(null)} className="absolute inset-0 bg-black/98 backdrop-blur-3xl" />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 50 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 50 }} 
                transition={LUXURY_TWEEN_SLOW}
                className="relative w-full max-w-6xl h-[85vh] bg-[#050505] rounded-[64px] overflow-hidden border border-white/10 flex flex-col md:flex-row shadow-3xl"
              >
                 <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden bg-[#111]">
                    <img src={selectedAthlete.photo} className="w-full h-full object-cover saturate-125 contrast-115 opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent md:bg-gradient-to-r" />
                    <button onClick={() => setSelectedAthlete(null)} className="absolute top-10 left-10 p-4 rounded-full bg-black/50 border border-white/10 text-white hover:bg-white hover:text-black transition-all">
                       <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-12 left-12 space-y-2 overflow-visible">
                       <span className="text-[10px] font-black tracking-[0.5em] text-[#4DD2FF] uppercase bg-[#4DD2FF]/10 px-3 py-1 rounded-full border border-[#4DD2FF]/20">Active Dossier</span>
                       <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-[1.3] pb-4">Personnel Registry</h2>
                    </div>
                 </div>
                 
                 <div className="w-full md:w-1/2 p-8 sm:p-20 overflow-y-auto custom-scrollbar bg-[#050505]">
                    <div className="space-y-16">
                       <div className="space-y-4 overflow-visible">
                          <span className="text-[10px] font-black text-[#4DD2FF] uppercase tracking-[0.5em]">{selectedAthlete.sport} Unit Archive</span>
                          <h2 className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-[-0.05em] leading-[1.1] italic pt-4 m-0 overflow-visible pb-8">{selectedAthlete.name}</h2>
                       </div>
                       
                       <div className="space-y-6">
                          <p className="text-[10px] font-black uppercase opacity-20 tracking-[0.4em] border-b border-white/10 pb-4">Philosophy Profile</p>
                          <p className="text-2xl text-white/50 font-serif italic leading-relaxed m-0">"{selectedAthlete.description}"</p>
                       </div>
                       
                       <div className="space-y-10">
                          <p className="text-[10px] font-black uppercase opacity-20 tracking-[0.4em]">Verified Performance Accolades</p>
                          <div className="grid gap-4">
                             {selectedAthlete.achievements.map((ach) => (
                                <div key={ach} className="group flex items-center justify-between p-8 rounded-[36px] bg-white/[0.03] border border-white/5">
                                   <div className="flex items-center gap-6">
                                      <div className="w-12 h-12 rounded-2xl bg-[#4DD2FF]/5 flex items-center justify-center text-[#4DD2FF]"><Medal size={24} /></div>
                                      <span className="text-xs font-black text-white/80 uppercase tracking-widest">{ach}</span>
                                   </div>
                                   <Star className="h-5 w-5 text-[#4DD2FF] opacity-30 group-hover:opacity-100 transition-opacity" />
                                </div>
                             ))}
                          </div>
                       </div>
                       
                       <button className="w-full py-8 rounded-[40px] bg-[#4DD2FF] text-black text-[11px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] transition-transform shadow-2xl active:scale-95">
                          Request Portfolio Clearance
                       </button>
                    </div>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
