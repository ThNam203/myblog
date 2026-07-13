"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import type { StoryGroup, StoryItem } from "@/interfaces/story";
import { saveStory } from "@/lib/actions/stories";
import { MusicPicker, type MusicValue } from "./music-picker";
import { compressImageToWebp, sanitizeFileName, uploadStoryMedia } from "./upload";

type DraftItem = {
    key: string;
    id: string;
    type: "image" | "video";
    src: string;
    poster: string;
    captionVi: string;
    captionEn: string;
    durationSec: string; // empty = use default; images only
    music: MusicValue | null;
    addressNameVi: string;
    addressNameEn: string;
    addressLink: string;
    postTitleVi: string;
    postTitleEn: string;
    postLinkVi: string;
    postLinkEn: string;
};

type Props = {
    initialGroup: StoryGroup | null;
    onDone: () => void;
};

function emptyItem(): DraftItem {
    return {
        key: crypto.randomUUID(),
        id: "",
        type: "image",
        src: "",
        poster: "",
        captionVi: "",
        captionEn: "",
        durationSec: "",
        music: null,
        addressNameVi: "",
        addressNameEn: "",
        addressLink: "",
        postTitleVi: "",
        postTitleEn: "",
        postLinkVi: "",
        postLinkEn: "",
    };
}

function linkToDraft(
    link: string | { vi: string; en: string } | undefined,
): { vi: string; en: string } {
    if (!link) return { vi: "", en: "" };
    if (typeof link === "string") return { vi: link, en: "" };
    return link;
}

function itemToDraft(item: StoryItem): DraftItem {
    const postLink = linkToDraft(item.post?.link);
    return {
        key: crypto.randomUUID(),
        id: item.id,
        type: item.type,
        src: item.src,
        poster: item.type === "video" ? (item.poster ?? "") : "",
        captionVi: item.caption?.vi ?? "",
        captionEn: item.caption?.en ?? "",
        durationSec:
            item.type === "image" && item.durationMs ? String(item.durationMs / 1000) : "",
        music:
            item.type === "image" && item.music
                ? { src: item.music.src, startTime: item.music.startTime ?? 0 }
                : null,
        addressNameVi: item.address?.name.vi ?? "",
        addressNameEn: item.address?.name.en ?? "",
        addressLink: typeof item.address?.link === "string" ? item.address.link : (item.address?.link?.vi ?? ""),
        postTitleVi: item.post?.title.vi ?? "",
        postTitleEn: item.post?.title.en ?? "",
        postLinkVi: postLink.vi,
        postLinkEn: postLink.en,
    };
}

// Single-author convenience: if only one locale is filled, mirror it.
function localized(vi: string, en: string): { vi: string; en: string } | undefined {
    if (!vi.trim() && !en.trim()) return undefined;
    return { vi: vi.trim() || en.trim(), en: en.trim() || vi.trim() };
}

