import { beforeEach, describe, expect, it } from "vitest";

import { resolveProtectedRouteRedirect } from "@/lib/routeAccess";
import { useAppStore } from "@/hooks/useStore";
import { filterPostsByTab } from "@/lib/feedFilters";
import { Post, Student } from "@/types";

const initialSnapshot = {
  users: structuredClone(useAppStore.getState().users),
  posts: structuredClone(useAppStore.getState().posts),
  plans: structuredClone(useAppStore.getState().plans),
  system: structuredClone(useAppStore.getState().system),
};

beforeEach(() => {
  useAppStore.setState({
    users: structuredClone(initialSnapshot.users),
    posts: structuredClone(initialSnapshot.posts),
    plans: structuredClone(initialSnapshot.plans),
    system: structuredClone(initialSnapshot.system),
    session: { currentUser: null, isAuthenticated: false },
  });
});

describe("route permission behavior", () => {
  it("returns unauthorized redirect for missing permission", () => {
    const result = resolveProtectedRouteRedirect({
      isAuthenticated: true,
      currentUser: { id: "test", name: "Test", email: "t@t.com", passwordHash: "", avatar: "", role: "student" } as any,
      allowedRoles: ["student"],
      requiredPermission: "post_feed",
      permissions: {
        ...useAppStore.getState().system.permissions,
        student: {
          ...useAppStore.getState().system.permissions.student,
          post_feed: false,
        },
      },
    });

    expect(result).toBe("/unauthorized");
  });
});

describe("store action mutation", () => {
  it("toggleLike updates post state optimistically", async () => {
    // Seed a post
    useAppStore.setState((prev) => ({
      posts: {
        ...prev.posts,
        "post1": {
          id: "post1", userId: "u1", userName: "Test", userAvatar: "", userRole: "student" as const,
          type: "image" as const, mediaUrl: "", caption: "", likes: 5, comments: 0,
          location: "", timestamp: new Date().toISOString(), liked: false, status: "visible" as const,
        },
      },
    }));

    const beforeLikes = useAppStore.getState().posts["post1"].likes;
    // toggleLike is async, but optimistically updates immediately
    void useAppStore.getState().toggleLike("post1");
    expect(useAppStore.getState().posts["post1"].likes).toBe(beforeLikes + 1);
  });
});

describe("feed filter behavior", () => {
  it("includes both video and reel in Videos tab", () => {
    const sample: Post[] = [
      { id: "1", type: "video" },
      { id: "2", type: "reel" },
      { id: "3", type: "image" },
    ] as unknown as Post[];

    const videos = filterPostsByTab(sample, "Videos");
    const photos = filterPostsByTab(sample, "Photos");

    expect(videos.map((p: { id: string }) => p.id)).toEqual(["1", "2"]);
    expect(photos.map((p: { id: string }) => p.id)).toEqual(["3"]);
  });
});
