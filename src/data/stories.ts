import { assertStoriesValid } from "@/lib/stories/story-sections";
import type { StoryGroup } from "@/interfaces/story";

/**
 * Owner-authored stories. Newest groups can be in any order — the UI sorts by
 * `createdAt` descending. Media paths are relative to `public/`.
 *
 * Example:
 *   {
 *     id: "grad-2026",
 *     title: { vi: "Tốt nghiệp", en: "Graduation" },
 *     cover: "/assets/stories/grad-2026/cover.webp",
 *     createdAt: "2026-06-05T09:00:00.000Z",
 *     // activeForMs: 48 * 60 * 60 * 1000, // optional: override the 24h window
 *     items: [
 *       { id: "g1", type: "image", src: "/assets/stories/grad-2026/1.webp", createdAt: "2026-06-05T09:00:00.000Z" },
 *       { id: "g2", type: "video", src: "/assets/stories/grad-2026/clip.mp4", poster: "/assets/stories/grad-2026/clip-poster.webp", createdAt: "2026-06-05T09:01:00.000Z", caption: { vi: "Khoảnh khắc", en: "The moment" } },
 *     ],
 *   }
 */
export const stories: StoryGroup[] = [];

assertStoriesValid(stories);
