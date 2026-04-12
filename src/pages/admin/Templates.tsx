import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUsers } from "@/hooks/useStore";
import {
  assignExerciseTemplateBulkAPI,
  createExerciseTemplateAPI,
  deleteExerciseTemplateAPI,
  fetchExerciseTemplateAssignmentsAPI,
  fetchExerciseTemplatesAPI,
  updateExerciseTemplateAPI,
} from "@/lib/api";
import { toast } from "sonner";
import { Dumbbell, GripVertical, Plus, Save, Trash2, UserPlus, Youtube } from "lucide-react";

type ExerciseTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  sets: number | null;
  reps: number | null;
  restSeconds: number | null;
  durationMinutes: number | null;
  difficulty: string;
  equipment: string;
  youtubeUrl: string | null;
  proteinGrams: number | null;
  calories: number | null;
  mealTiming: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type AssignmentRow = {
  id: string;
  studentId: string;
  studentName: string;
  templateId: string;
  templateName: string;
  dayNumber: number;
  sortOrder: number;
  updatedAt: string;
};

type PlannerState = Record<number, string[]>;
type DragPayload = {
  templateId: string;
  fromDay: number | null;
  fromIndex: number | null;
};

type TemplateDraft = {
  name: string;
  description: string;
  planType: "exercise" | "nutrition";
  category: string;
  sets: string;
  reps: string;
  restSeconds: string;
  durationMinutes: string;
  difficulty: string;
  equipment: string;
  proteinGrams: string;
  calories: string;
  mealTiming: string;
  youtubeUrl: string;
  isActive: boolean;
};

const emptyDraft: TemplateDraft = {
  name: "",
  description: "",
  planType: "exercise",
  category: "strength",
  sets: "",
  reps: "",
  restSeconds: "",
  durationMinutes: "",
  difficulty: "moderate",
  equipment: "basic",
  proteinGrams: "",
  calories: "",
  mealTiming: "",
  youtubeUrl: "",
  isActive: true,
};

const asPlanType = (category: string): "exercise" | "nutrition" =>
  category.toLowerCase().includes("nutrition") ? "nutrition" : "exercise";

const toPayload = (draft: TemplateDraft) => ({
  name: draft.name.trim(),
  description: draft.description.trim(),
  category:
    draft.category.trim() || (draft.planType === "nutrition" ? "nutrition" : "strength"),
  sets: draft.sets.trim() ? Number(draft.sets) : null,
  reps: draft.reps.trim() ? Number(draft.reps) : null,
  restSeconds: draft.restSeconds.trim() ? Number(draft.restSeconds) : null,
  durationMinutes: draft.durationMinutes.trim() ? Number(draft.durationMinutes) : null,
  difficulty: draft.difficulty.trim() || "moderate",
  equipment: draft.equipment.trim() || "basic",
  proteinGrams: draft.proteinGrams.trim() ? Number(draft.proteinGrams) : null,
  calories: draft.calories.trim() ? Number(draft.calories) : null,
  mealTiming: draft.mealTiming.trim() || null,
  youtubeUrl: draft.youtubeUrl.trim() || null,
  isActive: draft.isActive,
});

