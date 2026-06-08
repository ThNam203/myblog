"use client";

import { useMemo } from "react";
import type { Locale } from "@/i18n/config";
import type { StoryLabels } from "@/i18n/dictionaries";
import type { StoryGroup } from "@/interfaces/story";
import { useStoryPlayer } from "./use-story-player";
import { StoryViewer } from "./story-viewer";

type Props = {
    stories: StoryGroup[];
    locale: Locale;
    labels: StoryLabels;
};

export function StoryBar({ stories, locale, labels }: Props) {
    // All stories in one row, newest first. Deterministic sort → same on server
    // and client, so no hydration gate is needed.
    const ordered = useMemo(
        () => [...stories].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
        [stories],
    );
    const player = useStoryPlayer(ordered);

    if (ordered.length === 0) return null;

    return (
        <section aria-label={labels.regionLabel} className="mb-8 mt-4">
            <h2 className="mb-8 text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
                {labels.regionLabel}
            </h2>
            <ul className="flex gap-4 overflow-x-auto pb-1">
                {ordered.map((group, index) => (
                    <li key={group.id} className="shrink-0">
                        <button
                            type="button"
                            onClick={() => player.open(index)}
                            aria-label={labels.openAria.replace("{title}", group.title[locale])}
                            className="flex w-20 flex-col items-center gap-1 focus:outline-none"
                        >
                            <span className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                                <span className="block rounded-full border-2 border-white bg-white dark:border-neutral-900 dark:bg-neutral-900">
                                    <img
                                        src={group.cover}
                                        alt=""
                                        className="h-16 w-16 rounded-full object-cover"
                                    />
                                </span>
                            </span>
                            <span className="line-clamp-1 w-full text-center text-xs text-neutral-700 dark:text-neutral-300">
                                {group.title[locale]}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>

            <StoryViewer groups={ordered} locale={locale} labels={labels} player={player} />
        </section>
    );
}
