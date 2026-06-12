"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { StoryGroup } from "@/interfaces/story";
import { deleteStory } from "@/lib/actions/stories";
import { StoryForm } from "./story-form";

type Props = {
    groups: StoryGroup[];
};

export function AdminStories({ groups }: Props) {
    const router = useRouter();
    const [editing, setEditing] = useState<StoryGroup | null | "new">(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleDelete(group: StoryGroup) {
        if (!window.confirm(`Delete story "${group.id}" and its media? This cannot be undone.`)) {
            return;
        }
        setError(null);
        startTransition(async () => {
            const result = await deleteStory(group.id);
            if (result.error) setError(result.error);
            else router.refresh();
        });
    }

    if (editing !== null) {
        return (
            <StoryForm
                initialGroup={editing === "new" ? null : editing}
                onDone={() => {
                    setEditing(null);
                    router.refresh();
                }}
            />
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <button
                type="button"
                onClick={() => setEditing("new")}
                className="self-start rounded bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
            >
                + New story
            </button>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {groups.length === 0 && <p className="text-sm text-neutral-500">No stories yet.</p>}

            <ul className="flex flex-col gap-2">
                {groups.map((group) => (
                    <li
                        key={group.id}
                        className="flex items-center gap-3 rounded border border-neutral-300 p-2 dark:border-neutral-700"
                    >
                        <Image
                            src={group.cover}
                            alt=""
                            width={48}
                            height={48}
                            unoptimized
                            className="h-12 w-12 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{group.title.vi}</p>
                            <p className="text-xs text-neutral-500">
                                {group.id} · {group.items.length} item(s) ·{" "}
                                {new Date(group.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setEditing(group)}
                            className="rounded border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDelete(group)}
                            disabled={isPending}
                            className="rounded border border-red-300 px-3 py-1 text-sm text-red-500 disabled:opacity-50"
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
