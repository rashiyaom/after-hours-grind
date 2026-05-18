import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore, usePosts } from "@/hooks/useStore";
import { toast } from "sonner";
import { fetchFlaggedContentAPI } from "@/lib/api";

const ContentModeration = () => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden" | "under-review">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const posts = usePosts();
  const updatePostStatus = useAppStore((state) => state.updatePostStatus);
  const submissions = useAppStore((state) => state.system.legacySubmissions);
  const approveTaskSubmission = useAppStore((state) => state.approveTaskSubmission);
  const rejectTaskSubmission = useAppStore((state) => state.rejectTaskSubmission);
  const postList = Object.values(posts);
  const [moderationPosts, setModerationPosts] = useState<typeof postList>([]);
  const pendingProofSubmissions = submissions.filter((submission) => submission.status === "pending" && submission.requiresApproval);

  useEffect(() => {
    const loadModerationPosts = async () => {
      try {
        const result = await fetchFlaggedContentAPI();
        const flagged = Array.isArray(result.flaggedPosts) ? result.flaggedPosts : [];
        const normalized = flagged.map((item) => ({
          id: String(item.id),
          userId: String(item.userId ?? item.user?.id ?? ""),
          userName: String(item.user?.name ?? "Unknown"),
          userAvatar: String(item.user?.avatar ?? ""),
          userRole: String(item.user?.role ?? "student").toLowerCase() as "student" | "trainer" | "admin",
          source: String(item.source ?? "general") as "general" | "task-proof",
          type: String(item.type ?? "image") as "image" | "video" | "reel",
          mediaUrl: String(item.mediaUrl ?? ""),
          caption: String(item.caption ?? ""),
          likes: Number(item._count?.likes ?? 0),
          comments: Number(item._count?.comments ?? 0),
          location: String(item.location ?? ""),
          timestamp: String(item.createdAt ?? new Date().toISOString()),
          liked: false,
          status: String(item.status ?? "visible") as "visible" | "hidden" | "under-review",
        }));

        const merged = [...postList];
        const existing = new Set(merged.map((p) => p.id));
        normalized.forEach((post) => {
          if (!existing.has(post.id)) merged.push(post);
        });
        setModerationPosts(merged);
      } catch (error) {
        import("@sentry/react").then(({ default: Sentry }) => {
          Sentry.captureException(error, { tags: { action: "load_moderation_posts" } });
        });
        setModerationPosts(postList);
      }
    };

    void loadModerationPosts();
  }, [postList]);

  const filteredPosts = useMemo(() => {
    return moderationPosts.filter((post) => {
      const statusMatch = statusFilter === "all" ? true : post.status === statusFilter;
      const queryMatch =
        query.trim() === ""
          ? true
          : post.caption.toLowerCase().includes(query.toLowerCase()) || post.userName.toLowerCase().includes(query.toLowerCase());
      return statusMatch && queryMatch;
    });
  }, [moderationPosts, query, statusFilter]);

  const toggleSelected = (postId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredPosts.map((post) => post.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const applyStatusWithUndo = (postIds: string[], status: "visible" | "hidden" | "under-review") => {
    if (postIds.length === 0) return;

    if (status === "hidden") {
      const confirmed = window.confirm(`Hide ${postIds.length} selected post(s)?`);
      if (!confirmed) return;
    }

    const previousStatuses = postIds
      .map((id) => ({ id, prevStatus: posts[id]?.status }))
      .filter((entry): entry is { id: string; prevStatus: "visible" | "hidden" | "under-review" } => Boolean(entry.prevStatus));

    postIds.forEach((id) => updatePostStatus(id, status));
    clearSelection();

    toast.success(`Updated ${postIds.length} post(s) to ${status}.`, {
      action: {
        label: "Undo",
        onClick: () => {
          previousStatuses.forEach(({ id, prevStatus }) => updatePostStatus(id, prevStatus));
        },
      },
    });
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Content Moderation</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pending Task Proof Approvals ({pendingProofSubmissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingProofSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending task proof submissions.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingProofSubmissions.map((submission) => (
                <div key={submission.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{submission.studentName}</p>
                      <p className="text-sm text-muted-foreground">{submission.taskName} · {submission.taskType} · Day {submission.dayNumber ?? "-"}</p>
                      <p className="text-xs text-muted-foreground mt-1">Submitted: {submission.timestamp}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          approveTaskSubmission(submission.id, "Approved by admin");
                          toast.success("Submission approved.");
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          rejectTaskSubmission(submission.id, "Rejected by admin. Please re-upload clearer proof.");
                          toast.warning("Submission rejected.");
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All Posts ({filteredPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search caption or author"
            />
            <div className="flex gap-2">
              {(["all", "visible", "under-review", "hidden"] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
          {selectedIds.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">{selectedIds.size} selected</p>
              <Button size="sm" variant="outline" onClick={() => applyStatusWithUndo(Array.from(selectedIds), "visible")}>Bulk Visible</Button>
              <Button size="sm" variant="outline" onClick={() => applyStatusWithUndo(Array.from(selectedIds), "under-review")}>Bulk Review</Button>
              <Button size="sm" variant="destructive" onClick={() => applyStatusWithUndo(Array.from(selectedIds), "hidden")}>Bulk Hide</Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>Clear</Button>
            </div>
          )}
          <div className="mb-4 flex gap-2">
            <Button size="sm" variant="outline" onClick={selectAllFiltered}>Select Filtered</Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>Unselect All</Button>
          </div>
          <div className="flex flex-col gap-4">
            {filteredPosts.map((post) => (
              <div key={post.id} className="rounded-lg border p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(post.id)}
                      onChange={() => toggleSelected(post.id)}
                      className="h-4 w-4"
                    />
                    <Badge
                      variant={post.status === "visible" ? "default" : post.status === "hidden" ? "destructive" : "secondary"}
                    >
                      {post.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{post.type} by {post.userRole}</p>
                </div>
                <div>
                  <p className="font-semibold">{post.caption}</p>
                  <p className="text-sm text-muted-foreground">by {post.userName} ({post.userRole})</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => applyStatusWithUndo([post.id], "visible")}>Set Visible</Button>
                  <Button size="sm" variant="outline" onClick={() => applyStatusWithUndo([post.id], "under-review")}>Review</Button>
                  <Button size="sm" variant="destructive" onClick={() => applyStatusWithUndo([post.id], "hidden")}>Hide</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentModeration;
