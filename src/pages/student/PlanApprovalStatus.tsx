import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock3, CheckCircle2, AlertCircle } from "lucide-react";
import { useStore } from "@/hooks/useStore";

export default function PlanApprovalStatusPage() {
  const { currentStudentPlan } = useStore();

  const status = currentStudentPlan?.status;

  if (!currentStudentPlan || !status) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-10 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:pb-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-card p-7 shadow-xl sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Plan Review Status</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">No generated plan found</h1>
          <p className="mt-4 text-sm text-muted-foreground">Complete onboarding to generate a smart monthly plan and send it to your trainer for approval.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/student/onboarding" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black">
              Start onboarding
            </Link>
            <Link to="/student/dashboard" className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-foreground">
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-10 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:pb-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-card p-7 shadow-xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Plan Review Status</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">Smart Plan Delivery</h1>

        {status === "pending_trainer_approval" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 text-amber-400" />
              <div>
                <p className="text-sm font-semibold text-foreground">Your plan is ready and sent for trainer approval</p>
                <p className="mt-1 text-sm text-muted-foreground">You cannot start your monthly plan until your trainer approves it.</p>
              </div>
            </div>
          </motion.div>
        )}

        {status === "active" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-foreground">Trainer approved your plan</p>
                <p className="mt-1 text-sm text-muted-foreground">Your plan is now active and ready to start.</p>
              </div>
            </div>
          </motion.div>
        )}

        {status === "rejected" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl border border-rose-500/35 bg-rose-500/10 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-rose-400" />
              <div>
                <p className="text-sm font-semibold text-foreground">Plan was rejected by trainer</p>
                <p className="mt-1 text-sm text-muted-foreground">Feedback: {currentStudentPlan?.reviewFeedback || "Please retake onboarding with updated constraints."}</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-6 rounded-2xl border border-white/10 bg-background/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Plan details</p>
          <p className="mt-2 text-sm text-foreground">Template: {currentStudentPlan.templateKey?.replace(/_/g, " ") || "auto"}</p>
          <p className="mt-1 text-sm text-foreground">Goal: {currentStudentPlan.basedOn?.goal?.replace(/_/g, " ") || "n/a"}</p>
          <p className="mt-1 text-sm text-foreground">Level: {currentStudentPlan.basedOn?.level || "n/a"}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {status === "active" ? (
            <Link to="/student/daily-plan" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black">
              Start Plan
            </Link>
          ) : status === "rejected" ? (
            <Link to="/student/onboarding" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black">
              Retake Onboarding
            </Link>
          ) : (
            <Link to="/student/dashboard" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black">
              Go to Dashboard
            </Link>
          )}
          <Link to="/student/onboarding" className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-foreground">
            Update Onboarding Answers
          </Link>
        </div>
      </div>
    </div>
  );
}
