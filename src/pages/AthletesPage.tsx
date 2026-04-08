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
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { Athlete, SportsTeam } from "@/types";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

// --- CHARUSAT BRANDED DATA ---
const SPORTS_LIST = [
  { id: "cricket", name: "Cricket", slug: "Cricket", color: "from-[#4DD2FF] to-[#A78BFA]", desc: "The gentlemen's game. CHARUSAT's pride." },
  { id: "basketball", name: "Basketball", slug: "Basketball", color: "from-[#FF7AE5] to-[#FF4D00]", desc: "High-flying ravens dominating the court." },
  { id: "football", name: "Football", slug: "Football", color: "from-[#C9F85A] to-[#4DD2FF]", desc: "Power and precision on the field." },
  { id: "volleyball", name: "Volleyball", slug: "Volleyball", color: "from-[#FFD36E] to-[#FF4D00]", desc: "Spiking through the competition." },
  { id: "badminton", name: "Badminton", slug: "Badminton", color: "from-[#4DD2FF] to-[#6F5CFF]", desc: "Speed and agility in every shuttle." },
  { id: "kabaddi", name: "Kabaddi", slug: "Kabaddi", color: "from-[#FF4D00] to-[#8B0000]", desc: "Strength and strategic raids." },
  { id: "chess", name: "Chess", slug: "Chess", color: "from-[#888] to-[#1a1a1a]", desc: "Mind games and tactical supremacy." },
  { id: "martial-arts", name: "Kudo / Martial Arts", slug: "Martial Arts", color: "from-[#FF3D00] to-[#8B0000]", desc: "Discipline meets the art of combat." },
];

