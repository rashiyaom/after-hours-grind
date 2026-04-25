import { useMemo, useState } from "react";
import { Search, ShieldCheck, UserX, Trash2, CheckSquare, Square, Plus, X, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore, useUsers } from "@/hooks/useStore";
import { toast } from "sonner";
import { Student } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const UserManagement = () => {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "trainer" | "admin">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTrainer, setNewTrainer] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    whatsappNumber: "",
  });
  
  const users = useUsers();
  const banUser = useAppStore((state) => state.banUser);
  const verifyTrainer = useAppStore((state) => state.verifyTrainer);
  const assignTrainer = useAppStore((state) => state.assignTrainer);
  const bulkDeleteUsers = useAppStore((state) => state.bulkDeleteUsers);
  const createTrainer = useAppStore((state) => state.createTrainer);
  const currentUser = useAppStore((state) => state.session.currentUser);
  
  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainer.name || !newTrainer.email || !newTrainer.password || !newTrainer.whatsappNumber) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsCreating(true);
    try {
      await createTrainer({
        ...newTrainer,
        role: "TRAINER",
      });
      setShowCreateModal(false);
      setNewTrainer({ name: "", email: "", password: "", specialization: "", whatsappNumber: "" });
    } catch (err) {
      // toast handled in store
    } finally {
      setIsCreating(false);
    }
  };

  const userList = Object.values(users);
  const trainers = userList.filter(user => user.role === "trainer");

  const filteredUsers = useMemo(() => {
    return userList.filter((user) => {
      const roleMatch = roleFilter === "all" ? true : user.role === roleFilter;
      const queryMatch =
        query.trim() === ""
          ? true
          : user.name.toLowerCase().includes(query.toLowerCase()) || user.email.toLowerCase().includes(query.toLowerCase());
      return roleMatch && queryMatch;
    });
  }, [userList, query, roleFilter]);

  const toggleSelect = (id: string) => {
    if (id === currentUser?.id) return; // Cannot select self for deletion
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length - (filteredUsers.some(u => u.id === currentUser?.id) ? 1 : 0)) {
      setSelectedIds(new Set());
    } else {
      const allValidIds = filteredUsers
        .filter(u => u.id !== currentUser?.id)
        .map(u => u.id);
      setSelectedIds(new Set(allValidIds));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const count = selectedIds.size;
    const confirmed = window.confirm(
      `CRITICAL: Are you sure you want to PERMANENTLY delete ${count} user(s)?\n\nThis will wipe all their plans, submissions, posts, and history. This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      await bulkDeleteUsers(Array.from(selectedIds));
      toast.success(`Successfully deleted ${count} users and all associated data.`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error("Failed to delete users. Please try again.");
      console.error(error);
    }
  };

  const handleToggleBan = async (userId: string, userName: string, isCurrentlyBanned: boolean) => {
    const nextActionLabel = isCurrentlyBanned ? "unban" : "ban";
    const confirmed = window.confirm(`Are you sure you want to ${nextActionLabel} ${userName}?`);
    if (!confirmed) return;

    await banUser(userId);
    toast.success(`${userName} ${isCurrentlyBanned ? "unbanned" : "banned"}.`);
  };

  const handleVerifyTrainer = async (userId: string, userName: string, isVerified: boolean) => {
    if (isVerified) {
      toast.info(`${userName} is already verified.`);
      return;
    }

    const confirmed = window.confirm(`Verify trainer ${userName}?`);
    if (!confirmed) return;

    await verifyTrainer(userId);
    toast.success(`${userName} verified successfully.`);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <Button 
              variant="destructive" 
              className="w-fit animate-in fade-in slide-in-from-right-4"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedIds.size}
            </Button>
          )}
          
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Trainer
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass-card border border-white/10 shadow-2xl p-6 overflow-hidden bg-background rounded-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Create New Trainer</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTrainer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Name *</label>
                    <Input 
                      value={newTrainer.name}
                      onChange={e => setNewTrainer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Trainer Name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Email *</label>
                    <Input 
                      type="email"
                      value={newTrainer.email}
                      onChange={e => setNewTrainer(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="trainer@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Password *</label>
                  <Input 
                    type="password"
                    value={newTrainer.password}
                    onChange={e => setNewTrainer(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Min 8 characters"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Specialization</label>
                  <Input 
                    value={newTrainer.specialization}
                    onChange={e => setNewTrainer(prev => ({ ...prev, specialization: e.target.value }))}
                    placeholder="e.g. Strength & Conditioning"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">WhatsApp Number *</label>
                  <Input 
                    value={newTrainer.whatsappNumber}
                    onChange={e => setNewTrainer(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Trainer
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleSelectAll}
              className="text-xs text-muted-foreground"
            >
              {selectedIds.size > 0 ? "Deselect All" : "Select All Visible"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email"
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "student", "trainer", "admin"] as const).map((role) => (
                <Button
                  key={role}
                  variant={roleFilter === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter(role)}
                >
                  {role}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {filteredUsers.map((user) => {
              const isSelected = selectedIds.has(user.id);
              const isSelf = user.id === currentUser?.id;

              return (
                <div 
                  key={user.id} 
                  className={`flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between transition-colors ${
                    isSelected ? 'bg-primary/5 border-primary/50' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleSelect(user.id)}
                      disabled={isSelf}
                      className={`mt-1 transition-colors ${isSelf ? 'opacity-20 cursor-not-allowed' : 'text-primary hover:scale-110'}`}
                    >
                      {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                    </button>
                    
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {user.name} 
                        {isSelf && <Badge variant="outline" className="text-[10px] h-4">YOU</Badge>}
                        <Badge variant="secondary">{user.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      
                      {user.role === "student" && (
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                          <span className="rounded-full bg-muted/50 px-2 py-0.5 text-muted-foreground">
                            H: {(user as Student).height || 0}cm / W: {(user as Student).weight || 0}kg
                          </span>
                          <span className="rounded-full bg-muted/50 px-2 py-0.5 text-muted-foreground">
                            Goal: {(user as Student).fitnessGoal || "None"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {user.role === "student" && (
                      <div className="flex items-center gap-2">
                        <select
                          className="text-xs bg-background border border-input rounded-md px-2 py-1 min-w-[140px]"
                          value={(user as Student).trainerId || ""}
                          onChange={async (e) => {
                            const val = e.target.value;
                            try {
                              await assignTrainer(user.id, val === "" ? null : val);
                              toast.success(val === "" ? `Removed trainer` : `Assigned trainer`);
                            } catch (error) {
                              toast.error("Update failed");
                            }
                          }}
                        >
                          <option value="">No Trainer</option>
                          {trainers.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {!isSelf && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleToggleBan(user.id, user.name, Boolean((user as { isBanned?: boolean }).isBanned))}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {user.role === "trainer" && !(user as { isVerified?: boolean }).isVerified && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px]"
                          onClick={() => handleVerifyTrainer(user.id, user.name, false)}
                        >
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Verify
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No users found matching your search.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
