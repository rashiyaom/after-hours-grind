import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore, usePosts } from "@/hooks/useStore";
import { toast } from "sonner";

const ContentModeration = () => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden" | "under-review">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const posts = usePosts();
  const updatePostStatus = useAppStore((state) => state.updatePostStatus);
  const postList = Object.values(posts);

  const filteredPosts = useMemo(() => {
    return postList.filter((post) => {
      const statusMatch = statusFilter === "all" ? true : post.status === statusFilter;
      const queryMatch =
        query.trim() === ""
          ? true
          : post.caption.toLowerCase().includes(query.toLowerCase()) || post.userName.toLowerCase().includes(query.toLowerCase());
      return statusMatch && queryMatch;
    });
  }, [postList, query, statusFilter]);

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
