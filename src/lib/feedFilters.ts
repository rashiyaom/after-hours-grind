import { Post } from "@/types";

export const filterPostsByTab = (posts: Post[], tab: string) => {
  if (tab === "Videos") return posts.filter((p) => p.type === "reel" || p.type === "video");
  if (tab === "Photos") return posts.filter((p) => p.type === "image");
  return posts;
};
