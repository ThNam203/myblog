"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BadgeSeries, BadgeDefinition } from "@/lib/badges/types";
import { setShowcaseBadge } from "@/lib/actions/badges";

type EarnedBadge = {
    definitionId: string;
    definition: BadgeDefinition;
};

type SeriesGroup = {
    series: BadgeSeries;
    earned: EarnedBadge[];
    showcasedDefinitionId: string | null;
};

type Props = {
    groups: SeriesGroup[];
    locale: string;
};

export function BadgeShowcaseSelector({ groups, locale }: Props) {
    const lang = locale === "vi" ? "vi" : "en";
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    if (groups.length === 0) {
        return (
            <p className="text-sm text-neutral-400">No badges earned yet.</p>
        );
    }

    function handleChange(seriesId: string, value: string) {
        startTransition(async () => {
            await setShowcaseBadge(seriesId, value === "" ? null : value);
            router.refresh();
        });
    }

    return (
        <div className="flex flex-col gap-6">
            {groups.map(({ series, earned, showcasedDefinitionId }) => (
                <div key={series.id}>
                    <p className="mb-2 text-sm font-semibold">{series.label[lang]}</p>
                    <div className="flex flex-wrap gap-3">
                        {/* "None" option */}
                        <label
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                showcasedDefinitionId === null
                                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                                    : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700"
                            }`}
                        >
                            <input
                                type="radio"
                                name={`showcase-${series.id}`}
                                value=""
                                checked={showcasedDefinitionId === null}
                                onChange={() => handleChange(series.id, "")}
                                disabled={isPending}
                                className="sr-only"
                            />
                            <span className="text-neutral-400">None</span>
                        </label>

                        {/* Earned badges */}
                        {earned.map(({ definitionId, definition }) => (
                            <div key={definitionId} className="group relative">
                                <label
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                        showcasedDefinitionId === definitionId
                                            ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                                            : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name={`showcase-${series.id}`}
                                        value={definitionId}
                                        checked={showcasedDefinitionId === definitionId}
                                        onChange={() => handleChange(series.id, definitionId)}
                                        disabled={isPending}
                                        className="sr-only"
                                    />
                                    {definition.icon && (
                                        <img
                                            src={definition.icon}
                                            alt=""
                                            className="h-5 w-5 object-contain"
                                        />
                                    )}
                                    {definition.label && (
                                        <span>{definition.label[lang]}</span>
                                    )}
                                </label>
                                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-neutral-100 dark:text-neutral-900">
                                    {definition.description[lang]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
