import type { StoryGroup, StoryItem } from "@/interfaces/story";

export const DEFAULT_IMAGE_DURATION_MS = 5000;

// The next `count` items in play order starting after (groupIndex, itemIndex),
// crossing group boundaries. Used to prefetch media before the viewer needs it.
export function upcomingItems(
    groups: StoryGroup[],
    groupIndex: number,
    itemIndex: number,
    count: number,
): StoryItem[] {
    const result: StoryItem[] = [];
    let g = groupIndex;
    let i = itemIndex + 1;
    while (result.length < count && g < groups.length) {
        const group = groups[g];
        if (!group) break;
        if (i < group.items.length) {
            result.push(group.items[i]);
            i += 1;
        } else {
            g += 1;
            i = 0;
        }
    }
    return result;
}

export type PlayerState = {
    open: boolean;
    groupIndex: number;
    itemIndex: number;
    paused: boolean;
    progress: number; // 0..1 for the current item
};

export type PlayerAction =
    | { type: "OPEN"; groupIndex: number; itemIndex?: number }
    | { type: "CLOSE" }
    | { type: "NEXT" }
    | { type: "PREV" }
    | { type: "TICK"; delta: number }
    | { type: "PAUSE" }
    | { type: "RESUME" }
    | { type: "SET_PROGRESS"; value: number };

export function createInitialState(): PlayerState {
    return { open: false, groupIndex: 0, itemIndex: 0, paused: false, progress: 0 };
}

const CLOSED: PlayerState = {
    open: false,
    groupIndex: 0,
    itemIndex: 0,
    paused: false,
    progress: 0,
};

function clamp01(value: number): number {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
}

function goNext(groups: StoryGroup[], state: PlayerState): PlayerState {
    const group = groups[state.groupIndex];
    if (!group) return CLOSED;
    if (state.itemIndex + 1 < group.items.length) {
        return { ...state, itemIndex: state.itemIndex + 1, progress: 0, paused: false };
    }
    if (state.groupIndex + 1 < groups.length) {
        return {
            ...state,
            groupIndex: state.groupIndex + 1,
            itemIndex: 0,
            progress: 0,
            paused: false,
        };
    }
    return CLOSED;
}

function goPrev(groups: StoryGroup[], state: PlayerState): PlayerState {
    if (state.itemIndex > 0) {
        return { ...state, itemIndex: state.itemIndex - 1, progress: 0, paused: false };
    }
    if (state.groupIndex > 0) {
        const prev = groups[state.groupIndex - 1];
        const lastItem = prev ? Math.max(0, prev.items.length - 1) : 0;
        return {
            ...state,
            groupIndex: state.groupIndex - 1,
            itemIndex: lastItem,
            progress: 0,
            paused: false,
        };
    }
    return { ...state, progress: 0, paused: false }; // clamp at very start
}

export function reducer(
    groups: StoryGroup[],
    state: PlayerState,
    action: PlayerAction,
): PlayerState {
    switch (action.type) {
        case "OPEN":
            return {
                open: true,
                groupIndex: action.groupIndex,
                itemIndex: action.itemIndex ?? 0,
                paused: false,
                progress: 0,
            };
        case "CLOSE":
            return CLOSED;
        case "NEXT":
            return goNext(groups, state);
        case "PREV":
            return goPrev(groups, state);
        case "TICK": {
            const next = clamp01(state.progress + action.delta);
            if (next >= 1) return goNext(groups, state);
            return { ...state, progress: next };
        }
        case "PAUSE":
            return { ...state, paused: true };
        case "RESUME":
            return { ...state, paused: false };
        case "SET_PROGRESS":
            return { ...state, progress: clamp01(action.value) };
        default:
            return state;
    }
}
