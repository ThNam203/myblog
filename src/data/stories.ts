import { assertStoriesValid } from "@/lib/stories/story-sections";
import type { StoryGroup } from "@/interfaces/story";

/**
 * Owner-authored stories. Groups can be listed in any order — the row is sorted
 * by group `createdAt` descending (newest first). Media paths are relative to
 * `public/`.
 *
 * Items play in array order (top to bottom). Video item shape (drop the .mp4 +
 * poster into public/assets/stories/<group>/):
 *   { id: "v1", type: "video", src: "/assets/stories/grad/clip.mp4",
 *     poster: "/assets/stories/grad/clip-poster.webp",
 *     caption: { vi: "...", en: "..." } }
 *
 * Per-item extras (both optional, shown in the viewer). `name`/`title` are
 * per-locale {vi,en}; `link` is optional and may be ONE url (locale-neutral,
 * e.g. a map) OR a per-locale {vi,en} (e.g. an internal post that differs):
 *   address: { name: { vi: "...", en: "..." }, link?: "https://maps..." }
 *   post:    { title: { vi: "...", en: "..." }, link?: { vi: "/vi/posts/x", en: "/en/posts/x" } }
 *
 * ── SAMPLE CONTENT BELOW (images that already live in public/) ──
 * Replace titles/captions with your own and add real media. Each group's
 * `createdAt` only sets its position in the row (newest first).
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
                music: { src: "/music/nang_am_trong_tim.mp3", startTime: 15 },
                caption: { vi: "Pizza tối qua", en: "Pizza last night" },
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
                music: { src: "/music/to_mau.mp3", startTime: 20 },
                caption: { vi: "Ramen nóng hổi", en: "Hot ramen" },
            },
            {
                id: "fd-3",
                type: "image",
                src: "/assets/images/20260520/pho-van-hoa.webp",
                music: { src: "/music/sai_gon_hom_nay_mua.mp3", startTime: 30 },
                caption: { vi: "Phố Văn Hoá", en: "Pho Van Hoa" },
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
                music: { src: "/music/giua_dai_lo_dong_tay.mp3", startTime: 15 },
                caption: { vi: "Mưa lớn quá", en: "Pouring rain" },
                address: {
                    name: { vi: "Thủ Đức, Sài Gòn", en: "Thu Duc, Saigon" },
                },
            },
            {
                id: "rn-2",
                type: "image",
                src: "/assets/images/20260520/jogging-under-the-rain.webp",
                music: { src: "/music/nhung_dieu_nho_nhoi.mp3", startTime: 45 },
                caption: { vi: "Chạy bộ dưới mưa", en: "Jogging in the rain" },
            },
        ],
    },
];

assertStoriesValid(stories);