const ATHLETES: Athlete[] = [
  // --- CRICKET ---
  { id: "cr1", name: "Param Patel", sport: "Cricket", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400", achievements: ["All-Univ Captain", "Spoural Best Batsman"], description: "Param leads from the front with a vision that transcends boundaries.", role: "Captain / Opener" },
  { id: "cr2", name: "Smit Shah", sport: "Cricket", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400", achievements: ["Speed King", "In-swinger Specialist"], description: "The most feared pacer in the inter-university circuit.", role: "Fast Bowler" },
  { id: "cr3", name: "Yashvi Parekh", sport: "Cricket", team: "CHARUSAT Tigers (G)", gender: "Female", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400", achievements: ["All-India Inter-Univ Silver"], description: "A lethal spinning option for the women's unit.", role: "Lead Spinner" },
  { id: "cr4", name: "Aarav Mehra", sport: "Cricket", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400", achievements: ["Century machine"], description: "Aarav holds the record for most runs in a single Spoural season.", role: "Middle Order" },
  { id: "cr5", name: "Heli Desai", sport: "Cricket", team: "CHARUSAT Tigers (G)", gender: "Female", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400", achievements: ["Best Wicket Keeper"], description: "Lightning reflexes behind the stumps.", role: "WK Batter" },
  { id: "cr6", name: "Dev Patel", sport: "Cricket", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400", achievements: ["Boundary Magnet"], description: "Aggressive finisher with power to clear any ground.", role: "Finisher" },
  { id: "cr7", name: "Krish Vyas", sport: "Cricket", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&q=80&w=400", achievements: ["Rising Star"], description: "Youngest player to represent the senior team.", role: "All-rounder" },
  { id: "cr8", name: "Meet Shah", sport: "Cricket", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1542178243-bc51c4efdf1a?auto=format&fit=crop&q=80&w=400", achievements: ["Bowling Machine"], description: "Consistent line and length that frustrates the best.", role: "Medium Pacer" },

  // --- FOOTBALL ---
  { id: "f1", name: "Rohan Mehra", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=400", achievements: ["Golden Boot", "Spoural Best FW"], description: "Agility and precision are Rohan's trademarks.", role: "Striker" },
  { id: "f2", name: "Jay Parmar", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?auto=format&fit=crop&q=80&w=400", achievements: ["The Wall"], description: "Unshakeable defense and aerial dominance.", role: "CB / Captain" },
  { id: "f3", name: "Smit Jha", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&q=80&w=400", achievements: ["Playmaker of the Year"], description: "Controls the midfield with visionary passes.", role: "CM" },
  { id: "f4", name: "Aman Vora", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400", achievements: ["Wing Wizard"], description: "Explosive pace on the left flank.", role: "LW" },
  { id: "f5", name: "Harshil Vyas", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1507081323647-4d250478b919?auto=format&fit=crop&q=80&w=400", achievements: ["Spider-man"], description: "Reflexes that defy gravity.", role: "GK" },
  { id: "f6", name: "Deep Patel", sport: "Football", team: "CHARUSAT Tigers", gender: "Male", photo: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=400", achievements: ["Iron Man"], description: "Never misses a tackle.", role: "RB" },

  // --- BASKETBALL ---
  { id: "b1", name: "Aaryan Patel", sport: "Basketball", team: "CHARUSAT Ravens", gender: "Male", photo: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=400", achievements: ["All-Univ MVP", "Scoring Champ"], description: "Vertical threat with elite shooting range.", role: "Point Guard" },
  { id: "b2", name: "Ishita Shah", sport: "Basketball", team: "CHARUSAT Ravens (G)", gender: "Female", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400", achievements: ["Spoural Best Center"], description: "Dominates the paint with raw power and skill.", role: "Center" },
  { id: "b3", name: "Kenil Soni", sport: "Basketball", team: "CHARUSAT Ravens", gender: "Male", photo: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=400", achievements: ["The Dunker"], description: "High-flying raider of the rim.", role: "PF" },
];

const TEAMS: Record<string, SportsTeam> = {
  cricket: { name: "CHARUSAT Tigers", sport: "Cricket", members: ATHLETES.filter(a => a.sport === "Cricket"), achievements: ["All-Gujarat Winners", "T20 Champs"], photo: "https://images.unsplash.com/photo-1540749494345-4277a8848cff?auto=format&fit=crop&q=80&w=1200" },
  basketball: { name: "CHARUSAT Ravens", sport: "Basketball", members: ATHLETES.filter(a => a.sport === "Basketball"), achievements: ["State Finalists", "Spoural Silver"], photo: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1200" },
  football: { name: "CHARUSAT Tigers", sport: "Football", members: ATHLETES.filter(a => a.sport === "Football"), achievements: ["SGS Cup Winners"], photo: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=1200" },
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
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#4DD2FF] selection:text-black font-display overflow-x-hidden">
      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

      {/* ── HEADER ── */}
      {view === "sports" && (
        <header className="relative z-10 pt-24 pb-8 px-6 sm:px-12 max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-3 text-[10px] font-black text-white/30 hover:text-[#4DD2FF] transition-all uppercase tracking-[0.4em] mb-12">
            <ArrowLeft className="h-4 w-4" /> TERMINAL BASE
          </Link>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
               <div className="px-2 py-0.5 rounded-sm bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-[0.3em] leading-none pt-1 pb-1">
                 PERSONNEL ARCHIVE
               </div>
               <div className="h-[1px] w-12 bg-white/10" />
            </div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl sm:text-7xl font-black tracking-[-0.04em] uppercase leading-[1] text-white pb-2 overflow-visible"
            >
              ELITE <br /> 
              <span className="bg-gradient-to-r from-[#4DD2FF] to-[#A78BFA] bg-clip-text text-transparent">
                ROSTER
              </span>
            </motion.h1>
          </div>
        </header>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className={`relative z-10 max-w-7xl mx-auto px-6 sm:px-12 pb-32 ${view === "sports" ? "mt-8" : "pt-24"}`}>
        <AnimatePresence mode="wait">
          {view === "sports" ? (
            <motion.div 
              key="sports-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {SPORTS_LIST.map((sport, idx) => (
                <motion.div
                  key={sport.id}
                  onClick={() => handleSportClick(sport.id)}
                  whileHover={{ y: -5, borderColor: "rgba(77,210,255,0.4)" }}
                  transition={{ ...LUXURY_TWEEN_MEDIUM, delay: idx * 0.05 }}
                  className="group relative overflow-hidden rounded-[24px] cursor-pointer bg-white/[0.03] border border-white/10 transition-all p-8 flex flex-col justify-between h-[240px]"
                >
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.3em] mb-1 transition-colors group-hover:text-[#4DD2FF]">UNIT {idx + 1}</p>
                      <h3 className="text-3xl font-black uppercase tracking-tighter leading-none text-white">{sport.name}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#4DD2FF] group-hover:text-black transition-all">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <p className="text-[11px] text-white/40 font-medium leading-relaxed max-w-[200px] mb-4 group-hover:text-white/60 transition-colors">
                      {sport.desc}
                    </p>
                    <div className="h-1 w-8 bg-white/10 rounded-full group-hover:w-16 group-hover:bg-[#4DD2FF] transition-all duration-500" />
                  </div>

                  <div className={`absolute -bottom-10 -right-10 w-32 h-32 blur-[64px] bg-gradient-to-br ${sport.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="athletes-view"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-16"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setView("sports")}
                  className="flex items-center gap-3 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] hover:text-[#4DD2FF] transition-all"
                >
                  <ArrowLeft className="h-4 w-4" /> BACK TO UNITS
                </button>
              </div>

              {/* Scaled-down Team Header */}
              {selectedSportId && (
                <section className="relative h-[250px] sm:h-[300px] rounded-[32px] overflow-hidden border border-white/10 bg-[#080808]">
                  <div className="absolute inset-0 opacity-20 grayscale bg-[url('https://images.unsplash.com/photo-1540749494345-4277a8848cff?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center" />
                  <div className="absolute inset-x-8 bottom-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-[#4DD2FF]">
                        {selectedSport?.name} SQUAD
                      </div>
                      <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-[1] text-white">
                        {TEAMS[selectedSportId]?.name || selectedSport?.name + " Elite"}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {TEAMS[selectedSportId]?.achievements.map((ach) => (
                         <div key={ach} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/60">
                           <Award className="h-4 w-4" /> {ach}
                         </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Roster Section with smaller athlete cards */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredAthletes.map((athlete, idx) => (
                  <motion.div
                    key={athlete.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    onClick={() => setSelectedAthlete(athlete)}
                    className="group relative h-[320px] rounded-[24px] overflow-hidden cursor-pointer border border-white/5 hover:border-white/20 transition-all bg-[#0A0A0A]"
                  >
                     <div className="absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity grayscale-0 scale-105 group-hover:scale-100 duration-1000 bg-cover bg-center" style={{ backgroundImage: `url(${athlete.photo})` }} />
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                     <div className="absolute inset-x-6 bottom-6">
                        <p className="text-[8px] font-black text-[#4DD2FF] uppercase tracking-[0.4em] mb-1">{athlete.role}</p>
                        <h3 className="text-xl font-black uppercase tracking-tighter leading-none text-white">{athlete.name}</h3>
                     </div>
                  </motion.div>
                ))}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {selectedAthlete && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAthlete(null)} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                className="relative w-full max-w-4xl h-[70vh] bg-[#050505] rounded-[32px] overflow-hidden border border-white/10 flex flex-col md:flex-row shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
              >
                 <div className="w-full md:w-5/12 h-2/5 md:h-full relative overflow-hidden bg-[#111]">
                    <img src={selectedAthlete.photo} className="w-full h-full object-cover grayscale-0 opacity-80" />
                    <button onClick={() => setSelectedAthlete(null)} className="absolute top-6 left-6 p-3 rounded-full bg-black/50 border border-white/10 text-white hover:bg-white hover:text-black transition-all">
                       <ArrowLeft className="h-4 w-4" />
                    </button>
                 </div>
                 
                 <div className="w-full md:w-7/12 p-8 sm:p-12 overflow-y-auto custom-scrollbar">
                    <div className="space-y-10">
                       <header className="space-y-3">
                          <span className="text-[8px] font-black text-[#4DD2FF] uppercase tracking-[0.4em]">UNIT PERSONNEL // {selectedAthlete.sport}</span>
                          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-[1] text-white">{selectedAthlete.name}</h2>
                       </header>
                       
                       <div className="space-y-3">
                          <p className="text-[8px] font-black uppercase text-white/20 tracking-[0.4em] border-b border-white/5 pb-2">PROFILE SUMMARY</p>
                          <p className="text-lg text-white/50 font-serif italic leading-relaxed">"{selectedAthlete.description}"</p>
                       </div>
                       
                       <button className="w-full py-5 rounded-2xl bg-white text-black text-[9px] font-black uppercase tracking-[0.4em] hover:bg-[#4DD2FF] transition-all">
                          CONTACT ATHLETE
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
