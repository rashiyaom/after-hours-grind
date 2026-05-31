import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Events", path: "/events" },
];

export default function PublicLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black">
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/10 bg-[linear-gradient(180deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.46)_100%)] backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 relative z-[101]">
            <img src="/logo.jpg" alt="Logo" className="w-5 h-5 object-cover rounded shadow-[0_0_12px_rgba(255,255,255,0.1)]" />
            <span className="font-bold text-[0.75rem] tracking-[0.18em] text-white uppercase">THE afterhour socials</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link key={l.path} to={l.path} className="text-xs font-bold tracking-widest uppercase text-white/70 hover:text-[#4DD2FF] transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
          
          <div className="items-center gap-3 hidden md:flex relative z-[101]">
            <Link to="/login" className="text-[0.75rem] uppercase font-bold tracking-widest text-white/65 hover:text-white transition-colors">Log in</Link>
            <Link to="/request-access" className="text-[0.75rem] bg-[#4DD2FF] text-black px-4 py-2 rounded font-bold uppercase tracking-widest hover:opacity-85 transition-opacity">
              Request Access
            </Link>
          </div>

          <button 
            className="md:hidden relative z-[101] text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* MOBILE FULLSCREEN MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[90] flex flex-col justify-center px-8"
            style={{
              background: "linear-gradient(135deg, #050505 0%, #0d0619 50%, #02111a 100%)",
            }}
          >
            {/* Ambient multicolored glow overlay inside the menu */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{
              background: "radial-gradient(circle at top right, rgba(77,210,255,0.2) 0%, transparent 50%), radial-gradient(circle at bottom left, rgba(167,139,250,0.2) 0%, transparent 50%)"
            }} />

            <div className="relative z-10 flex flex-col gap-8">
              {navLinks.map((l, i) => (
                <motion.div
                  key={l.path}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link 
                    to={l.path} 
                    className="text-[2.5rem] leading-[1] font-black uppercase text-white/90 hover:text-[#4DD2FF] tracking-tighter block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + navLinks.length * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-8"
              >
                <Link to="/login" className="text-xl font-bold uppercase tracking-wider text-white/60 hover:text-[#A78BFA]" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
                <Link to="/request-access" className="text-xl font-bold uppercase tracking-wider text-[#4DD2FF]" onClick={() => setMobileMenuOpen(false)}>Request Access</Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.main
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className={location.pathname === "/" ? "pt-0" : "pt-16"}
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
