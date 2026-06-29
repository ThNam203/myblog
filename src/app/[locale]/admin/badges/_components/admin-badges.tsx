"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BadgeSeries, BadgeDefinition } from "@/lib/badges/types";
import { deleteSeries, deleteDefinition } from "@/lib/actions/badges";
import { SeriesForm } from "./series-form";
import { DefinitionForm } from "./definition-form";

type Props = {
    series: BadgeSeries[];
    definitions: BadgeDefinition[];
    earnedCounts: Record<string, number>;
};

type Panel = "series-new" | "series-edit" | "def-new" | "def-edit" | null;

export function AdminBadges({ series, definitions, earnedCounts }: Props) {
    const router = useRouter();
    const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(
        series[0]?.id ?? null,
    );
    const [panel, setPanel] = useState<Panel>(null);
    const [editingSeries, setEditingSeries] = useState<BadgeSeries | null>(null);
    const [editingDef, setEditingDef] = useState<BadgeDefinition | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const selectedDefs = definitions
        .filter((d) => d.seriesId === selectedSeriesId)
        .sort((a, b) => a.order - b.order);

    function refresh() {
        setPanel(null);
        setEditingSeries(null);
        setEditingDef(null);
        router.refresh();
    }

    function handleDeleteSeries(s: BadgeSeries) {
        if (!window.confirm(`Delete series "${s.id}"? All its badges will also be deleted.`)) return;
        setError(null);
        startTransition(async () => {
            const result = await deleteSeries(s.id);
            if (result.error) {
                setError(result.error);
            } else {
                if (selectedSeriesId === s.id) setSelectedSeriesId(series[0]?.id ?? null);
                router.refresh();
            }
        });
    }

    function handleDeleteDef(def: BadgeDefinition) {
        const count = earnedCounts[def.id] ?? 0;
        if (count > 0) {
            setError(`Cannot delete: ${count} user(s) have earned this badge`);
            return;
        }
        if (!window.confirm("Delete this badge?")) return;
        setError(null);
        startTransition(async () => {
            const result = await deleteDefinition(def.id);
            if (result.error) setError(result.error);
            else router.refresh();
        });
    }

    if (panel === "series-new") return <SeriesForm initial={null} onDone={refresh} />;
    if (panel === "series-edit" && editingSeries)
        return <SeriesForm initial={editingSeries} onDone={refresh} />;
    if ((panel === "def-new" || panel === "def-edit") && selectedSeriesId) {
        return (
            <DefinitionForm
                seriesId={selectedSeriesId}
                initial={panel === "def-edit" ? editingDef : null}
                onDone={refresh}
            />
        );
    }

    return (
        <div className="flex gap-6">
            {/* Series panel */}
            <div className="w-48 shrink-0">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">Series</span>
                    <button
                        type="button"
                        onClick={() => setPanel("series-new")}
                        className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    >
                        + New
                    </button>
                </div>
                <ul className="flex flex-col gap-1">
                    {series.map((s) => (
                        <li
                            key={s.id}
                            className={`group flex cursor-pointer items-center gap-1 rounded px-2 py-1.5 text-sm ${
                                selectedSeriesId === s.id
                                    ? "bg-neutral-100 font-medium dark:bg-neutral-800"
                                    : "hover:bg-neutral-50 dark:hover:bg-neutral-900"
                            }`}
                            onClick={() => setSelectedSeriesId(s.id)}
                        >
                            <span className="min-w-0 flex-1 truncate">{s.label.en}</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSeries(s);
                                    setPanel("series-edit");
                                }}
                                className="hidden text-xs text-neutral-400 hover:text-neutral-900 group-hover:block dark:hover:text-white"
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSeries(s);
                                }}
                                disabled={isPending}
                                className="hidden text-xs text-red-400 hover:text-red-600 group-hover:block"
                            >
                                Del
                            </button>
                        </li>
                    ))}
                    {series.length === 0 && (
                        <li className="text-xs text-neutral-400">No series yet.</li>
                    )}
                </ul>
            </div>

            {/* Definitions panel */}
            <div className="min-w-0 flex-1">
                {selectedSeriesId ? (
                    <>
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold">
                                Badges in &ldquo;{selectedSeriesId}&rdquo;
                            </span>
                            <button
                                type="button"
                                onClick={() => setPanel("def-new")}
                                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                            >
                                + New badge
                            </button>
                        </div>
                        {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
                        <ul className="flex flex-col gap-2">
                            {selectedDefs.map((def) => {
                                const count = earnedCounts[def.id] ?? 0;
                                return (
                                    <li
                                        key={def.id}
                                        className="flex items-center gap-3 rounded border border-neutral-300 p-2 dark:border-neutral-700"
                                    >
                                        {def.icon && (
                                            <img src={def.icon} alt="" className="h-8 w-8 object-contain" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            {def.label && (
                                                <p className="text-sm font-medium">
                                                    {def.label.en}
                                                </p>
                                            )}
                                            <p className="text-xs text-neutral-500">
                                                #{def.order} · {def.conditionKey} ≥{" "}
                                                {def.threshold} · {count} earned
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingDef(def);
                                                setPanel("def-edit");
                                            }}
                                            className="rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteDef(def)}
                                            disabled={isPending || count > 0}
                                            title={
                                                count > 0
                                                    ? `${count} user(s) earned this badge`
                                                    : undefined
                                            }
                                            className="rounded border border-red-300 px-2 py-1 text-xs text-red-500 disabled:opacity-40"
                                        >
                                            Delete
                                        </button>
                                    </li>
                                );
                            })}
                            {selectedDefs.length === 0 && (
                                <li className="text-xs text-neutral-400">
                                    No badges in this series yet.
                                </li>
                            )}
                        </ul>
                    </>
                ) : (
                    <p className="text-sm text-neutral-400">Select a series.</p>
                )}
            </div>
        </div>
    );
}
