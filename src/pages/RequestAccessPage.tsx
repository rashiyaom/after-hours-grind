import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Sparkles, ShieldCheck, Users, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { LUXURY_TWEEN_MEDIUM, LUXURY_TWEEN_SLOW } from "@/lib/motionTokens";

const WHATSAPP_NUMBER = "919313692445";

const buildWhatsAppLink = (name: string, email: string, goal: string, note: string): string => {
  const message = [
    "Hello, I want to join THE afterhour socials.",
    name ? `Name: ${name}` : null,
    email ? `Email: ${email}` : null,
    goal ? `Body goals: ${goal}` : null,
    note ? `Notes: ${note}` : null,
    "Please help me get access and next steps.",
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

export default function RequestAccessPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bodyGoals, setBodyGoals] = useState("");
  const [note, setNote] = useState("");

  const whatsappLink = useMemo(
    () => buildWhatsAppLink(name.trim(), email.trim(), bodyGoals.trim(), note.trim()),
    [name, email, bodyGoals, note]
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(77,210,255,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(201,248,90,0.12),transparent_30%),linear-gradient(180deg,#050505_0%,#0B0B0B_55%,#050505_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] bg-[url('https://www.transparenttextures.com/patterns/noise.png')] pointer-events-none" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={LUXURY_TWEEN_SLOW}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#4DD2FF] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Event access request
            </div>

            <div className="max-w-2xl space-y-5">
              <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                Be part of the after-hours movement.
              </h1>
              <p className="max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                Tell us your body goals, your name, and what kind of account you need.
                Admins create every account. You only log in after your access is approved.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: <ShieldCheck className="h-4 w-4" />, title: "Admin only", text: "Every account is created and controlled from the admin dashboard." },
                { icon: <Users className="h-4 w-4" />, title: "For students + trainers", text: "Accounts are issued for the people who actually belong inside the system." },
                { icon: <Zap className="h-4 w-4" />, title: "Fast access", text: "Send your request once and continue in WhatsApp with a direct message." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#4DD2FF]/10 text-[#4DD2FF]">{item.icon}</div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/65">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-3 text-[#C9F85A]">
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-[0.24em]">WhatsApp contact</span>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-2xl font-bold tracking-tight text-white">+91 93136 92445</p>
                  <p className="mt-1 text-sm text-white/60">Tap the button and send your access request instantly.</p>
                </div>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C9F85A] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#081100] transition-transform hover:scale-[1.01]"
                >
                  Open WhatsApp
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={LUXURY_TWEEN_MEDIUM}
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
          >
            <div className="rounded-[1.5rem] border border-white/10 bg-[#070707]/80 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#4DD2FF]/20 bg-[#4DD2FF]/10">
                  <img src="/logo.jpg" alt="THE afterhour socials" className="h-10 w-10 rounded-xl object-cover" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#4DD2FF]">Request access</p>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Tell us your goals</h2>
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#4DD2FF]/40"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#4DD2FF]/40"
                />
                <textarea
                  value={bodyGoals}
                  onChange={(e) => setBodyGoals(e.target.value)}
                  placeholder="Body goals, current focus, or what you want to improve"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#4DD2FF]/40"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note: event, trainer, or student account request"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#4DD2FF]/40"
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#4DD2FF] px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-black transition-transform hover:scale-[1.01]"
                >
                  Request via WhatsApp
                  <MessageCircle className="h-4 w-4" />
                </a>
                <Link
                  to="/login"
                  className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Go to Login
                </Link>
              </div>

              <p className="mt-4 text-xs leading-6 text-white/45">
                Use this page to request an account, describe your body goals, and get next steps from the team.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}