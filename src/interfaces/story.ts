import type { Locale } from "@/i18n/config";

export type Localized = Record<Locale, string>;

// A value that is either one locale-neutral string (e.g. a map URL) or a
// per-locale object (e.g. an internal post URL that differs by locale).
export type MaybeLocalized = string | Localized;

// A place tied to one story item. `name` is the clickable title (per locale);
// `link` (a map or any URL) is optional — without it the name renders as plain
// text. `link` may be one URL or a per-locale object.
export type StoryAddress = {
    name: Localized;
    link?: MaybeLocalized;
};

// A related post tied to one story item. `title` is the clickable title (per
// locale); `link` (the post URL) is optional and may be per-locale.
export type StoryPostRef = {
    title: Localized;
    link?: MaybeLocalized;
};

type StoryItemBase = {
    id: string;
    caption?: Localized;
    address?: StoryAddress; // optional, single, shown in the viewer
    post?: StoryPostRef; // optional, single, shown in the viewer
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
