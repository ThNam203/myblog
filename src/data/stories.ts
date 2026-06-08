import { assertStoriesValid } from "@/lib/stories/story-sections";
import type { StoryGroup } from "@/interfaces/story";

/**
 * Owner-authored stories. Newest groups can be in any order — the UI sorts by
 * `createdAt` descending. Media paths are relative to `public/`.
 *
 * A ring is "Active" for 24h after its `createdAt` (override per-group with
 * `activeForMs`), then moves to the "Archive" section. Classification happens
 * client-side, so a ring expires on its own without a redeploy.
 *
 * Video item shape (drop the .mp4 + poster into public/assets/stories/<group>/):
 *   { id: "v1", type: "video", src: "/assets/stories/grad/clip.mp4",
 *     poster: "/assets/stories/grad/clip-poster.webp",
 *     createdAt: "2026-06-08T09:00:00.000Z", caption: { vi: "...", en: "..." } }
 *
 * Per-item extras (both optional, shown in the viewer). `name`/`title` are
 * per-locale {vi,en}; `link` is optional and may be ONE url (locale-neutral,
 * e.g. a map) OR a per-locale {vi,en} (e.g. an internal post that differs):
 *   address: { name: { vi: "...", en: "..." }, link?: "https://maps..." }
 *   post:    { title: { vi: "...", en: "..." }, link?: { vi: "/vi/posts/x", en: "/en/posts/x" } }
 *
 * ── SAMPLE CONTENT BELOW (images that already live in public/) ──
 * Replace titles/captions/dates with your own and add real media. Set real
 * `createdAt` values — the "fresh" group is dated for today so it shows under
 * Active; the older one is dated last week so it shows under Archive.
 */
export const stories: StoryGroup[] = [
    {
        id: "an-gi-hom-nay",
        title: { vi: "Ăn gì hôm nay", en: "Food today" },
        cover: "/assets/images/20260520/pizza-1.webp",
        createdAt: "2026-06-08T09:00:00.000Z",
        items: [
            {
                id: "fd-1",
                type: "image",
                src: "/assets/images/20260520/pizza-1.webp",
                createdAt: "2026-06-08T09:00:00.000Z",
                caption: { vi: "Pizza tối qua 🍕", en: "Pizza last night 🍕" },
                address: {
                    name: { vi: "Pizza 4P's", en: "Pizza 4P's" },
                    link: "https://maps.google.com/?q=Pizza+4Ps", // one url for all locales
                },
                post: {
                    title: { vi: "Một tối Sài Gòn", en: "A Saigon night" },
                    link: {
                        vi: "/vi/posts/1.the-beginning",
                        en: "/en/posts/1.the-beginning",
                    },
                },
            },
            {
                id: "fd-2",
                type: "image",
                src: "/assets/images/20260520/ramennn.webp",
                durationMs: 4000,
                createdAt: "2026-06-08T09:05:00.000Z",
                caption: { vi: "Ramen nóng hổi", en: "Hot ramen" },
            },
            {
                id: "fd-3",
                type: "image",
                src: "/assets/images/20260520/pho-van-hoa.webp",
                createdAt: "2026-06-08T09:10:00.000Z",
                caption: { vi: "Phở Văn Hoa", en: "Pho Van Hoa" },
            },
        ],
    },
    {
        id: "sai-gon-mua",
        title: { vi: "Sài Gòn mưa", en: "Rainy Saigon" },
        cover: "/assets/images/20260520/hard-rain.webp",
        createdAt: "2026-06-02T18:00:00.000Z",
        items: [
            {
                id: "rn-1",
                type: "image",
                src: "/assets/images/20260520/hard-rain.webp",
                createdAt: "2026-06-02T18:00:00.000Z",
                caption: { vi: "Mưa lớn quá", en: "Pouring rain" },
                address: {
                    name: { vi: "Quận 1, Sài Gòn", en: "District 1, Saigon" },
                    // no link → plain text
                },
            },
            {
                id: "rn-2",
                type: "image",
                src: "/assets/images/20260520/jogging-under-the-rain.webp",
                createdAt: "2026-06-02T18:02:00.000Z",
                caption: { vi: "Chạy bộ dưới mưa", en: "Jogging in the rain" },
            },
        ],
    },
];

assertStoriesValid(stories);
