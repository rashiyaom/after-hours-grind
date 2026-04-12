import { useMemo, useState } from "react";
import { Search, ShieldCheck, UserX } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore, useUsers } from "@/hooks/useStore";
import { toast } from "sonner";
import { Student } from "@/types";

const UserManagement = () => {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "trainer" | "admin">("all");
  const users = useUsers();
  const banUser = useAppStore((state) => state.banUser);
  const verifyTrainer = useAppStore((state) => state.verifyTrainer);
  const assignTrainer = useAppStore((state) => state.assignTrainer);
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

  const handleToggleBan = async (userId: string, userName: string, isCurrentlyBanned: boolean) => {
    const nextActionLabel = isCurrentlyBanned ? "unban" : "ban";
    const confirmed = window.confirm(`Are you sure you want to ${nextActionLabel} ${userName}?`);
    if (!confirmed) return;

    await banUser(userId);
    toast.success(`${userName} ${isCurrentlyBanned ? "unbanned" : "banned"}.`, {
      action: {
        label: "Undo",
        onClick: () => {
          void banUser(userId);
        },
      },
    });
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
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
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
          <div className="flex flex-col gap-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">
                    {user.name} <Badge variant="secondary" className="ml-2">{user.role}</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.role === "student" && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border px-2 py-1 text-muted-foreground">
                        Height: {(user as Student).height || 0} cm
                      </span>
                      <span className="rounded-full border px-2 py-1 text-muted-foreground">
                        Weight: {(user as Student).weight || 0} kg
                      </span>
                      <span className="rounded-full border px-2 py-1 text-muted-foreground">
                        Goal: {(user as Student).fitnessGoal || "not set"}
                      </span>
                      <span className="rounded-full border px-2 py-1 text-muted-foreground">
                        BMI: {(() => {
                          const student = user as Student;
                          if (!student.height || !student.weight) return "-";
                          const meters = student.height / 100;
                          const bmi = student.weight / (meters * meters);
                          return bmi.toFixed(1);
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {user.role === "student" && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Assigned Trainer:</span>
                        <select
                          className="text-sm bg-background border border-input rounded-md px-2 py-1 min-w-[150px]"
                          value={(user as Student).trainerId || ""}
                          onChange={async (e) => {
                            const val = e.target.value;
                            try {
                              await assignTrainer(user.id, val === "" ? null : val);
                              toast.success(
                                val === "" ? `Trainer removed for ${user.name}` : `Trainer assigned to ${user.name}`
                              );
                            } catch (error) {
                              const message = error instanceof Error && error.message
                                ? error.message
                                : `Could not update trainer for ${user.name}`;
                              toast.error(message);
                            }
                          }}
                        >
                          <option value="">None</option>
                          {trainers.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleBan(user.id, user.name, Boolean((user as { isBanned?: boolean }).isBanned))}
                      >
                        <UserX className="h-4 w-4" />
                        Toggle Ban
                      </Button>
                    </>
                  )}
                  {user.role === "trainer" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyTrainer(user.id, user.name, Boolean((user as { isVerified?: boolean }).isVerified))}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Verify Trainer
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
