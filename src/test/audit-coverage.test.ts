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

describe("auth validation", () => {
  it("rejects wrong password and accepts correct password", () => {
    const bad = useAppStore.getState().login("arjun@test.com", "bad-password", "student");
    expect(bad).toBe(false);

    const good = useAppStore.getState().login("arjun@test.com", "student123", "student");
    expect(good).toBe(true);
    expect(useAppStore.getState().session.currentUser?.id).toBe("s1");
  });
});

describe("route permission behavior", () => {
  it("returns unauthorized redirect for missing permission", () => {
    const student = useAppStore.getState().users["s1"];
    const result = resolveProtectedRouteRedirect({
      isAuthenticated: true,
      currentUser: student,
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
  it("updates likes and plan assignment state", () => {
    const beforeLikes = useAppStore.getState().posts["post1"].likes;
    useAppStore.getState().likePost("post1");
    expect(useAppStore.getState().posts["post1"].likes).toBe(beforeLikes + 1);

    useAppStore.setState((prev) => ({
      ...prev,
      session: { currentUser: prev.users["t1"], isAuthenticated: true },
    }));

    useAppStore.getState().createPlan({
      title: "UNIT_TEST_PROTOCOL",
      duration: 21,
      goalType: "Hypertrophy",
      difficulty: "intermediate",
      studentIds: ["s1"],
    });

    const student = useAppStore.getState().users["s1"] as Student;
    expect(student.role).toBe("student");
    expect(student.currentPlanId).toBeTruthy();
    expect(student.totalDays).toBe(21);
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
