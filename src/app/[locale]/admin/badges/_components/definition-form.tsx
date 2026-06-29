"use client";

import { useState, useTransition } from "react";
import type { BadgeDefinition } from "@/lib/badges/types";
import { createDefinition, updateDefinition } from "@/lib/actions/badges";

type Props = {
    seriesId: string;
    initial: BadgeDefinition | null;
    onDone: () => void;
};

export function DefinitionForm({ seriesId, initial, onDone }: Props) {
    const isEdit = initial !== null;
    const [order, setOrder] = useState(String(initial?.order ?? ""));
    const [icon, setIcon] = useState(initial?.icon ?? "");
    const [labelEn, setLabelEn] = useState(initial?.label?.en ?? "");
    const [labelVi, setLabelVi] = useState(initial?.label?.vi ?? "");
    const [descEn, setDescEn] = useState(initial?.description.en ?? "");
    const [descVi, setDescVi] = useState(initial?.description.vi ?? "");
    const [conditionKey, setConditionKey] = useState<"posts_read" | "posts_read_all" | "comments_posted" | "manual">(
        initial?.conditionKey ?? "posts_read",
    );
    const [threshold, setThreshold] = useState(String(initial?.threshold ?? ""));
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const iconVal = icon.trim() || null;
        const labelVal =
            labelEn.trim() || labelVi.trim()
                ? { en: labelEn.trim(), vi: labelVi.trim() }
                : null;

        if (!iconVal && !labelVal) {
            setError("Provide at least an icon or a label");
            return;
        }

        startTransition(async () => {
            const data = {
                order: parseInt(order, 10),
                label: labelVal,
                description: { en: descEn.trim(), vi: descVi.trim() },
                icon: iconVal,
                conditionKey,
                threshold: conditionKey === "posts_read_all" || conditionKey === "manual" ? 0 : parseInt(threshold, 10),
            };
            const result = isEdit
                ? await updateDefinition(initial.id, data)
                : await createDefinition({ seriesId, ...data });
            if (result.error) setError(result.error);
            else onDone();
        });
    }

    const inputClass =
        "rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900";

    return (
        <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-3">
            <h2 className="font-semibold">{isEdit ? "Edit badge" : "New badge"}</h2>

            <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                    Order
                    <input
                        required
                        type="number"
                        min={1}
                        value={order}
                        onChange={(e) => setOrder(e.target.value)}
                        className={inputClass}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Icon path (optional)
                    <input
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        placeholder="/badges/bookworm.png"
                        className={inputClass}
                    />
                </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                    Label EN (optional)
                    <input
                        value={labelEn}
                        onChange={(e) => setLabelEn(e.target.value)}
                        placeholder="Bookworm"
                        className={inputClass}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Label VI (optional)
                    <input
                        value={labelVi}
                        onChange={(e) => setLabelVi(e.target.value)}
                        placeholder="Mọt sách"
                        className={inputClass}
                    />
                </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                    Description EN
                    <input
                        required
                        value={descEn}
                        onChange={(e) => setDescEn(e.target.value)}
                        placeholder="Read 5 posts"
                        className={inputClass}
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Description VI
                    <input
                        required
                        value={descVi}
                        onChange={(e) => setDescVi(e.target.value)}
                        placeholder="Đọc 5 bài"
                        className={inputClass}
                    />
                </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                    Condition
                    <select
                        value={conditionKey}
                        onChange={(e) =>
                            setConditionKey(e.target.value as typeof conditionKey)
                        }
                        className={inputClass}
                    >
                        <option value="posts_read">posts_read</option>
                        <option value="posts_read_all">posts_read_all (read every post)</option>
                        <option value="comments_posted">comments_posted</option>
                        <option value="manual">manual (admin grant only)</option>
                    </select>
                </label>
                {conditionKey !== "posts_read_all" && conditionKey !== "manual" && (
                    <label className="flex flex-col gap-1 text-sm">
                        Threshold
                        <input
                            required
                            type="number"
                            min={1}
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            className={inputClass}
                        />
                    </label>
                )}
            </div>

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
