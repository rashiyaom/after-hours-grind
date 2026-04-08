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
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { Athlete, SportsTeam } from "@/types";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

// --- CHARUSAT BRANDED DATA ---
const SPORTS_LIST = [
  { 
    id: "basketball", 
    name: "Basketball", 
    icon: "🏀", 
    slug: "Basketball", 
    color: "from-[#FF7AE5] to-[#A78BFA]", 
    desc: "Dominating the hardwood with precision and intensity.",
    img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800"
  },
  { 
    id: "football", 
    name: "Football", 
    icon: "⚽", 
    slug: "Football", 
    color: "from-[#C9F85A] to-[#4DD2FF]", 
    desc: "Tactical supremacy and raw power on the gridiron.",
    img: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=800"
  },
  { 
    id: "badminton", 
    name: "Badminton", 
    icon: "🏸", 
    slug: "Badminton", 
    color: "from-[#4DD2FF] to-[#6F5CFF]", 
    desc: "Speed of light transitions and shuttle mastery.",
    img: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&q=80&w=800"
  },
  { 
    id: "kabaddi", 
    name: "Kabaddi", 
    icon: "🤼", 
    slug: "Kabaddi", 
    color: "from-[#F97316] to-[#EA580C]", 
    desc: "Strength, breath, and tactical raids. Pure Indian grit.",
    img: "https://images.unsplash.com/photo-1612872086822-61ddf4783354?auto=format&fit=crop&q=80&w=800"
  },
  { 
    id: "chess", 
    name: "Chess", 
    icon: "♟️", 
    slug: "Chess", 
    color: "from-[#888] to-[#1a1a1a]", 
    desc: "The intellectual combat of high-performance minds.",
    img: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=800"
  },
  { 
    id: "cricket", 
    name: "Cricket", 
    icon: "🏏", 
    slug: "Cricket", 
    color: "from-[#22C55E] to-[#16A34A]", 
    desc: "The heartbeat of Indian collegiate sports. Domination on the pitch.",
    img: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800"
  },
  { 
    id: "martial-arts", 
    name: "Kudo / Martial Arts", 
    icon: "🥋", 
    slug: "Martial Arts", 
    color: "from-[#FF3D00] to-[#8B0000]", 
    desc: "The path of discipline and the art of combat.",
    img: "https://images.unsplash.com/photo-1509059852496-f3822ae057bf?auto=format&fit=crop&q=80&w=800"
  },
];

