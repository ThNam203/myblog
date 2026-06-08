import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState, reducer, upcomingItems } from "./story-player";
import type { StoryGroup } from "@/interfaces/story";

function img(id: string) {
    return { id, type: "image" as const, src: `/${id}.webp` };
}
// group A: 2 items, group B: 1 item
const GROUPS: StoryGroup[] = [
    {
        id: "A",
        title: { vi: "A", en: "A" },
        cover: "/a.webp",
        createdAt: "2026-06-05T00:00:00.000Z",
        items: [img("a1"), img("a2")],
    },
    {
        id: "B",
        title: { vi: "B", en: "B" },
        cover: "/b.webp",
        createdAt: "2026-06-04T00:00:00.000Z",
        items: [img("b1")],
    },
];
const r = (state: ReturnType<typeof createInitialState>, action: Parameters<typeof reducer>[2]) =>
    reducer(GROUPS, state, action);

test("initial state is closed at 0/0", () => {
    assert.deepEqual(createInitialState(), {
        open: false,
        groupIndex: 0,
        itemIndex: 0,
        paused: false,
        progress: 0,
    });
});

test("OPEN sets open + indices and resets progress", () => {
    const s = r(createInitialState(), { type: "OPEN", groupIndex: 1 });
    assert.deepEqual(s, { open: true, groupIndex: 1, itemIndex: 0, paused: false, progress: 0 });
});

test("OPEN honors an explicit itemIndex", () => {
    const s = r(createInitialState(), { type: "OPEN", groupIndex: 0, itemIndex: 1 });
    assert.equal(s.itemIndex, 1);
});

test("NEXT advances within a group", () => {
    const open = r(createInitialState(), { type: "OPEN", groupIndex: 0 });
    const s = r(open, { type: "NEXT" });
    assert.deepEqual([s.groupIndex, s.itemIndex], [0, 1]);
});

test("NEXT past last item moves to next group, item 0", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0, itemIndex: 1 });
    s = r(s, { type: "NEXT" });
    assert.deepEqual([s.groupIndex, s.itemIndex], [1, 0]);
});

test("NEXT past last item of last group closes", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 1, itemIndex: 0 });
    s = r(s, { type: "NEXT" });
    assert.equal(s.open, false);
});

test("PREV within a group goes back", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0, itemIndex: 1 });
    s = r(s, { type: "PREV" });
    assert.deepEqual([s.groupIndex, s.itemIndex], [0, 0]);
});

test("PREV at group boundary goes to previous group's last item", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 1, itemIndex: 0 });
    s = r(s, { type: "PREV" });
    assert.deepEqual([s.groupIndex, s.itemIndex], [0, 1]);
});

test("PREV at very start clamps and resets progress", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0, itemIndex: 0 });
    s = { ...s, progress: 0.5 };
    s = r(s, { type: "PREV" });
    assert.deepEqual([s.groupIndex, s.itemIndex, s.progress], [0, 0, 0]);
});

test("TICK accumulates progress", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0 });
    s = r(s, { type: "TICK", delta: 0.3 });
    assert.equal(s.progress, 0.3);
});

test("TICK reaching 1 advances like NEXT", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0, itemIndex: 0 });
    s = r(s, { type: "TICK", delta: 1 });
    assert.deepEqual([s.groupIndex, s.itemIndex, s.progress], [0, 1, 0]);
});

test("PAUSE / RESUME toggle the flag", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0 });
    s = r(s, { type: "PAUSE" });
    assert.equal(s.paused, true);
    s = r(s, { type: "RESUME" });
    assert.equal(s.paused, false);
});

test("SET_PROGRESS sets an absolute value (clamped 0..1)", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0 });
    s = r(s, { type: "SET_PROGRESS", value: 0.7 });
    assert.equal(s.progress, 0.7);
    s = r(s, { type: "SET_PROGRESS", value: 2 });
    assert.equal(s.progress, 1);
});

test("CLOSE closes", () => {
    let s = r(createInitialState(), { type: "OPEN", groupIndex: 0 });
    s = r(s, { type: "CLOSE" });
    assert.equal(s.open, false);
});

test("upcomingItems returns the next items across group boundaries", () => {
    assert.deepEqual(
        upcomingItems(GROUPS, 0, 0, 2).map((i) => i.id),
        ["a2", "b1"],
    );
});

test("upcomingItems stops at the end of the last group", () => {
    assert.deepEqual(upcomingItems(GROUPS, 1, 0, 2), []);
    assert.deepEqual(
        upcomingItems(GROUPS, 0, 1, 5).map((i) => i.id),
        ["b1"],
    );
});

test("upcomingItems with count 0 returns nothing", () => {
    assert.deepEqual(upcomingItems(GROUPS, 0, 0, 0), []);
});
