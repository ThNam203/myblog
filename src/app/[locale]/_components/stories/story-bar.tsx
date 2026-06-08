"use client";

import cn from "classnames";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { StoryLabels } from "@/i18n/dictionaries";
import type { StoryGroup } from "@/interfaces/story";
import { useStorySections } from "./use-story-sections";
import { useStoryPlayer } from "./use-story-player";
import { StoryViewer } from "./story-viewer";

type Props = {
    stories: StoryGroup[];
    locale: Locale;
    labels: StoryLabels;
};

type SectionKey = "active" | "expired";

export function StoryBar({ stories, locale, labels }: Props) {
    const { active, expired } = useStorySections(stories);
    const [section, setSection] = useState<SectionKey>("active");
    const viewerGroups = section === "active" ? active : expired;
    const player = useStoryPlayer(viewerGroups);

    if (active.length === 0 && expired.length === 0) return null;

    const openRing = (key: SectionKey, index: number) => {
        // OPEN does not read `groups`; React rebinds the reducer to the latest
        // groups on the re-render triggered by setSection, so this is consistent.
        setSection(key);
        player.open(index);
    };

    return (
        <section aria-label={labels.regionLabel} className="mb-8 mt-4">
            <h2 className="mb-8 text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
                {labels.regionLabel}
            </h2>
            {active.length > 0 && (
                <Ring
                    row={active}
                    locale={locale}
                    labels={labels}
                    muted={false}
                    onOpen={(i) => openRing("active", i)}
                />
            )}
            {expired.length > 0 && (
                <div className="mt-6">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        {labels.archiveHeading}
                    </h3>
                    <Ring
                        row={expired}
                        locale={locale}
                        labels={labels}
                        muted
                        onOpen={(i) => openRing("expired", i)}
                    />
                </div>
            )}

            <StoryViewer groups={viewerGroups} locale={locale} labels={labels} player={player} />
        </section>
    );
}

type RingProps = {
    row: StoryGroup[];
    locale: Locale;
    labels: StoryLabels;
    muted: boolean;
    onOpen: (index: number) => void;
};

function Ring({ row, locale, labels, muted, onOpen }: RingProps) {
    return (
        <ul className="flex gap-4 overflow-x-auto pb-1">
            {row.map((group, index) => (
                <li key={group.id} className="shrink-0">
                    <button
                        type="button"
                        onClick={() => onOpen(index)}
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
            ))}
        </ul>
    );
}
