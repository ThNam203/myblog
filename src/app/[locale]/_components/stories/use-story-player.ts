"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import type { StoryGroup } from "@/interfaces/story";
import {
    createInitialState,
    DEFAULT_IMAGE_DURATION_MS,
    reducer,
    type PlayerAction,
    type PlayerState,
} from "@/lib/stories/story-player";

const TICK_MS = 50; // progress update cadence for image items

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReduced(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);
    return reduced;
}

export function useStoryPlayer(groups: StoryGroup[]) {
    const [state, dispatch] = useReducer(
        (s: PlayerState, a: PlayerAction) => reducer(groups, s, a),
        undefined,
        createInitialState,
    );
    const reducedMotion = usePrefersReducedMotion();

    const currentGroup = state.open ? groups[state.groupIndex] : undefined;
    const currentItem = currentGroup?.items[state.itemIndex];

    // Image auto-advance: tick progress over the item's duration. Videos advance
    // via their own `ended` event (wired in the viewer), so no timer here.
    useEffect(() => {
        if (!state.open || state.paused || reducedMotion) return;
        if (!currentItem || currentItem.type !== "image") return;
        const durationMs = currentItem.durationMs ?? DEFAULT_IMAGE_DURATION_MS;
        const interval = window.setInterval(() => {
            dispatch({ type: "TICK", delta: TICK_MS / durationMs });
        }, TICK_MS);
        return () => window.clearInterval(interval);
    }, [state.open, state.paused, state.groupIndex, state.itemIndex, reducedMotion, currentItem]);

    const open = useCallback((groupIndex: number, itemIndex?: number) => {
        dispatch({ type: "OPEN", groupIndex, itemIndex });
    }, []);
    const close = useCallback(() => dispatch({ type: "CLOSE" }), []);
    const next = useCallback(() => dispatch({ type: "NEXT" }), []);
    const prev = useCallback(() => dispatch({ type: "PREV" }), []);
    const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
    const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
    const setProgress = useCallback((value: number) => dispatch({ type: "SET_PROGRESS", value }), []);

    return {
        state,
        currentGroup,
        currentItem,
        reducedMotion,
        open,
        close,
        next,
        prev,
        pause,
        resume,
        setProgress,
    };
}
