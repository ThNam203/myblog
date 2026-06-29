"use client";

import { useState, useTransition } from "react";
import type { BadgeSeries } from "@/lib/badges/types";
import { createSeries, updateSeries } from "@/lib/actions/badges";

type Props = {
    initial: BadgeSeries | null;
    onDone: () => void;
};

export function SeriesForm({ initial, onDone }: Props) {
    const isEdit = initial !== null;
    const [id, setId] = useState(initial?.id ?? "");
    const [labelEn, setLabelEn] = useState(initial?.label.en ?? "");
    const [labelVi, setLabelVi] = useState(initial?.label.vi ?? "");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            const label = { en: labelEn.trim(), vi: labelVi.trim() };
            const result = isEdit
                ? await updateSeries(initial.id, { label })
                : await createSeries({ id: id.trim(), label });
            if (result.error) setError(result.error);
            else onDone();
        });
    }

    const inputClass =
        "rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900";

    return (
        <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-3">
            <h2 className="font-semibold">{isEdit ? "Edit series" : "New series"}</h2>
            {!isEdit && (
                <label className="flex flex-col gap-1 text-sm">
                    ID (slug, cannot change later)
                    <input
                        required
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        pattern="[a-z0-9_-]+"
                        placeholder="reading"
                        className={inputClass}
                    />
                </label>
            )}
            <label className="flex flex-col gap-1 text-sm">
                Label (EN)
                <input
                    required
                    value={labelEn}
                    onChange={(e) => setLabelEn(e.target.value)}
                    placeholder="Reading"
                    className={inputClass}
                />
            </label>
            <label className="flex flex-col gap-1 text-sm">
                Label (VI)
                <input
                    required
                    value={labelVi}
                    onChange={(e) => setLabelVi(e.target.value)}
                    placeholder="Đọc sách"
                    className={inputClass}
                />
            </label>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded bg-neutral-900 px-4 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                >
                    {isPending ? "Saving…" : "Save"}
                </button>
                <button
                    type="button"
                    onClick={onDone}
                    className="rounded border border-neutral-300 px-4 py-1.5 text-sm dark:border-neutral-700"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
