import { test } from "node:test";
import assert from "node:assert/strict";
import {
    DEFAULT_ACTIVE_WINDOW_MS,
    splitStorySections,
    assertStoriesValid,
} from "./story-sections";
import type { StoryGroup } from "@/interfaces/story";

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse("2026-06-05T12:00:00.000Z");

function group(id: string, ageHours: number, activeForMs?: number): StoryGroup {
    return {
        id,
        title: { vi: id, en: id },
        cover: `/c/${id}.webp`,
        createdAt: new Date(NOW - ageHours * HOUR).toISOString(),
        activeForMs,
        items: [
            {
                id: `${id}-1`,
                type: "image",
                src: `/s/${id}/1.webp`,
                createdAt: new Date(NOW).toISOString(),
            },
        ],
    };
}

test("default window is 24h", () => {
    assert.equal(DEFAULT_ACTIVE_WINDOW_MS, 24 * HOUR);
});

test("ring inside the window is active, past it is expired", () => {
    const { active, expired } = splitStorySections([group("fresh", 1), group("old", 30)], NOW);
    assert.deepEqual(active.map((g) => g.id), ["fresh"]);
    assert.deepEqual(expired.map((g) => g.id), ["old"]);
});

test("exactly at the window boundary is expired (strict)", () => {
    const { active, expired } = splitStorySections([group("edge", 24)], NOW);
    assert.equal(active.length, 0);
    assert.deepEqual(expired.map((g) => g.id), ["edge"]);
});

test("per-group activeForMs overrides the default", () => {
    // 30h old but allowed 48h -> still active
    const { active } = splitStorySections([group("long", 30, 48 * HOUR)], NOW);
    assert.deepEqual(active.map((g) => g.id), ["long"]);
});

test("each list is sorted newest-first", () => {
    const { active } = splitStorySections([group("a", 5), group("b", 1), group("c", 3)], NOW);
    assert.deepEqual(active.map((g) => g.id), ["b", "c", "a"]);
});

test("empty input yields empty lists", () => {
    assert.deepEqual(splitStorySections([], NOW), { active: [], expired: [] });
});

test("assertStoriesValid throws on duplicate group id", () => {
    assert.throws(() => assertStoriesValid([group("dup", 1), group("dup", 2)]), /duplicate group id/i);
});

test("assertStoriesValid throws on empty items", () => {
    const g: StoryGroup = { ...group("empty", 1), items: [] };
    assert.throws(() => assertStoriesValid([g]), /no items/i);
});

test("assertStoriesValid accepts a valid set", () => {
    assert.doesNotThrow(() => assertStoriesValid([group("ok", 1)]));
});
