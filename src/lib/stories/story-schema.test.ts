import { test } from "node:test";
import assert from "node:assert/strict";
import { parseStoryRow, parseStoryRows, storyGroupSchema } from "./story-schema";

const VALID_ITEMS = [
    {
        id: "i1",
        type: "image",
        src: "https://x.supabase.co/storage/v1/object/public/stories/g/i1.webp",
        music: { src: "/music/song.mp3", startTime: 20 },
        caption: { vi: "chào", en: "hi" },
    },
    {
        id: "v1",
        type: "video",
        src: "https://x.supabase.co/storage/v1/object/public/stories/g/v1.mp4",
        poster: "https://x.supabase.co/storage/v1/object/public/stories/g/v1.webp",
        address: { name: { vi: "Sài Gòn", en: "Saigon" }, link: "https://maps.example.com" },
        post: { title: { vi: "Bài", en: "Post" }, link: { vi: "/vi/posts/x", en: "/en/posts/x" } },
    },
];

function row(overrides: Record<string, unknown> = {}) {
    return {
        id: "g",
        title: { vi: "Nhóm", en: "Group" },
        cover: "https://x.supabase.co/storage/v1/object/public/stories/g/i1.webp",
        items: VALID_ITEMS,
        created_at: "2026-06-12T00:00:00.000Z",
        active_for_ms: null,
        ...overrides,
    };
}

test("parseStoryRow maps a valid row to a StoryGroup", () => {
    const group = parseStoryRow(row());
    assert.equal(group.id, "g");
    assert.deepEqual(group.title, { vi: "Nhóm", en: "Group" });
    assert.equal(group.createdAt, "2026-06-12T00:00:00.000Z");
    assert.equal(group.activeForMs, undefined);
    assert.equal(group.items.length, 2);
    assert.equal(group.items[0].type, "image");
    assert.equal(group.items[1].type, "video");
});

test("parseStoryRow keeps active_for_ms when set", () => {
    const group = parseStoryRow(row({ active_for_ms: 1000 }));
    assert.equal(group.activeForMs, 1000);
});

test("parseStoryRow rejects empty items", () => {
    assert.throws(() => parseStoryRow(row({ items: [] })));
});

test("parseStoryRow rejects unknown item type", () => {
    assert.throws(() => parseStoryRow(row({ items: [{ id: "x", type: "audio", src: "/a" }] })));
});

test("parseStoryRow rejects missing locale in title", () => {
    assert.throws(() => parseStoryRow(row({ title: { vi: "chỉ vi" } })));
});

test("parseStoryRow rejects negative music startTime", () => {
    assert.throws(() =>
        parseStoryRow(
            row({
                items: [
                    { id: "i", type: "image", src: "/x.webp", music: { src: "/m.mp3", startTime: -1 } },
                ],
            }),
        ),
    );
});

test("parseStoryRows rejects duplicate group ids", () => {
    assert.throws(() => parseStoryRows([row(), row()]));
});

test("parseStoryRows maps a list", () => {
    const groups = parseStoryRows([row(), row({ id: "g2" })]);
    assert.deepEqual(
        groups.map((g) => g.id),
        ["g", "g2"],
    );
});

test("storyGroupSchema rejects duplicate item ids within a group", () => {
    const items = [VALID_ITEMS[0], { ...VALID_ITEMS[0] }];
    assert.equal(
        storyGroupSchema.safeParse({
            id: "g",
            title: { vi: "a", en: "a" },
            cover: "/c.webp",
            items,
            createdAt: "2026-06-12T00:00:00.000Z",
        }).success,
        false,
    );
});

test("storyGroupSchema accepts a group authored by the form (camelCase, no row mapping)", () => {
    const parsed = storyGroupSchema.parse({
        id: "g",
        title: { vi: "a", en: "a" },
        cover: "/c.webp",
        items: VALID_ITEMS,
        createdAt: "2026-06-12T00:00:00.000Z",
        activeForMs: 5000,
    });
    assert.equal(parsed.activeForMs, 5000);
});