function draftToItem(draft: DraftItem): Record<string, unknown> {
    const address = localized(draft.addressNameVi, draft.addressNameEn);
    const post = localized(draft.postTitleVi, draft.postTitleEn);
    const postLinkVi = draft.postLinkVi.trim();
    const postLinkEn = draft.postLinkEn.trim();
    const durationSec = Number(draft.durationSec);
    const durationMs =
        draft.durationSec.trim() && Number.isFinite(durationSec) && durationSec > 0
            ? Math.round(durationSec * 1000)
            : undefined;

    return {
        id: draft.id.trim(),
        type: draft.type,
        src: draft.src,
        caption: localized(draft.captionVi, draft.captionEn),
        address: address
            ? { name: address, link: draft.addressLink.trim() || undefined }
            : undefined,
        post: post
            ? {
                title: post,
                link: postLinkVi
                    ? postLinkEn && postLinkEn !== postLinkVi
                        ? { vi: postLinkVi, en: postLinkEn }
                        : postLinkVi
                    : undefined,
            }
            : undefined,
        ...(draft.type === "image"
            ? { music: draft.music ?? undefined, durationMs }
            : { poster: draft.poster || undefined }),
    };
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function toDatetimeLocal(iso: string): string {
    const date = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const inputClass =
    "rounded border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700";

export function StoryForm({ initialGroup, onDone }: Props) {
    const isEdit = initialGroup !== null;
    const [groupId, setGroupId] = useState(initialGroup?.id ?? "");
    const [titleVi, setTitleVi] = useState(initialGroup?.title.vi ?? "");
    const [titleEn, setTitleEn] = useState(initialGroup?.title.en ?? "");
    const [createdAt, setCreatedAt] = useState(
        toDatetimeLocal(initialGroup?.createdAt ?? new Date().toISOString()),
    );
    const [coverOverride, setCoverOverride] = useState("");
    const [items, setItems] = useState<DraftItem[]>(
        initialGroup ? initialGroup.items.map(itemToDraft) : [emptyItem()],
    );
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function updateItem(key: string, patch: Partial<DraftItem>) {
        setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
    }

    function moveItem(key: string, delta: -1 | 1) {
        setItems((prev) => {
            const index = prev.findIndex((item) => item.key === key);
            const target = index + delta;
            if (index < 0 || target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    }

    function removeItem(key: string) {
        setItems((prev) => prev.filter((item) => item.key !== key));
    }

    function itemFileName(
        draft: DraftItem,
        file: File,
        suffix: string,
        forcedExt?: string,
    ): string {
        const base = draft.id.trim() || `item-${items.findIndex((i) => i.key === draft.key) + 1}`;
        const ext = forcedExt ?? sanitizeFileName(file.name).split(".").pop() ?? "bin";
        return `${sanitizeFileName(base)}${suffix}.${ext}`;
    }

    async function handleUpload(
        draft: DraftItem,
        file: File,
        kind: "image" | "video" | "poster" | "cover",
    ) {
        if (!groupId.trim()) {
            setError("Set the story id before uploading media");
            return;
        }
        setError(null);
        setBusy(`Uploading ${file.name}…`);
        try {
            const isImage = kind !== "video";
            const data = isImage ? await compressImageToWebp(file) : file;
            const suffix = kind === "poster" ? "-poster" : kind === "cover" ? "-cover" : "";
            const name = itemFileName(draft, file, suffix, isImage ? "webp" : undefined);
            const url = await uploadStoryMedia(`${sanitizeFileName(groupId.trim())}/${name}`, data);
            if (kind === "cover") setCoverOverride(url);
            else if (kind === "poster") updateItem(draft.key, { poster: url });
            else updateItem(draft.key, { src: url });
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(null);
        }
    }

    function defaultCover(): string {
        for (const item of items) {
            if (item.type === "image" && item.src) return item.src;
            if (item.type === "video" && item.poster) return item.poster;
        }
        return "";
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        const cover = coverOverride || defaultCover();
        if (!cover) {
            setError("Upload at least one image (or a video poster) to use as the cover");
            return;
        }

        const group = {
            id: sanitizeFileName(groupId.trim()),
            title: localized(titleVi, titleEn),
            cover,
            items: items.map((draft, index) => ({
                ...draftToItem(draft),
                id: draft.id.trim() || `${sanitizeFileName(groupId.trim())}-${index + 1}`,
            })),
            createdAt: new Date(createdAt).toISOString(),
        };

        startTransition(async () => {
            const result = await saveStory(group, isEdit ? "update" : "create");
            if (result.error) setError(result.error);
            else onDone();
        });
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                    Story id (slug)
                    <input
                        className={inputClass}
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value)}
                        readOnly={isEdit}
                        required
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Created at
                    <input
                        type="datetime-local"
                        className={inputClass}
                        value={createdAt}
                        onChange={(e) => setCreatedAt(e.target.value)}
                        required
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Title (vi)
                    <input
                        className={inputClass}
                        value={titleVi}
                        onChange={(e) => {
                            setTitleVi(e.target.value);
                            if (!isEdit && !groupId) setGroupId(slugify(e.target.value));
                        }}
                        required
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Title (en)
                    <input
                        className={inputClass}
                        value={titleEn}
                        onChange={(e) => setTitleEn(e.target.value)}
                    />
                </label>
            </div>

            <div className="flex items-center gap-3 text-sm">
                <span>Cover:</span>
                {(coverOverride || defaultCover()) && (
                    <Image
                        src={coverOverride || defaultCover()}
                        alt="cover"
                        width={48}
                        height={48}
                        unoptimized
                        className="h-12 w-12 rounded-full object-cover"
                    />
                )}
                <label className="cursor-pointer underline">
                    {coverOverride ? "Replace override" : "Override (defaults to first image)"}
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleUpload(items[0] ?? emptyItem(), file, "cover");
                            e.target.value = "";
                        }}
                    />
                </label>
            </div>

            <div className="flex flex-col gap-4">
                {items.map((item, index) => (
                    <fieldset
                        key={item.key}
                        className="flex flex-col gap-3 rounded border border-neutral-300 p-3 dark:border-neutral-700"
                    >
                        <legend className="flex items-center gap-2 px-1 text-sm font-medium">
                            Item {index + 1}
                            <button type="button" onClick={() => moveItem(item.key, -1)} aria-label="Move up">
                                ↑
                            </button>
                            <button type="button" onClick={() => moveItem(item.key, 1)} aria-label="Move down">
                                ↓
                            </button>
                            {items.length > 1 && (
                                <button
                                    type="button"
                                    className="text-red-500"
                                    onClick={() => removeItem(item.key)}
                                >
                                    Remove
                                </button>
                            )}
                        </legend>

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <select
                                className={inputClass}
                                value={item.type}
                                onChange={(e) =>
                                    updateItem(item.key, {
                                        type: e.target.value as "image" | "video",
                                        src: "",
                                        poster: "",
                                        music: null,
                                        durationSec: "",
                                    })
                                }
                            >
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                            </select>
                            <input
                                className={inputClass}
                                placeholder="item id (auto)"
                                value={item.id}
                                onChange={(e) => updateItem(item.key, { id: e.target.value })}
                            />
                            <label className="cursor-pointer underline">
                                {item.src ? "Replace file" : `Upload ${item.type}`}
                                <input
                                    type="file"
                                    accept={item.type === "image" ? "image/*" : "video/mp4"}
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) void handleUpload(item, file, item.type);
                                        e.target.value = "";
                                    }}
                                />
                            </label>
                            {item.type === "video" && (
                                <label className="cursor-pointer underline">
                                    {item.poster ? "Replace poster" : "Upload poster"}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) void handleUpload(item, file, "poster");
                                            e.target.value = "";
                                        }}
                                    />
                                </label>
                            )}
                            {item.src &&
                                (item.type === "image" ? (
                                    <Image
                                        src={item.src}
                                        alt=""
                                        width={40}
                                        height={40}
                                        unoptimized
                                        className="h-10 w-10 rounded object-cover"
                                    />
                                ) : (
                                    <span className="text-green-600">video uploaded ✓</span>
                                ))}
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <input
                                className={inputClass}
                                placeholder="Caption (vi)"
                                value={item.captionVi}
                                onChange={(e) =>
                                    updateItem(item.key, { captionVi: e.target.value })
                                }
                            />
                            <input
                                className={inputClass}
                                placeholder="Caption (en)"
                                value={item.captionEn}
                                onChange={(e) =>
                                    updateItem(item.key, { captionEn: e.target.value })
                                }
                            />
                        </div>

                        {item.type === "image" && (
                            <>
                                <label className="flex items-center gap-2 text-sm">
                                    Display duration
                                    <input
                                        type="number"
                                        min={1}
                                        step="any"
                                        placeholder="20"
                                        className={`${inputClass} w-20`}
                                        value={item.durationSec}
                                        onChange={(e) =>
                                            updateItem(item.key, { durationSec: e.target.value })
                                        }
                                    />
                                    <span className="text-neutral-500">
                                        seconds (default 20)
                                    </span>
                                </label>
                                <MusicPicker
                                    value={item.music}
                                    onChange={(music) => updateItem(item.key, { music })}
                                />
                            </>
                        )}

                        <details>
                            <summary className="cursor-pointer text-sm text-neutral-500">
                                Address / post links
                            </summary>
                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <input
                                    className={inputClass}
                                    placeholder="Address name (vi)"
                                    value={item.addressNameVi}
                                    onChange={(e) =>
                                        updateItem(item.key, { addressNameVi: e.target.value })
                                    }
                                />
                                <input
                                    className={inputClass}
                                    placeholder="Address name (en)"
                                    value={item.addressNameEn}
                                    onChange={(e) =>
                                        updateItem(item.key, { addressNameEn: e.target.value })
                                    }
                                />
                                <input
                                    className={inputClass}
                                    placeholder="Address link (map URL)"
                                    value={item.addressLink}
                                    onChange={(e) =>
                                        updateItem(item.key, { addressLink: e.target.value })
                                    }
                                />
                                <input
                                    className={inputClass}
                                    placeholder="Post title (vi)"
                                    value={item.postTitleVi}
                                    onChange={(e) =>
                                        updateItem(item.key, { postTitleVi: e.target.value })
                                    }
                                />
                                <input
                                    className={inputClass}
                                    placeholder="Post title (en)"
                                    value={item.postTitleEn}
                                    onChange={(e) =>
                                        updateItem(item.key, { postTitleEn: e.target.value })
                                    }
                                />
                                <div className="flex flex-col gap-2">
                                    <input
                                        className={inputClass}
                                        placeholder="Post link (vi or single URL)"
                                        value={item.postLinkVi}
                                        onChange={(e) =>
                                            updateItem(item.key, { postLinkVi: e.target.value })
                                        }
                                    />
                                    <input
                                        className={inputClass}
                                        placeholder="Post link (en, optional)"
                                        value={item.postLinkEn}
                                        onChange={(e) =>
                                            updateItem(item.key, { postLinkEn: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                        </details>
                    </fieldset>
                ))}
            </div>

            <button
                type="button"
                className="self-start rounded border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
                onClick={() => setItems((prev) => [...prev, emptyItem()])}
            >
                + Add item
            </button>

            {busy && <p className="text-sm text-neutral-500">{busy}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={isPending || busy !== null}
                    className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                >
                    {isPending ? "Saving…" : isEdit ? "Update story" : "Create story"}
                </button>
                <button
                    type="button"
                    onClick={onDone}
                    className="rounded border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
