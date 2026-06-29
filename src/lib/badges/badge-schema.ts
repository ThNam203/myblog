import { z } from "zod";
import type { BadgeSeries, BadgeDefinition, UserBadgeRow } from "./types";

const localizedSchema = z.object({ en: z.string(), vi: z.string() });

export const conditionKeySchema = z.enum(["posts_read", "comments_posted"]);

const badgeSeriesRowSchema = z.object({
    id: z.string().min(1),
    label: localizedSchema,
});

const badgeDefinitionRowSchema = z.object({
    id: z.string(),
    series_id: z.string().min(1),
    order: z.number().int().positive(),
    label: localizedSchema.nullable(),
    description: localizedSchema,
    icon: z.string().nullable(),
    condition_key: conditionKeySchema,
    threshold: z.number().int().positive(),
});

const userBadgeRowSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    badge_definition_id: z.string(),
    granted_at: z.string(),
});

export function parseBadgeSeriesRow(row: unknown): BadgeSeries {
    return badgeSeriesRowSchema.parse(row);
}

export function parseBadgeDefinitionRow(row: unknown): BadgeDefinition {
    const parsed = badgeDefinitionRowSchema.parse(row);
    return {
        id: parsed.id,
        seriesId: parsed.series_id,
        order: parsed.order,
        label: parsed.label,
        description: parsed.description,
        icon: parsed.icon,
        conditionKey: parsed.condition_key,
        threshold: parsed.threshold,
    };
}

export function parseUserBadgeRow(row: unknown): UserBadgeRow {
    const parsed = userBadgeRowSchema.parse(row);
    return {
        id: parsed.id,
        userId: parsed.user_id,
        badgeDefinitionId: parsed.badge_definition_id,
        grantedAt: parsed.granted_at,
    };
}
