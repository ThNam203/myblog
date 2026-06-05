"use client";

import { useEffect, useMemo, useState } from "react";
import type { StoryGroup } from "@/interfaces/story";
import { splitStorySections } from "@/lib/stories/story-sections";

export type StorySections = {
    active: StoryGroup[];
    expired: StoryGroup[];
    ready: boolean; // false until mounted (avoids hydration mismatch)
};

export function useStorySections(groups: StoryGroup[]): StorySections {
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        setNow(Date.now());
    }, []);

    return useMemo<StorySections>(() => {
        if (now === null) {
            const active = [...groups].sort(
                (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
            );
            return { active, expired: [], ready: false };
        }
        const { active, expired } = splitStorySections(groups, now);
        return { active, expired, ready: true };
    }, [groups, now]);
}