const ATHLETES: Athlete[] = [
  // --- BASKETBALL (8 players) ---
  { id: "b1", name: "Aaryan Patel", sport: "Basketball", team: "CHARUSAT Ravens", gender: "Male", photo: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=400", achievements: ["All-University Finalist", "Leading Scorer 2023"], description: "A master of the three-point line and court vision. Aaryan leads the Ravens with precision.", role: "Point Guard" },
  { id: "b2", name: "Ishita Shah", sport: "Basketball", team: "CHARUSAT Ravens (Girls)", gender: "Female", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400", achievements: ["Spoural MVP", "Defensive Wall"], description: "Unstoppable in the paint, Ishita's defensive presence is the backbone of the Lady Ravens.", role: "Center" },
  { id: "b3", name: "Rahul Amin", sport: "Basketball", team: "CHARUSAT Ravens", gender: "Male", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400", achievements: ["Best SG 2024", "Clutch Performer"], description: "Rahul's shooting accuracy under pressure is what makes him a vital asset.", role: "Shooting Guard" },
  { id: "b4", name: "Sneha Desai", sport: "Basketball", team: "CHARUSAT Ravens (Girls)", gender: "Female", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400", achievements: ["Regional Champ", "Fastest Break"], description: "An elite small forward with incredible transition speed.", role: "Small Forward" },
  { id: "b5", name: "Kenil Soni", sport: "Basketball", team: "CHARUSAT Ravens", gender: "Male", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400", achievements: ["Top Rebounder", "Athletic Freak"], description: "Kenil's vertical jump allows him to dominate the boards consistently.", role: "Power Forward" },
  { id: "b6", name: "Yash Rana", sport: "Basketball", team: "CHARUSAT Ravens", gender: "Male", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400", achievements: ["Rising Star"], description: "Dynamic backup point guard ready for any challenge.", role: "Sub - PG" },
  { id: "b7", name: "Diya Parikh", sport: "Basketball", team: "CHARUSAT Ravens (Girls)", gender: "Female", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400", achievements: ["Impact Player"], description: "Aggressive wing player with great scoring instincts.", role: "Sub - SF" },
  { id: "b8", name: "Meet Shah", sport: "Basketball", team: "CHARUSAT Ravens", gender: "Male", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400", achievements: ["Defensive Specialist"], description: "Lockdown defender coming off the bench.", role: "Sub - SG" },

  // --- FOOTBALL (14 players) ---
  { id: "f1", name: "Rohan Mehra", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=400", achievements: ["Inter-University Golden Boot", "Hattrick Hero"], description: "Lightning-fast striker with an eye for goal.", role: "Striker" },
  { id: "f2", name: "Harshil Shah", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400", achievements: ["Clean Sheet Record", "Wall of GZ"], description: "Exceptional reflexes between the sticks.", role: "Goalkeeper" },
  { id: "f3", name: "Jay Parmar", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400", achievements: ["Defensive Anchor"], description: "A rock at the back who dictates the pace.", role: "Center Back" },
  { id: "f4", name: "Smit Patel", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400", achievements: ["Midfield Maestro"], description: "The heartbeat of the team. Smit controls the transition.", role: "Central Midfielder" },
  { id: "f5", name: "Aman Vora", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&q=80&w=400", achievements: ["Wing Wizard"], description: "Dazzling skill and pace on the left flank.", role: "Left Winger" },
  { id: "f6", name: "Parth Dave", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400", achievements: ["Cross Specialist"], description: "Pinpoint accuracy with crosses.", role: "Right Winger" },
  { id: "f7", name: "Meet Jha", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&q=80&w=400", achievements: ["Engine Room"], description: "Incredible stamina and defensive cover.", role: "Right Back" },
  { id: "f8", name: "Sahil Khan", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400", achievements: ["Overlap King"], description: "Provides constant width on the left.", role: "Left Back" },
  { id: "f9", name: "Deep Patel", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400", achievements: ["Aerial Dominance"], description: "Wins every header in the box.", role: "Center Back" },
  { id: "f10", name: "Ayush Shah", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&q=80&w=400", achievements: ["Visionary"], description: "Incredible passing range.", role: "Central Midfielder" },
  { id: "f11", name: "Krish Patel", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=400", achievements: ["Intercepter"], description: "The shield in front of the back four.", role: "Defensive Midfielder" },
  { id: "f12", name: "Vivek Rathod", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400", achievements: ["Impact Sub"], description: "Explosive energy off the bench.", role: "Sub - FW" },
  { id: "f13", name: "Raj Vyas", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1542178243-bc51c4efdf1a?auto=format&fit=crop&q=80&w=400", achievements: ["Tactical Fit"], description: "Versatile midfielder.", role: "Sub - MF" },
  { id: "f14", name: "Om Vora", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?auto=format&fit=crop&q=80&w=400", achievements: ["Reliable"], description: "Solid defensive option.", role: "Sub - DF" },

  // --- CRICKET (5 players) ---
  { id: "cr1", name: "Jayesh Patel", sport: "Cricket", team: "CHARUSAT XI", gender: "Male", photo: "https://images.unsplash.com/photo-1542178243-bc51c4efdf1a?auto=format&fit=crop&q=80&w=400", achievements: ["University Captain", "Best All-Rounder"], description: "A balanced player known for both his pace and batting power.", role: "Captain" },
  { id: "cr2", name: "Smit Shah", sport: "Cricket", team: "CHARUSAT XI", gender: "Male", photo: "https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?auto=format&fit=crop&q=80&w=400", achievements: ["Fastest Fifty", "Opener"], description: "Explosive opener who dominates the powerplay.", role: "Opening Batsman" },
  { id: "cr3", name: "Aryan Dave", sport: "Cricket", team: "CHARUSAT XI", gender: "Male", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400", achievements: ["Leading Wicket Taker"], description: "Lethal left-arm spinner with incredible control.", role: "Bowler" },

  // --- KUDO (5 players) ---
  { id: "k1", name: "Devanshi Vyas", sport: "Martial Arts", team: "CHARUSAT Kudo Unit", gender: "Female", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400", achievements: ["International Gold", "National Kudo Medalist"], description: "A technical prodigy in martial arts, bringing international recognition to the university.", role: "Lead Competitor" },
  { id: "k2", name: "Nitya Shah", sport: "Martial Arts", team: "CHARUSAT Kudo Unit", gender: "Female", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400", achievements: ["State Silver", "Discipline Award"], description: "Calculated and fierce in competition.", role: "Black Belt" },
  { id: "k3", name: "Aryan Vora", sport: "Martial Arts", team: "CHARUSAT Kudo Unit", gender: "Male", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400", achievements: ["Regional Finalist"], description: "Power striker with unmatched intensity.", role: "Competitor" },
  { id: "k4", name: "Smit Dave", sport: "Martial Arts", team: "CHARUSAT Kudo Unit", gender: "Male", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400", achievements: ["Technique Master"], description: "Focused on the traditional aspects and precise execution.", role: "Brown Belt" },
  { id: "k5", name: "Parth Joshi", sport: "Martial Arts", team: "CHARUSAT Kudo Unit", gender: "Male", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400", achievements: ["Rising Star"], description: "Fastest upcoming competitor in the unit.", role: "Sub" },
];

const TEAMS: Record<string, SportsTeam> = {
  basketball: { 
    name: "CHARUSAT Ravens", 
    sport: "Basketball", 
    members: ATHLETES.filter(a => a.sport === "Basketball"), 
    achievements: ["State Finalists", "Spoural 23 Champions"], 
    photo: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1200" 
  },
  football: { 
    name: "CHARUSAT Tigers", 
    sport: "Football", 
    members: ATHLETES.filter(a => a.sport === "Football"), 
    achievements: ["Regional Winners", "Inter-Inst Runners Up"], 
    photo: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=1200" 
  },
  "martial-arts": { 
    name: "CHARUSAT Kudo Unit", 
    sport: "Martial Arts", 
    members: ATHLETES.filter(a => a.sport === "Martial Arts"), 
    achievements: ["International Gold", "National Presence"], 
    photo: "https://images.unsplash.com/photo-1509059852496-f3822ae057bf?auto=format&fit=crop&q=80&w=1200" 
  },
  badminton: { 
    name: "CHARUSAT Flyers", 
    sport: "Badminton", 
    members: ATHLETES.filter(a => a.sport === "Badminton"), 
    achievements: ["Inter-Univ Silver", "Open Champ"], 
    photo: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&q=80&w=1200" 
  },
  chess: { 
    name: "CHARUSAT Grandmasters", 
    sport: "Chess", 
    members: ATHLETES.filter(a => a.sport === "Chess"), 
    achievements: ["Chess Olympiad Participation", "State Gold"], 
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1200" 
  },
};

export default function AthletesPage() {
  const [view, setView] = useState<"sports" | "roster">("sports");
  const [selectedSportId, setSelectedSportId] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  const selectedSport = useMemo(() => SPORTS_LIST.find(s => s.id === selectedSportId), [selectedSportId]);
  const filteredAthletes = useMemo(() => selectedSport ? ATHLETES.filter(a => a.sport === (selectedSport.slug as any)) : [], [selectedSport]);

  const handleSportClick = (id: string) => {
    setSelectedSportId(id);
    setView("roster");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#4DD2FF] selection:text-black font-display overflow-x-hidden pb-12">
      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black via-[#050505] to-black pointer-events-none" />

      {/* ── HEADER ── */}
      {view === "sports" && (
        <header className="relative z-10 pt-24 pb-8 px-6 sm:px-12 max-w-7xl mx-auto overflow-visible">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black text-white/40 hover:text-[#4DD2FF] transition-all uppercase tracking-[0.3em] group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Terminal Base
            </Link>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <div className="px-2 py-0.5 rounded-sm bg-[#4DD2FF]/10 border border-[#4DD2FF]/20 text-[#4DD2FF] text-[10px] font-black uppercase tracking-widest leading-none pt-1 pb-1">
                 CHARUSAT Official
               </div>
               <div className="w-12 h-[1px] bg-white/10" />
            </div>
            
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-7xl sm:text-9xl md:text-[11rem] font-black tracking-[-0.05em] uppercase leading-tight italic py-4"
              style={{ paddingBottom: "0.15em" }}
            >
              ELITE <br /> <span className="bg-gradient-to-r from-[#4DD2FF] to-[#A78BFA] bg-clip-text text-transparent">ROSTER</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[11px] sm:text-xs text-white/30 max-w-md font-medium uppercase tracking-[0.15em] leading-relaxed"
            >
              Official high-performance registry for Charotar University of Science & Technology. Documenting Indian collegiate excellence.
            </motion.p>
          </div>
        </header>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className={`relative z-10 max-w-[1400px] mx-auto px-6 sm:px-12 ${view === "sports" ? "mt-24" : "pt-24"}`}>
        <AnimatePresence mode="wait">
          {view === "sports" ? (
            <motion.div 
              key="sports-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
            >
              {SPORTS_LIST.map((sport, idx) => (
                <motion.div
                  key={sport.id}
                  onClick={() => handleSportClick(sport.id)}
                  whileHover={{ y: -10, scale: 1.02 }}
                  transition={{ ...LUXURY_TWEEN_MEDIUM, delay: idx * 0.05 }}
                  className="group relative h-[500px] overflow-hidden rounded-[48px] cursor-pointer bg-[#0A0A0A] border border-white/5 hover:border-[#4DD2FF]/40 transition-all shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
                >
                  {/* Background Image Layer */}
                  <div className="absolute inset-0 z-0">
                     <img src={sport.img} alt={sport.name} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-1000 scale-110 group-hover:scale-100" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
                  </div>

                  {/* Content Layer */}
                  <div className="relative z-10 h-full p-10 flex flex-col justify-end">
                    <div className="flex items-center gap-4 mb-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                       <span className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${sport.color} text-black text-[10px] font-black uppercase tracking-widest`}>
                          Active Unit
                       </span>
                       <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                             <div key={i} className="w-6 h-6 rounded-full border border-black bg-white/10" />
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-5xl font-black uppercase tracking-tighter leading-none italic">{sport.name}</h3>
                       <p className="text-xs text-white/40 font-medium leading-relaxed max-w-[280px] group-hover:text-white/80 transition-colors">
                          {sport.desc}
                       </p>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4DD2FF]">Enter Archive</span>
                       <ExternalLink size={16} className="text-white/40" />
                    </div>
                  </div>
                  
                  {/* Premium Glow overlay */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${sport.color} transition-opacity duration-700`} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="athletes-view"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={LUXURY_TWEEN_MEDIUM}
              className="space-y-20 pb-32"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 overflow-visible">
                <button 
                  onClick={() => setView("sports")}
                  className="flex items-center gap-2 text-[10px] font-black text-[#4DD2FF] uppercase tracking-widest hover:gap-6 transition-all group"
                >
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1" /> Back to Base Archives
                </button>
                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] italic">
                   CHARUSAT ELITE // ARCHIVE {selectedSportId?.toUpperCase()}
                </div>
              </div>

              {/* Team Showcase Card */}
              {selectedSportId && (
                <section className="space-y-12">
                  <div className="relative aspect-[21/9] min-h-[400px] rounded-[64px] overflow-hidden border border-white/10 shadow-3xl bg-[#080808]">
                    <img src={TEAMS[selectedSportId]?.photo || SPORTS_LIST.find(s => s.id === selectedSportId)?.img} className="w-full h-full object-cover grayscale opacity-30 contrast-125 scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-16 left-16 right-16 flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                      <div className="space-y-6">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                          <ShieldCheck className="h-4 w-4 text-[#4DD2FF]" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Official CHARUSAT Squad Unit</span>
                        </motion.div>
                        <motion.h2 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-7xl sm:text-9xl font-black uppercase tracking-[-0.05em] leading-[0.8] italic py-2">
                          {TEAMS[selectedSportId]?.name || selectedSport?.name + " Elite"}
                        </motion.h2>
                      </div>
                      
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-4">
                        {TEAMS[selectedSportId]?.achievements.map((ach) => (
                           <div key={ach} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-2xl">
                             <Medal className="h-4 w-4" /> {ach}
                           </div>
                        ))}
                      </motion.div>
                    </div>
                  </div>
                </section>
              )}

              {/* Personnel Grid */}
              <section>
                <div className="flex items-center gap-4 mb-16 px-4">
                   <div className="w-3 h-3 rounded-full bg-[#4DD2FF] shadow-[0_0_15px_#4DD2FF]" />
                   <h2 className="text-3xl font-black uppercase tracking-tighter italic">Personnel <span className="text-white/20">Directory</span></h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                  {filteredAthletes.map((athlete, idx) => (
                    <motion.div
                      key={athlete.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ ...LUXURY_TWEEN_MEDIUM, delay: idx * 0.05 }}
                      onClick={() => setSelectedAthlete(athlete)}
                      className="group relative h-[480px] rounded-[52px] overflow-hidden cursor-pointer border border-white/5 bg-[#0A0A0A] transition-all hover:scale-[1.02] hover:border-[#4DD2FF]/40 shadow-2xl"
                    >
                       <div className="absolute inset-0">
                         <img src={athlete.photo} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 opacity-60 group-hover:opacity-100 scale-110 group-hover:scale-100" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-[#00000080] to-transparent" />
                       </div>
                       
                       <div className="absolute inset-x-10 bottom-10 space-y-6">
                         <div className="space-y-2">
                           <div className="flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-[#4DD2FF]" />
                             <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{athlete.role}</p>
                           </div>
                           <h3 className="text-4xl font-black uppercase tracking-tighter leading-none italic">{athlete.name}</h3>
                         </div>
                         <div className="flex items-center justify-between border-t border-white/10 pt-6 opacity-0 group-hover:opacity-100 transition-all">
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#4DD2FF]">Inspect Dossier</span>
                             <ChevronRight size={16} />
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

      {/* ── MODAL ── */}
      <AnimatePresence>
        {selectedAthlete && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAthlete(null)} className="absolute inset-0 bg-black/95 backdrop-blur-3xl" />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 50 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 50 }} 
                transition={LUXURY_TWEEN_SLOW}
                className="relative w-full max-w-6xl h-[85vh] bg-[#050505] rounded-[64px] overflow-hidden border border-white/10 flex flex-col md:flex-row shadow-3xl"
              >
                 <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden bg-[#111]">
                    <img src={selectedAthlete.photo} className="w-full h-full object-cover grayscale contrast-125 opacity-70" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent md:bg-gradient-to-r" />
                    <button onClick={() => setSelectedAthlete(null)} className="absolute top-10 left-10 p-5 rounded-full bg-black/50 border border-white/10 text-white hover:bg-white hover:text-black transition-all">
                       <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-12 left-12 space-y-2">
                       <div className="inline-flex px-3 py-1 rounded-full bg-[#4DD2FF]/10 border border-[#4DD2FF]/30 text-[#4DD2FF] text-[9px] font-black uppercase tracking-widest">Active Personnel</div>
                       <p className="text-3xl font-black text-white uppercase italic tracking-tighter">Current Cycle Archive</p>
                    </div>
                 </div>
                 
                 <div className="w-full md:w-1/2 p-8 sm:p-20 overflow-y-auto custom-scrollbar bg-[#050505]">
                    <div className="space-y-16">
                       <div className="space-y-4">
                          <span className="text-[10px] font-black text-[#4DD2FF] uppercase tracking-[0.5em]">{selectedAthlete.sport} Roster // Elite Dossier</span>
                          <h2 className="text-7xl sm:text-8xl font-black uppercase tracking-[-0.05em] leading-[0.85] italic pt-4" style={{ paddingBottom: "0.15em" }}>{selectedAthlete.name}</h2>
                       </div>
                       
                       <div className="space-y-6">
                          <p className="text-[10px] font-black uppercase opacity-20 tracking-widest border-b border-white/10 pb-2">Philosophical Engine</p>
                          <p className="text-2xl text-white/60 font-serif italic leading-relaxed">"{selectedAthlete.description}"</p>
                       </div>
                       
                       <div className="space-y-10">
                          <p className="text-[10px] font-black uppercase opacity-20 tracking-widest">Verified Performance Accolades</p>
                          <div className="grid gap-4">
                             {selectedAthlete.achievements.map((ach) => (
                                <div key={ach} className="group flex items-center justify-between p-8 rounded-[32px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all">
                                   <div className="flex items-center gap-6">
                                      <div className="w-12 h-12 rounded-2xl bg-[#4DD2FF]/5 flex items-center justify-center text-[#4DD2FF]">
                                         <Award size={24} />
                                      </div>
                                      <span className="text-xs font-black text-white/80 uppercase tracking-widest">{ach}</span>
                                   </div>
                                   <Star className="h-5 w-5 text-[#4DD2FF] opacity-30 group-hover:opacity-100 transition-opacity" />
                                </div>
                             ))}
                          </div>
                       </div>
                       
                       <div className="pt-10 flex gap-4">
                          <button className="flex-1 py-7 rounded-[36px] bg-[#4DD2FF] text-black text-[11px] font-black uppercase tracking-[0.4em] hover:bg-white transition-all shadow-2xl">
                             Contact Athlete
                          </button>
                          <button className="p-7 rounded-[36px] bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                             <Target size={24} />
                          </button>
                       </div>
                    </div>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-24 px-6 sm:px-12 border-t border-white/5 bg-black/95">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="flex flex-col gap-3 items-center md:items-start text-center md:text-left">
             <div className="text-[14px] font-black tracking-[0.8em] text-[#4DD2FF] uppercase">CHAROTAR UNIVERSITY</div>
             <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-medium leading-relaxed">
                Charotar University of Science & Technology (CHARUSAT) <br />
                Official Athletic Performance Archive © 2026
             </p>
          </div>
          <div className="flex flex-col gap-4 items-end text-right">
             <span className="text-[12px] font-black text-white/30 uppercase tracking-[0.6em]">Athletic Hub Alpha</span>
             <span className="text-[12px] font-bold text-white/60 tracking-widest hover:text-[#4DD2FF] cursor-pointer transition-colors">sports@charusat.ac.in</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
