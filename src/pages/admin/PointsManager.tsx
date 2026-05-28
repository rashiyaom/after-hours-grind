import { useMemo, useState } from "react";
import { useAppStore } from "@/hooks/useStore";
import { awardPointsAPI, markAchievementCompleteAPI } from "@/lib/api";
import { toast } from "sonner";

export default function PointsManagerPage() {
  const usersMap = useAppStore((s) => s.users);
  const achievements = useAppStore((s) => s.achievements);
  const refreshData = useAppStore((s) => s.refreshData);

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
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
      await awardPointsAPI(selectedUser.id, parsed, reasonInput || "Admin adjustment");
      toast.success(`Awarded ${parsed} points to ${selectedUser.name}`);
      setPointsInput("");
      setReasonInput("");
      // Refresh admin data to reflect new user state and leaderboard
      await refreshData({ scope: 'admin' });
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
      await markAchievementCompleteAPI(selectedUser.id, achievementId);
      toast.success(`Achievement marked complete for ${selectedUser.name}`);
      // Refresh admin data to reflect achievement and points changes
      await refreshData({ scope: 'admin' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to mark achievement";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
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
                    <p className="text-sm font-semibold text-white">{(u as any).points ?? 0} pts</p>
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
                  <p className="text-xl font-bold text-white">{(selectedUser as any).points ?? 0}</p>
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
import { useState, useMemo } from "react";
import { useAppStore } from "@/hooks/useStore";
import { User, AchievementDef } from "@/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Award, Check, Plus, Search, Shield, User as UserIcon } from "lucide-react";
import { LUXURY_TWEEN_MEDIUM } from "@/lib/motionTokens";

export default function PointsManagerPage() {
  const users = useAppStore((state) => state.users);
  const achievements = useAppStore((state) => state.achievements);
  const awardPoints = useAppStore((state) => state.awardPoints);
  const markAchievementComplete = useAppStore((state) => state.markAchievementComplete);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pointsToAward, setPointsToAward] = useState<number>(0);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return Object.values(users);
    return Object.values(users).filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return users[selectedUserId] ?? null;
  }, [users, selectedUserId]);

  const handleAwardPoints = () => {
    if (!selectedUser || pointsToAward <= 0) {
      toast.error("Please select a user and enter a valid point amount.");
      return;
    }
    awardPoints(selectedUser.id, pointsToAward, `Admin Award`);
    toast.success(`${pointsToAward} points awarded to ${selectedUser.name}.`);
    setPointsToAward(0);
  };

  const handleMarkAchievement = (achievementId: string) => {
    if (!selectedUser) return;
    markAchievementComplete(selectedUser.id, achievementId);
    toast.success(`Achievement marked as complete for ${selectedUser.name}.`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={LUXURY_TWEEN_MEDIUM}
        className="rounded-[32px] border border-white/10 bg-[#121212] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#4DD2FF]/[0.04] blur-[80px] pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#4DD2FF]/10 border border-[#4DD2FF]/20 px-3 py-1.5 mb-3">
              <Shield className="h-3.5 w-3.5 text-[#4DD2FF]" />
              <span className="text-[11px] font-bold text-[#4DD2FF] uppercase tracking-[0.15em]">Admin</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Points & Achievements</h1>
            <p className="text-sm text-white/35 mt-1">
              Manually award points and complete achievements for users.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[#121212] rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Select a User</h2>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full h-12 rounded-xl border border-white/10 bg-[#0D0D0D] pl-11 pr-4 text-sm text-white placeholder:text-white/35 focus:border-[#4DD2FF]/40 focus:outline-none"
            />
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                  selectedUserId === user.id
                    ? "bg-[#4DD2FF]/15 border border-[#4DD2FF]/30"
                    : "bg-[#1A1A1A] border border-transparent hover:border-white/10"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#0D0D0D] flex items-center justify-center border border-white/10">
                  <UserIcon className="w-5 h-5 text-white/50" />
                </div>
                <div>
                  <p className="font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-white/40">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#121212] rounded-3xl border border-white/10 p-6">
          {selectedUser ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedUser.name}
                </h2>
                <p className="text-sm text-white/50 capitalize">
                  {selectedUser.role} | Current Points: {selectedUser.points ?? 0}
                </p>
              </div>

              <div className="bg-[#0D0D0D] p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Award Points</h3>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={pointsToAward}
                    onChange={(e) => setPointsToAward(Number(e.target.value))}
                    className="w-full h-12 rounded-xl border border-white/10 bg-[#1A1A1A] px-4 text-white focus:outline-none focus:border-[#C9F85A]/50"
                    placeholder="e.g., 100"
                  />
                  <button
                    onClick={handleAwardPoints}
                    className="h-12 px-6 bg-[#C9F85A] text-black font-bold rounded-xl flex items-center gap-2 transition-colors hover:bg-white"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Award</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#0D0D0D] p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Mark Achievement Complete</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {Object.values(achievements).map((ach) => {
                    const isCompleted = selectedUser.completedAchievements?.includes(ach.id);
                    return (
                      <div
                        key={ach.id}
                        className="p-4 rounded-xl bg-[#1A1A1A] border border-white/10 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-white">{ach.name}</p>
                          <p className="text-xs text-white/40">{ach.description}</p>
                        </div>
                        <button
                          onClick={() => handleMarkAchievement(ach.id)}
                          disabled={isCompleted}
                          className="h-10 px-4 rounded-lg text-sm font-semibold flex items-center gap-2 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: isCompleted ? "#22C55E" : "#373737",
                            color: isCompleted ? "white" : "white",
                          }}
                        >
                          {isCompleted ? <Check className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                          <span>{isCompleted ? "Completed" : "Mark Complete"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <UserIcon className="mx-auto h-12 w-12 text-white/20" />
                <p className="mt-4 text-lg text-white/50">Select a user to manage their points and achievements.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
