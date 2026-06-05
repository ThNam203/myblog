import type { Locale } from "@/i18n/config";

export type Localized = Record<Locale, string>;

type StoryItemBase = {
    id: string;
    caption?: Localized;
    createdAt: string; // ISO 8601
};

export type StoryImageItem = StoryItemBase & {
    type: "image";
    src: string; // e.g. /assets/stories/grad-2026/photo-1.webp
    durationMs?: number;
};

export type StoryVideoItem = StoryItemBase & {
    type: "video";
    src: string; // e.g. /assets/stories/grad-2026/clip.mp4 (in public/)
    poster?: string;
};

export type StoryItem = StoryImageItem | StoryVideoItem;

export type StoryGroup = {
    id: string;
    title: Localized;
    cover: string; // circle thumbnail
    items: StoryItem[];
    createdAt: string; // ISO 8601 — expiry + ordering anchor
    activeForMs?: number; // optional override of the default active window
};