export default function AdminTemplatesPage() {
  const users = useUsers();
  const cycleDays = useMemo(() => Array.from({ length: 25 }, (_, idx) => idx + 1), []);
  const students = useMemo(
    () => Object.values(users).filter((user) => user.role === "student"),
    [users]
  );

  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [draft, setDraft] = useState<TemplateDraft>(emptyDraft);
  const [templateSearch, setTemplateSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const [plannerDirty, setPlannerDirty] = useState(false);
  const [planner, setPlanner] = useState<PlannerState>(() =>
    cycleDays.reduce((acc, day) => {
      acc[day] = [];
      return acc;
    }, {} as PlannerState)
  );

  const templateById = useMemo(
    () => templates.reduce<Record<string, ExerciseTemplate>>((acc, template) => {
      acc[template.id] = template;
      return acc;
    }, {}),
    [templates]
  );

  const categoryOptions = useMemo(() => {
    const source = templates.map((template) => template.category).filter(Boolean);
    return Array.from(new Set(source)).sort((a, b) => a.localeCompare(b));
  }, [templates]);

  const buildPlannerFromAssignments = useCallback((rows: AssignmentRow[], studentId: string): PlannerState => {
    const next = cycleDays.reduce((acc, day) => {
      acc[day] = [];
      return acc;
    }, {} as PlannerState);

    rows
      .filter((row) => row.studentId === studentId)
      .sort((a, b) => {
        if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
        return a.sortOrder - b.sortOrder;
      })
      .forEach((row) => {
        next[row.dayNumber] = [...(next[row.dayNumber] ?? []), row.templateId];
      });

    return next;
  }, [cycleDays]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templateRows, assignmentRows] = await Promise.all([
        fetchExerciseTemplatesAPI({
          q: templateSearch.trim() || undefined,
          category: categoryFilter === "all" ? undefined : categoryFilter,
          activeOnly: showActiveOnly,
        }),
        fetchExerciseTemplateAssignmentsAPI(),
      ]);

      setTemplates(templateRows as ExerciseTemplate[]);
      setAssignments(assignmentRows as AssignmentRow[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const intervalId = window.setInterval(() => {
      void loadData();
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [templateSearch, categoryFilter, showActiveOnly]);

  useEffect(() => {
    if (selectedStudentIds.length === 0) {
      setPlanner(
        cycleDays.reduce((acc, day) => {
          acc[day] = [];
          return acc;
        }, {} as PlannerState)
      );
      setPlannerDirty(false);
      return;
    }

    const baselineStudentId = selectedStudentIds[0];
    const hydratedPlanner = buildPlannerFromAssignments(assignments, baselineStudentId);
    setPlanner(hydratedPlanner);
    setPlannerDirty(false);
  }, [selectedStudentIds, assignments, cycleDays, buildPlannerFromAssignments]);

  const handleCreate = async () => {
    if (!draft.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    try {
      const created = await createExerciseTemplateAPI(toPayload(draft));
      setTemplates((prev) => [created as ExerciseTemplate, ...prev]);
      setDraft(emptyDraft);
      toast.success("Exercise template created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Template creation failed");
    }
  };

  const startEdit = (template: ExerciseTemplate) => {
    setEditingId(template.id);
    setDraft({
      name: template.name,
      description: template.description || "",
      planType: asPlanType(template.category),
      category: template.category || "general",
      sets: template.sets == null ? "" : String(template.sets),
      reps: template.reps == null ? "" : String(template.reps),
      restSeconds: template.restSeconds == null ? "" : String(template.restSeconds),
      durationMinutes: template.durationMinutes == null ? "" : String(template.durationMinutes),
      difficulty: template.difficulty || "moderate",
      equipment: template.equipment || "basic",
      proteinGrams: template.proteinGrams == null ? "" : String(template.proteinGrams),
      calories: template.calories == null ? "" : String(template.calories),
      mealTiming: template.mealTiming || "",
      youtubeUrl: template.youtubeUrl || "",
      isActive: Boolean(template.isActive),
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!draft.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    try {
      const updated = await updateExerciseTemplateAPI(editingId, toPayload(draft));
      setTemplates((prev) => prev.map((tpl) => (tpl.id === editingId ? (updated as ExerciseTemplate) : tpl)));
      setEditingId(null);
      setDraft(emptyDraft);
      toast.success("Template updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Template update failed");
    }
  };

  const handleDelete = async (templateId: string) => {
    const confirmed = window.confirm("Delete this template?");
    if (!confirmed) return;

    try {
      await deleteExerciseTemplateAPI(templateId);
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== templateId));
      setPlanner((prev) =>
        cycleDays.reduce((acc, day) => {
          acc[day] = (prev[day] ?? []).filter((id) => id !== templateId);
          return acc;
        }, {} as PlannerState)
      );
      toast.success("Template deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const onDragFromLibrary = (templateId: string) => {
    setDragPayload({ templateId, fromDay: null, fromIndex: null });
  };

  const onDragFromPlanner = (templateId: string, fromDay: number, fromIndex: number) => {
    setDragPayload({ templateId, fromDay, fromIndex });
  };

  const dropIntoDay = (dayNumber: number, targetIndex?: number) => {
    if (!dragPayload) return;

    setPlanner((prev) => {
      const next: PlannerState = { ...prev };
      const destination = [...(next[dayNumber] ?? [])];
      let insertAt = typeof targetIndex === "number" ? targetIndex : destination.length;

      if (dragPayload.fromDay != null && dragPayload.fromIndex != null) {
        const source = [...(next[dragPayload.fromDay] ?? [])];
        source.splice(dragPayload.fromIndex, 1);
        next[dragPayload.fromDay] = source;

        if (dragPayload.fromDay === dayNumber && dragPayload.fromIndex < insertAt) {
          insertAt -= 1;
        }
      }

      insertAt = Math.max(0, Math.min(insertAt, destination.length));
      destination.splice(insertAt, 0, dragPayload.templateId);
      next[dayNumber] = destination;
      return next;
    });

    setPlannerDirty(true);
    setDragPayload(null);
  };

  const removeFromDay = (dayNumber: number, index: number) => {
    setPlanner((prev) => {
      const next: PlannerState = { ...prev };
      const entries = [...(next[dayNumber] ?? [])];
      entries.splice(index, 1);
      next[dayNumber] = entries;
      return next;
    });
    setPlannerDirty(true);
  };

  const clearDay = (dayNumber: number) => {
    setPlanner((prev) => ({ ...prev, [dayNumber]: [] }));
    setPlannerDirty(true);
  };

  const saveBulkCycle = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("Select at least one student");
      return;
    }

    const dayPlans = cycleDays
      .map((dayNumber) => ({ dayNumber, templateIds: planner[dayNumber] ?? [] }))
      .filter((dayPlan) => dayPlan.templateIds.length > 0);

    if (dayPlans.length === 0) {
      toast.error("Add at least one template to the planner matrix");
      return;
    }

    try {
      setSavingPlan(true);
      await assignExerciseTemplateBulkAPI({
        studentIds: selectedStudentIds,
        dayPlans,
      });
      toast.success("Cycle plan saved for selected students. Realtime updates sent.");
      setPlannerDirty(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk save failed");
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#C9F85A]/15 border border-[#C9F85A]/30 grid place-items-center">
          <Dumbbell className="h-5 w-5 text-[#C9F85A]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Exercise Template Studio</h1>
          <p className="text-sm text-muted-foreground">Create detailed workouts, drag-drop per-day sequences, and bulk save Day 1-25 cycles in one action.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Exercise Template" : "New Exercise Template"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Exercise name"
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
            />
            <textarea
              placeholder="Execution notes, form cues, progression guidance"
              className="w-full rounded-md border bg-background p-3 text-sm"
              rows={4}
              value={draft.description}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-muted-foreground">
                Template type
                <select
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={draft.planType}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      planType: e.target.value as "exercise" | "nutrition",
                      category:
                        e.target.value === "nutrition"
                          ? (prev.category === "strength" ? "nutrition" : prev.category)
                          : (prev.category === "nutrition" ? "strength" : prev.category),
                    }))
                  }
                >
                  <option value="exercise">Exercise</option>
                  <option value="nutrition">Nutrition / Diet</option>
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                Category
                <Input
                  placeholder="strength / nutrition / mobility"
                  value={draft.category}
                  onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Difficulty" value={draft.difficulty} onChange={(e) => setDraft((prev) => ({ ...prev, difficulty: e.target.value }))} />
              <Input placeholder="Duration minutes" value={draft.durationMinutes} onChange={(e) => setDraft((prev) => ({ ...prev, durationMinutes: e.target.value }))} />
              <Input placeholder="Equipment" value={draft.equipment} onChange={(e) => setDraft((prev) => ({ ...prev, equipment: e.target.value }))} />
              {draft.planType === "exercise" ? (
                <>
                  <Input placeholder="Sets" value={draft.sets} onChange={(e) => setDraft((prev) => ({ ...prev, sets: e.target.value }))} />
                  <Input placeholder="Reps" value={draft.reps} onChange={(e) => setDraft((prev) => ({ ...prev, reps: e.target.value }))} />
                  <Input placeholder="Rest seconds" value={draft.restSeconds} onChange={(e) => setDraft((prev) => ({ ...prev, restSeconds: e.target.value }))} />
                </>
              ) : (
                <>
                  <Input placeholder="Protein grams" value={draft.proteinGrams} onChange={(e) => setDraft((prev) => ({ ...prev, proteinGrams: e.target.value }))} />
                  <Input placeholder="Calories" value={draft.calories} onChange={(e) => setDraft((prev) => ({ ...prev, calories: e.target.value }))} />
                  <Input placeholder="Meal timing (e.g. Breakfast)" value={draft.mealTiming} onChange={(e) => setDraft((prev) => ({ ...prev, mealTiming: e.target.value }))} />
                </>
              )}
              <label className="flex items-center gap-2 rounded-md border px-3 text-sm">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Active
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="YouTube video URL"
                value={draft.youtubeUrl}
                onChange={(e) => setDraft((prev) => ({ ...prev, youtubeUrl: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              {editingId ? (
                <>
                  <Button onClick={() => void saveEdit()} className="flex-1">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setDraft(emptyDraft);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => void handleCreate()} className="flex-1">
                  <Plus className="h-4 w-4" />
                  Create Template
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-7">
          <CardHeader>
            <CardTitle>Template Library ({templates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 grid gap-2 md:grid-cols-3">
              <Input
                placeholder="Search templates by name or description"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
              />
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 rounded-md border px-3 text-sm">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                />
                Active only
              </label>
            </div>
            <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
              {templates.map((template) => (
                <div key={template.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.category} • {template.difficulty} • {template.equipment}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(template)}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => void handleDelete(template.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{template.description || "No description"}</p>
                  {asPlanType(template.category) === "exercise" ? (
                    <p className="text-xs text-muted-foreground">
                      Sets: {template.sets ?? "-"} • Reps: {template.reps ?? "-"} • Rest: {template.restSeconds ?? "-"}s • Duration: {template.durationMinutes ?? "-"}m
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Protein: {template.proteinGrams ?? "-"}g • Calories: {template.calories ?? "-"} kcal • Meal: {template.mealTiming || "-"}
                    </p>
                  )}
                  {template.youtubeUrl && (
                    <a className="text-xs text-[#4DD2FF]" href={template.youtubeUrl} target="_blank" rel="noreferrer">
                      YouTube demo link
                    </a>
                  )}
                </div>
              ))}
              {templates.length === 0 && (
                <p className="text-sm text-muted-foreground">No templates created yet.</p>
              )}
            </div>
            <div className="mt-3">
              <Button
                variant="outline"
                onClick={async () => {
                  const smokeTemplates = templates.filter((template) => template.name.startsWith("Smoke Template "));
                  if (smokeTemplates.length === 0) {
                    toast.message("No smoke templates found.");
                    return;
                  }
                  await Promise.all(smokeTemplates.map((template) => deleteExerciseTemplateAPI(template.id)));
                  toast.success(`Removed ${smokeTemplates.length} smoke templates.`);
                  await loadData();
                }}
              >
                Remove Smoke Templates
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Student Scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="text-xs text-muted-foreground">Select Students</label>
            <div className="max-h-56 overflow-auto rounded-md border p-2 space-y-1">
              {students.map((student) => (
                <label key={student.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted/40">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                  />
                  <span>{student.name}</span>
                  <span className="text-xs text-muted-foreground">{student.email}</span>
                </label>
              ))}
            </div>

            <Button onClick={() => void saveBulkCycle()} disabled={savingPlan} className="w-full">
              <UserPlus className="h-4 w-4" />
              {savingPlan ? "Saving Cycle..." : "Save Day 1-25 Cycle"}
            </Button>
            <p className="text-xs text-muted-foreground">
              The first selected student is used as the planner baseline when loading existing assignments.
            </p>
            {plannerDirty && (
              <p className="text-xs text-[#C9F85A]">Unsaved planner changes detected.</p>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Template Bank (Drag Into Day Cells)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              Drag both Exercise and Nutrition templates into each day to build a complete plan (workout + diet).
            </p>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3 max-h-64 overflow-auto pr-1">
              {templates
                .filter((template) => template.isActive)
                .map((template) => (
                  <div
                    key={template.id}
                    draggable
                    onDragStart={() => onDragFromLibrary(template.id)}
                    className="cursor-grab rounded-md border bg-muted/20 p-2 text-xs"
                  >
                    <p className="font-semibold text-sm">{template.name}</p>
                    <p className="text-muted-foreground">{template.category} • {template.difficulty}</p>
                    {asPlanType(template.category) === "nutrition" && (
                      <p className="text-muted-foreground">
                        {template.proteinGrams ?? "-"}g protein • {template.calories ?? "-"} kcal
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Week Planner (Day 1-25 Matrix)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {cycleDays.map((day) => {
              const dayItems = planner[day] ?? [];
              return (
                <div
                  key={day}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => dropIntoDay(day)}
                  className="rounded-lg border bg-background p-3 min-h-44"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Day {day}</p>
                    {dayItems.length > 0 && (
                      <button
                        className="text-[11px] text-muted-foreground hover:text-destructive"
                        onClick={() => clearDay(day)}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {dayItems.map((templateId, index) => {
                      const template = templateById[templateId];
                      return (
                        <div
                          key={`${day}-${index}-${templateId}`}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => dropIntoDay(day, index)}
                          draggable
                          onDragStart={() => onDragFromPlanner(templateId, day, index)}
                          className="group flex cursor-grab items-center gap-2 rounded-md border bg-muted/20 p-2"
                        >
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">{template?.name ?? "Template"}</p>
                            <p className="text-[10px] text-muted-foreground">
                              #{index + 1} • {template ? (asPlanType(template.category) === "nutrition" ? "Diet" : "Exercise") : "Template"}
                              {template && asPlanType(template.category) === "nutrition"
                                ? ` • ${template.proteinGrams ?? "-"}g protein`
                                : ""}
                            </p>
                          </div>
                          <button
                            className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100"
                            onClick={() => removeFromDay(day, index)}
                          >
                            remove
                          </button>
                        </div>
                      );
                    })}

                    {dayItems.length === 0 && (
                      <div className="rounded-md border border-dashed p-3 text-[11px] text-muted-foreground">
                        Drop templates here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-12">
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[350px] overflow-auto pr-1">
              {assignments.map((row) => (
                <div key={row.id} className="rounded-md border p-2 text-sm">
                  <p className="font-medium">{row.studentName}</p>
                  <p className="text-xs text-muted-foreground">Day {row.dayNumber} • Seq {row.sortOrder} • {row.templateName}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(row.updatedAt).toLocaleString()}</p>
                </div>
              ))}
              {assignments.length === 0 && (
                <p className="text-sm text-muted-foreground">No assignments yet.</p>
              )}
            </div>
            {loading && <p className="mt-3 text-xs text-muted-foreground">Refreshing...</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
