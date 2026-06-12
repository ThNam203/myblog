import { z } from "zod";
import type { StoryGroup } from "@/interfaces/story";
import { assertStoriesValid } from "./story-sections";

const localizedSchema = z.object({ vi: z.string().min(1), en: z.string().min(1) });
const maybeLocalizedSchema = z.union([z.string().min(1), localizedSchema]);

const addressSchema = z.object({
    name: localizedSchema,
    link: maybeLocalizedSchema.optional(),
});

const postRefSchema = z.object({
    title: localizedSchema,
    link: maybeLocalizedSchema.optional(),
});

const itemBase = {
    id: z.string().min(1),
    caption: localizedSchema.optional(),
    address: addressSchema.optional(),
    post: postRefSchema.optional(),
};

const imageItemSchema = z.object({
    ...itemBase,
    type: z.literal("image"),
    src: z.string().min(1),
    durationMs: z.number().positive().optional(),
    music: z
        .object({
            src: z.string().min(1),
            startTime: z.number().min(0).optional(),
        })
        .optional(),
});

const videoItemSchema = z.object({
    ...itemBase,
    type: z.literal("video"),
    src: z.string().min(1),
    poster: z.string().min(1).optional(),
});

export const storyItemSchema = z.discriminatedUnion("type", [imageItemSchema, videoItemSchema]);

export const storyGroupSchema = z
    .object({
        id: z.string().min(1),
        title: localizedSchema,
        cover: z.string().min(1),
        items: z.array(storyItemSchema).min(1),
        createdAt: z
            .string()
            .refine((value) => !Number.isNaN(Date.parse(value)), "createdAt must be an ISO date"),
        activeForMs: z.number().positive().optional(),
    })
    .refine(
        (group) => new Set(group.items.map((item) => item.id)).size === group.items.length,
        "item ids must be unique within a group",
    );

export type StoryGroupInput = z.input<typeof storyGroupSchema>;

/** The subset of a `story_groups` row this module needs (snake_case, jsonb untyped). */
export type StoryGroupRowLike = {
    id: string;
    title: unknown;
    cover: string;
    items: unknown;
    created_at: string;
    active_for_ms: number | null;
};

export function parseStoryRow(row: StoryGroupRowLike): StoryGroup {
    return storyGroupSchema.parse({
        id: row.id,
        title: row.title,
        cover: row.cover,
        items: row.items,
        createdAt: row.created_at,
        activeForMs: row.active_for_ms ?? undefined,
    });
}

export function parseStoryRows(rows: StoryGroupRowLike[]): StoryGroup[] {
    const groups = rows.map(parseStoryRow);
    assertStoriesValid(groups);
    return groups;
}
