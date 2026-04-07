import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

type Block = {
  title: string;
  body: string;
  icon: typeof Sparkles;
  color: string;
};

const blocks: Block[] = [
  {
    title: "SMART PLAN ENGINE",
    body: "Structured 30-day output generated from onboarding answers.",
    icon: Sparkles,
    color: "bg-[#65F26D]",
  },
  {
    title: "TRAINER REVIEW GATE",
    body: "Every initial plan is locked until trainer approval.",
    icon: ShieldCheck,
    color: "bg-[#FF5CD1]",
  },
  {
    title: "PROOF LOOP",
    body: "Uploads and check-ins keep discipline measurable.",
    icon: Upload,
    color: "bg-[#FFE554]",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#EFEFEF] text-black">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={LUXURY_TWEEN_MEDIUM}
          className="inline-flex border-[3px] border-black bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em]"
        >
          AFTER HOURS GRIND
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.06 }}
          className="mt-8 max-w-5xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.03em] sm:text-6xl lg:text-7xl"
        >
          NO FLUFF.
          <span className="block bg-[#65F26D] px-3 py-1">JUST EXECUTION.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.12 }}
          className="mt-8 max-w-2xl border-l-[6px] border-black bg-white px-4 py-3 text-base font-bold leading-relaxed"
        >
          AFTER HOURS GRIND is a neo-brutalist fitness platform: generate plans fast,
          enforce trainer approval, and prove consistency daily.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUXURY_TWEEN_MEDIUM, delay: 0.2 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 border-[3px] border-black bg-black px-7 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[8px_8px_0_#000] transition-transform hover:-translate-y-0.5"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 border-[3px] border-black bg-[#00E8FF] px-7 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-black shadow-[8px_8px_0_#000] transition-transform hover:-translate-y-0.5"
          >
            <Play className="h-4 w-4" />
            View Demo
          </Link>
        </motion.div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-24 md:grid-cols-3">
        {blocks.map((block, idx) => (
          <motion.div
            key={block.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ ...LUXURY_TWEEN_MEDIUM, delay: idx * 0.08 }}
            className="border-[3px] border-black bg-white p-5 shadow-[10px_10px_0_#000]"
          >
            <div className={`mb-4 inline-flex border-[3px] border-black p-2.5 ${block.color}`}>
              <block.icon className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">{block.title}</h2>
            <p className="mt-3 text-sm font-bold leading-relaxed">{block.body}</p>
          </motion.div>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={LUXURY_TWEEN_MEDIUM}
          className="border-[4px] border-black bg-[#FF5CD1] p-10 shadow-[12px_12px_0_#000]"
        >
          <p className="text-xs font-black uppercase tracking-[0.2em]">AFTER HOURS GRIND</p>
          <h3 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">
            BUILT FOR THOSE WHO SHOW UP.
          </h3>
          <Link
            to="/signup"
            className="mt-8 inline-flex items-center justify-center gap-2 border-[3px] border-black bg-black px-8 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[8px_8px_0_#000] transition-transform hover:-translate-y-0.5"
          >
            Start Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
