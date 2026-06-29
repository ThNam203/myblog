"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BadgeSeries, BadgeDefinition } from "@/lib/badges/types";
import { setShowcaseBadge } from "@/lib/actions/badges";

type BadgeItem = {
    definitionId: string;
    definition: BadgeDefinition;
    earned: boolean;
};

type SeriesGroup = {
    series: BadgeSeries;
    badges: BadgeItem[];
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
        return <p className="text-sm text-neutral-400">No badges available yet.</p>;
    }

    function handleChange(seriesId: string, definitionId: string | null) {
        startTransition(async () => {
            await setShowcaseBadge(seriesId, definitionId);
            router.refresh();
        });
    }

    return (
        <div className="flex flex-col gap-8">
            {groups.map(({ series, badges, showcasedDefinitionId }) => (
                <div key={series.id}>
                    <p className="text-sm font-semibold">{series.label[lang]}</p>
                    <p className="mb-3 mt-0.5 text-xs text-neutral-400">
                        {lang === "vi"
                            ? "Chỉ có thể hiển thị một huy hiệu mỗi loại. Nhấn lại để bỏ chọn."
                            : "Only one badge per series can be displayed. Click again to deselect."}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {badges.map(({ definitionId, definition, earned }) => {
                            const isSelected = showcasedDefinitionId === definitionId;
                            return (
                                <div key={definitionId} className="group relative">
                                    <button
                                        type="button"
                                        disabled={!earned || isPending}
                                        onClick={() => {
                                            if (!earned) return;
                                            handleChange(series.id, isSelected ? null : definitionId);
                                        }}
                                        className={[
                                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                                            isSelected
                                                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                                                : earned
                                                  ? "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700"
                                                  : "cursor-not-allowed border-neutral-200 opacity-40 dark:border-neutral-800",
                                        ].join(" ")}
                                    >
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
                                    </button>
                                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-neutral-100 dark:text-neutral-900">
                                        {definition.description[lang]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
