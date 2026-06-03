import { useMemo, useState } from "react";
import { useAppStore } from "@/hooks/useStore";
import { markAchievementCompleteAPI } from "@/lib/api";
import { toast } from "sonner";

export default function PointsManagerPage() {
  const usersMap = useAppStore((s) => s.users);
  const achievements = useAppStore((s) => s.achievements);
  const refreshData = useAppStore((s) => s.refreshData);
  const adminAwardPoints = useAppStore((s) => s.adminAwardPoints);

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [milestonePointsInput, setMilestonePointsInput] = useState("");
  const [selectedAchievementId, setSelectedAchievementId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const users = useMemo(() =>
    Object.values(usersMap).filter((u) =>
      search.trim() ? u.name.toLowerCase().includes(search.trim().toLowerCase()) : true
    ).sort((a, b) => a.name.localeCompare(b.name)),
    [usersMap, search]
  );

  const selectedUser = selectedUserId ? usersMap[selectedUserId] : null;

  const handleAward = async () => {
    if (!selectedUser) return toast.error("Select a user first");
    const parsed = Number.parseInt(pointsInput || "0", 10);
    if (!Number.isFinite(parsed) || parsed === 0) return toast.error("Enter a valid points value");
    
    setIsLoading(true);
    try {
      await adminAwardPoints(selectedUser.id, parsed, reasonInput || "Admin adjustment");
      toast.success(`Awarded ${parsed} points to ${selectedUser.name}`);
      setPointsInput("");
      setReasonInput("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to award points";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAchievement = async (achievementId: string) => {
    if (!selectedUser) return toast.error("Select a user first");
    
    setIsLoading(true);
    try {
      const overridePoints = milestonePointsInput.trim() ? Number.parseInt(milestonePointsInput, 10) : undefined;
      if (milestonePointsInput.trim() && (!Number.isFinite(overridePoints) || overridePoints === 0)) {
        toast.error("Enter a valid milestone points override");
        return;
      }

      await markAchievementCompleteAPI(selectedUser.id, achievementId, overridePoints);
      toast.success(`Achievement marked complete for ${selectedUser.name}`);
      // Refresh admin data to reflect achievement and points changes
      await refreshData({ scope: 'admin' });
      setMilestonePointsInput("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to mark achievement";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-3 sm:p-6 overflow-x-hidden">
      <h1 className="text-2xl font-semibold text-white mb-4">Points Manager</h1>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-[#0E0E0E] p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users"
            className="mb-3 w-full rounded-xl border border-white/8 bg-[#121212] px-3 py-2 text-sm text-white placeholder:text-white/35"
          />
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full rounded-2xl border p-3 text-left transition-all ${selectedUserId === u.id ? "border-[#C9F85A]/45 bg-[#1E2214]" : "border-white/8 bg-[#151515] hover:border-white/20"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{u.name}</p>
                    <p className="text-xs text-white/40">{u.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{(u as any).totalPoints ?? 0} pts</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0F0F0F] p-6">
          {!selectedUser ? (
            <p className="text-white/50">Select a user to manage points and achievements.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedUser.name}</h2>
                  <p className="text-sm text-white/40">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30">Current Points</p>
                  <p className="text-xl font-bold text-white">{(selectedUser as any).totalPoints ?? 0}</p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
                <input
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                  placeholder="Points to award (e.g. 10)"
                  className="h-11 rounded-xl border border-white/10 bg-[#171717] px-3 text-sm text-white placeholder:text-white/35"
                />
                <input
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="Reason (optional)"
                  className="h-11 rounded-xl border border-white/10 bg-[#171717] px-3 text-sm text-white placeholder:text-white/35"
                />
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleAward} 
                  disabled={isLoading}
                  className="rounded-xl bg-[#C9F85A] px-4 py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Processing..." : "Award Points"}
                </button>
                <button 
                  onClick={() => { setPointsInput(""); setReasonInput(""); }}
                  disabled={isLoading}
                  className="rounded-xl border border-white/10 px-4 py-2 text-white/70 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              </div>

              <div className="rounded-2xl border border-white/8 bg-[#121212] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Milestone Awards</h3>
                    <p className="text-xs text-white/40">Complete a milestone and optionally override the points.</p>
                  </div>
                  <input
                    value={milestonePointsInput}
                    onChange={(e) => setMilestonePointsInput(e.target.value)}
                    placeholder="Override points"
                    className="h-10 w-36 rounded-xl border border-white/10 bg-[#171717] px-3 text-sm text-white placeholder:text-white/35"
                  />
                </div>

                <div className="mb-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                  {Object.entries(achievements).map(([id, def]) => {
                    const completed = (selectedUser.completedAchievements ?? []).includes(id);
                    const isSelected = selectedAchievementId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedAchievementId(id)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
                          isSelected ? "border-[#4DD2FF]/50 bg-[#13222A]" : "border-white/8 bg-[#111111] hover:border-white/20"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{def.name}</p>
                          <p className="text-xs text-white/40">{def.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/45">{def.points} pts</p>
                          <p className={`text-[10px] font-semibold ${completed ? "text-[#C9F85A]" : "text-white/30"}`}>
                            {completed ? "Completed" : "Available"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={isLoading || !selectedAchievementId}
                  onClick={() => handleMarkAchievement(selectedAchievementId)}
                  className="rounded-xl bg-[#4DD2FF] px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Award Selected Milestone
                </button>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Achievements</h3>
                <div className="grid gap-2">
                  {Object.entries(achievements).map(([id, def]) => {
                    const completed = (selectedUser.completedAchievements ?? []).includes(id);
                    return (
                      <div key={id} className="flex items-center justify-between rounded-lg bg-[#121212] p-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{def.name}</p>
                          <p className="text-xs text-white/40">{def.description}</p>
                        </div>
                        <div>
                          {completed ? (
                            <span className="text-xs font-semibold text-[#C9F85A]">✓ Completed</span>
                          ) : (
                            <button 
                              onClick={() => handleMarkAchievement(id)}
                              disabled={isLoading}
                              className="rounded-md bg-[#4DD2FF] px-3 py-1 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
