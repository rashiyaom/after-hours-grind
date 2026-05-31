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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,248,90,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(77,210,255,0.10),transparent_28%),linear-gradient(180deg,#050505_0%,#0B0B0B_55%,#050505_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] bg-[url('https://www.transparenttextures.com/patterns/noise.png')] pointer-events-none" />
      <div className="absolute top-[-6rem] right-[-6rem] h-80 w-80 rounded-full bg-[#C9F85A]/25 blur-[120px]" />
      <div className="absolute bottom-[-10rem] left-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[#4DD2FF]/10 blur-[140px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={LUXURY_TWEEN_SLOW}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C9F85A] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Event access request
            </div>

            <div className="max-w-2xl space-y-5">
              <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                Be part of the after-hours movement.
              </h1>
              <p className="max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                Tell us your body goals, your name, and what kind of account you need.
                Admins create every account. You only log in after your access is approved.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: <ShieldCheck className="h-4 w-4" />, title: "Admin only", text: "Every account is created and controlled from the admin dashboard." },
                { icon: <Users className="h-4 w-4" />, title: "For students + trainers", text: "Accounts are issued for the people who actually belong inside the system." },
                { icon: <Zap className="h-4 w-4" />, title: "Fast access", text: "Send your request once and continue in WhatsApp with a direct message." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#C9F85A]/12 bg-[#C9F85A]/8 text-[#C9F85A]">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/62">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 backdrop-blur-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-[#C9F85A]">
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-[0.24em]">WhatsApp contact</span>
                </div>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-[#C9F85A]/18 bg-[#0a0a0a] px-5 py-3 text-sm font-semibold tracking-[0.12em] text-white/88 transition-all hover:border-[#C9F85A]/35 hover:bg-[#101010] hover:text-white"
                >
                  Open via WhatsApp
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/55">+91 93136 92445 · A short intro is enough. We’ll reply with next steps.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={LUXURY_TWEEN_MEDIUM}
            className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
          >
            <div className="rounded-[1.5rem] border border-white/8 bg-[#070707]/78 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#4DD2FF]/20 bg-[#4DD2FF]/10">
                  <img src="/logo.jpg" alt="THE afterhour socials" className="h-10 w-10 rounded-xl object-cover" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#4DD2FF]">Request access</p>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Tell us your goals</h2>
                </div>
              </div>

              <div className="mt-7 grid gap-3.5">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#4DD2FF]/35"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#4DD2FF]/35"
                />
                <textarea
                  value={bodyGoals}
                  onChange={(e) => setBodyGoals(e.target.value)}
                  placeholder="Body goals, current focus, or what you want to improve"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#4DD2FF]/35"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note: event, trainer, or student account request"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#4DD2FF]/35"
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#C9F85A]/16 bg-[#0b0b0b] px-5 py-3.5 text-sm font-semibold tracking-[0.12em] text-white/85 transition-all hover:border-[#C9F85A]/35 hover:bg-[#101010] hover:text-white"
                >
                  Open via WhatsApp
                  <MessageCircle className="h-4 w-4" />
                </a>
                <Link
                  to="/login"
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/[0.08]"
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