import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CircleAlert, Clock3, Mail, Phone, User } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchAdminUsersDetailedAPI, type AdminUserDetails } from "@/lib/api";
import { toast } from "sonner";
import type { FitnessQuestionnaire } from "@/types";

const formatValue = (value: string | number | boolean | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).replace(/_/g, " ");
};

const fieldCard = (label: string, value: string | number | boolean | null | undefined) => (
  <div key={label} className="rounded-2xl border border-white/10 bg-muted/20 p-4">
    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
    <p className="mt-2 text-sm font-semibold text-foreground">{formatValue(value)}</p>
  </div>
);

const sectionCard = (title: string, subtitle: string, fields: Array<[string, string | number | boolean | null | undefined]>) => (
  <Card key={title} className="border-white/10 bg-card/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
    <CardContent className="p-6">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map(([label, value]) => fieldCard(label, value))}
      </div>
    </CardContent>
  </Card>
);

const UserQuestionnaire = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const rows = await fetchAdminUsersDetailedAPI();
        if (!active) return;
        setUsers(rows);
      } catch {
        toast.error("Failed to load user questionnaire.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const user = useMemo(() => users.find((entry) => entry.id === userId) ?? null, [users, userId]);
  const questionnaire = user?.studentProfile?.onboardingDraft ?? null;
  const isStudent = user?.role?.toLowerCase() === "student";

  if (isLoading) {
    return <div className="mx-auto max-w-6xl p-6 text-center text-muted-foreground">Loading questionnaire...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <Card className="border-white/10 bg-card/80">
          <CardContent className="p-8 text-center">
            <CircleAlert className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold text-foreground">User not found</p>
            <Button className="mt-4" onClick={() => navigate("/admin/users")}>Back to users</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#4DD2FF]">Admin user questionnaire</p>
            <h1 className="text-2xl font-display font-bold text-foreground">{user.name}</h1>
          </div>
        </div>
        <Badge variant="secondary">{user.role.toLowerCase()}</Badge>
      </div>

      <Card className="border-white/10 bg-card/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <CardContent className="p-6 space-y-5">
          <SectionHeader title="Student overview" subtitle="Account and questionnaire context" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-muted/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Email</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground"><Mail className="h-4 w-4" />{user.email}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-muted/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Phone</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground"><Phone className="h-4 w-4" />{user.phoneNumber ?? "Not provided"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-muted/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Onboarding step</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground"><Clock3 className="h-4 w-4" />{user.studentProfile?.onboardingStep ?? "Unknown"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-muted/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Completed</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground"><CheckCircle2 className="h-4 w-4" />{user.studentProfile?.onboardingDraft ? "Yes" : "No"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isStudent && questionnaire ? (
        <div className="space-y-6">
          {sectionCard("Basic details", "Core body metrics", [
            ["Age", questionnaire.basic.age],
            ["Gender", questionnaire.basic.gender],
            ["Height", `${questionnaire.basic.heightCm} cm`],
            ["Weight", `${questionnaire.basic.weightKg} kg`],
            ["BMI", questionnaire.basic.bmi?.toFixed(1) ?? null],
          ])}

          {sectionCard("Fitness status", "Current training background", [
            ["Activity level", questionnaire.fitnessStatus.activityLevel],
            ["Experience", questionnaire.fitnessStatus.experience],
          ])}

          {sectionCard("Goals", "What the questionnaire is aiming for", [
            ["Primary goal", questionnaire.goals.primaryGoal],
            ["Target mode", questionnaire.goals.targetMode],
            ["Target weight", questionnaire.goals.targetWeightKg ? `${questionnaire.goals.targetWeightKg} kg` : null],
            ["Target body type", questionnaire.goals.targetBodyType ?? null],
            ["Weight difference", questionnaire.goals.weightDifferenceKg ? `${questionnaire.goals.weightDifferenceKg} kg` : null],
          ])}

          {sectionCard("Commitment", "Training frequency and time", [
            ["Days per week", questionnaire.commitment.daysPerWeek],
            ["Minutes per day", questionnaire.commitment.timePerDayMinutes],
          ])}

          {sectionCard("Environment", "Available workout setup", [
            ["Workout type", questionnaire.environment.workoutType],
            ["Equipment", questionnaire.environment.equipment],
          ])}

          {sectionCard("Lifestyle", "Recovery and daily habits", [
            ["Diet type", questionnaire.lifestyle.dietType],
            ["Protein awareness", questionnaire.lifestyle.proteinAwareness],
            ["Hydration habit", questionnaire.lifestyle.hydrationHabit],
            ["Sleep hours", `${questionnaire.lifestyle.sleepHours} h`],
          ])}

          <Card className="border-white/10 bg-card/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <CardContent className="p-6 space-y-5">
              <SectionHeader title="Constraints" subtitle="Injuries and restrictions" />
              <div className="grid gap-3 md:grid-cols-2">
                {fieldCard("Has injuries", questionnaire.constraints.hasInjuries)}
                {fieldCard("Injury types", questionnaire.constraints.injuryTypes.length > 0 ? questionnaire.constraints.injuryTypes.join(", ") : null)}
                <div className="md:col-span-2 rounded-2xl border border-white/10 bg-muted/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Restrictions</p>
                  <p className="mt-2 text-sm font-semibold text-foreground whitespace-pre-wrap">{questionnaire.constraints.restrictions || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {questionnaire.constraints.hasInjuries && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-6">
                <p className="text-sm font-semibold text-red-300">Injury note</p>
                <p className="mt-2 text-sm text-red-100/80">
                  {questionnaire.constraints.injuryTypes.length > 0
                    ? questionnaire.constraints.injuryTypes.join(", ")
                    : questionnaire.constraints.restrictions || "Has injuries flagged"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-white/10 bg-card/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <CardContent className="p-10 text-center">
            <User className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold text-foreground">No questionnaire available</p>
            <p className="mt-2 text-sm text-muted-foreground">This user has no completed onboarding draft yet.</p>
          </CardContent>
        </Card>
      )}

      <div>
        <Link to="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
          Return to user management
        </Link>
      </div>
    </div>
  );
};

export default UserQuestionnaire;