"use client";

import cn from "classnames";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { StoryLabels } from "@/i18n/dictionaries";
import type { StoryGroup } from "@/interfaces/story";
import { isStoryExpired } from "@/lib/stories/story-sections";
import { prefetchAudio, prefetchImage } from "@/lib/stories/media-prefetch";
import { useStoryPlayer } from "./use-story-player";
import { StoryViewer } from "./story-viewer";

// Warm a group's first item (image + track) so opening the ring is instant.
function warmGroup(group: StoryGroup): void {
    const first = group.items[0];
    if (first?.type !== "image") return;
    prefetchImage(first.src);
    if (first.music) prefetchAudio(first.music.src);
}

type Props = {
    stories: StoryGroup[];
    locale: Locale;
    labels: StoryLabels;
};

export function StoryBar({ stories, locale, labels }: Props) {
    // All stories in one row, newest first. Deterministic sort → same order on
    // server and client (the time-based muting below is gated to after mount).
    const ordered = useMemo(
        () => [...stories].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
        [stories],
    );
    const player = useStoryPlayer(ordered);

    // Expiry depends on the current time, which only exists on the client. Stay
    // null until mounted so server and first client render agree (no hydration
    // mismatch); after mount, stories past their active window mute in place.
    const [now, setNow] = useState<number | null>(null);
    useEffect(() => setNow(Date.now()), []);
    const expiredIds = useMemo(() => {
        if (now === null) return new Set<string>();
        return new Set(
            ordered.filter((group) => isStoryExpired(group, now)).map((group) => group.id),
        );
    }, [ordered, now]);

    if (ordered.length === 0) return null;

    return (
        <section aria-label={labels.regionLabel} className="mb-8 mt-4">
            <h2 className="mb-8 text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
                {labels.regionLabel}
            </h2>
            <ul className="flex gap-4 overflow-x-auto pb-1">
                {ordered.map((group, index) => {
                    const muted = expiredIds.has(group.id);
                    return (
                        <li key={group.id} className="shrink-0">
                            <button
                                type="button"
                                onClick={() => player.open(index)}
                                onPointerEnter={() => warmGroup(group)}
                                onFocus={() => warmGroup(group)}
                                aria-label={labels.openAria.replace("{title}", group.title[locale])}
                                className="flex w-20 flex-col items-center gap-1 focus:outline-none"
                            >
                                <span
                                    className={cn(
                                        "rounded-full p-[2px]",
                                        muted
                                            ? "bg-neutral-300 dark:bg-neutral-700"
                                            : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600",
                                    )}
                                >
                                    <span className="block rounded-full border-2 border-white bg-white dark:border-neutral-900 dark:bg-neutral-900">
                                        <img
                                            src={group.cover}
                                            alt=""
                                            className={cn(
                                                "h-16 w-16 rounded-full object-cover",
                                                muted && "opacity-60 grayscale",
                                            )}
                                        />
                                    </span>
                                </span>
                                <span className="line-clamp-1 w-full text-center text-xs text-neutral-700 dark:text-neutral-300">
                                    {group.title[locale]}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            <StoryViewer groups={ordered} locale={locale} labels={labels} player={player} />
        </section>
    );
}
