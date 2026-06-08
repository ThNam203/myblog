import type { StoryGroup } from "@/interfaces/story";
import { isFilledLocalized } from "./localized";

export const DEFAULT_ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

function byCreatedAtDesc(a: StoryGroup, b: StoryGroup): number {
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

function windowFor(group: StoryGroup, defaultWindowMs: number): number {
    return typeof group.activeForMs === "number" ? group.activeForMs : defaultWindowMs;
}

export function splitStorySections(
    groups: StoryGroup[],
    now: number,
    defaultWindowMs: number = DEFAULT_ACTIVE_WINDOW_MS,
): { active: StoryGroup[]; expired: StoryGroup[] } {
    const active: StoryGroup[] = [];
    const expired: StoryGroup[] = [];
    for (const group of groups) {
        const elapsed = now - Date.parse(group.createdAt);
        if (elapsed >= windowFor(group, defaultWindowMs)) {
            expired.push(group);
        } else {
            active.push(group);
        }
    }
    active.sort(byCreatedAtDesc);
    expired.sort(byCreatedAtDesc);
    return { active, expired };
}

export function assertStoriesValid(groups: StoryGroup[]): void {
    const seenGroupIds = new Set<string>();
    for (const group of groups) {
        if (seenGroupIds.has(group.id)) {
            throw new Error(`Invalid stories: duplicate group id "${group.id}"`);
        }
        seenGroupIds.add(group.id);

        if (group.items.length === 0) {
            throw new Error(`Invalid stories: group "${group.id}" has no items`);
        }

        const seenItemIds = new Set<string>();
        for (const item of group.items) {
            const itemId = item.id;
            if (seenItemIds.has(itemId)) {
                throw new Error(
                    `Invalid stories: duplicate item id "${itemId}" in group "${group.id}"`,
                );
            }
            seenItemIds.add(itemId);
            // Runtime guard against malformed data (e.g. authored via untyped JSON);
            // the static union makes this branch `never`, so widen before reading.
            const itemType: string = item.type;
            if (itemType !== "image" && itemType !== "video") {
                throw new Error(`Invalid stories: item "${itemId}" has unknown type`);
            }
            if (item.address && !isFilledLocalized(item.address.name)) {
                throw new Error(`Invalid stories: item "${itemId}" address name needs vi + en`);
            }
            if (item.post && !isFilledLocalized(item.post.title)) {
                throw new Error(`Invalid stories: item "${itemId}" post title needs vi + en`);
            }
        }
    }
}
