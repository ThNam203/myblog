"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";

async function requireOwner(): Promise<{ error?: string }> {
    if (process.env.NODE_ENV === "development") return {};

    const ownerEmail = process.env.ADMIN_EMAIL;
    if (!ownerEmail) return { error: "ADMIN_EMAIL is not configured" };

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || user.email.toLowerCase() !== ownerEmail.toLowerCase()) {
        return { error: "Not authorized" };
    }
    return {};
}

// ── Series ────────────────────────────────────────────────────────────────────

export type SeriesInput = {
    id: string;
    label: { en: string; vi: string };
};

export async function createSeries(data: SeriesInput): Promise<{ error?: string }> {
    const auth = await requireOwner();
    if (auth.error) return auth;

    const admin = createAdminClient();
    const { error } = await admin.from("badge_series").insert({ id: data.id, label: data.label });
    if (error) return { error: error.message };
    return {};
}

export type SeriesUpdateInput = {
    label: { en: string; vi: string };
};

export async function updateSeries(
    id: string,
    data: SeriesUpdateInput,
): Promise<{ error?: string }> {
    const auth = await requireOwner();
    if (auth.error) return auth;

    const admin = createAdminClient();
    const { error } = await admin.from("badge_series").update({ label: data.label }).eq("id", id);
    if (error) return { error: error.message };
    return {};
}

export async function deleteSeries(id: string): Promise<{ error?: string }> {
    const auth = await requireOwner();
    if (auth.error) return auth;

    const admin = createAdminClient();

    // Get all definition IDs in this series first
    const { data: defs, error: defsError } = await admin
        .from("badge_definitions")
        .select("id")
        .eq("series_id", id);
    if (defsError) return { error: defsError.message };

    if (defs && defs.length > 0) {
        const defIds = defs.map((d) => d.id);
        const { count, error: countError } = await admin
            .from("user_badges")
            .select("*", { count: "exact", head: true })
            .in("badge_definition_id", defIds);
        if (countError) return { error: countError.message };
        if (count && count > 0) {
            return { error: `Cannot delete: ${count} user(s) have earned badges in this series` };
        }
    }

    const { error } = await admin.from("badge_series").delete().eq("id", id);
    if (error) return { error: error.message };
    return {};
}

// ── Definitions ───────────────────────────────────────────────────────────────

export type DefinitionInput = {
    seriesId: string;
    order: number;
    label: { en: string; vi: string } | null;
    description: { en: string; vi: string };
    icon: string | null;
    conditionKey: "posts_read" | "posts_read_all" | "comments_posted";
    threshold: number;
};

export async function createDefinition(data: DefinitionInput): Promise<{ error?: string }> {
    const auth = await requireOwner();
    if (auth.error) return auth;

    if (!data.label && !data.icon) {
        return { error: "At least one of label or icon must be provided" };
    }

    const admin = createAdminClient();
    const { error } = await admin.from("badge_definitions").insert({
        series_id: data.seriesId,
        order: data.order,
        label: data.label,
        description: data.description,
        icon: data.icon,
        condition_key: data.conditionKey,
        threshold: data.threshold,
    });
    if (error) return { error: error.message };
    return {};
}

export type DefinitionUpdateInput = Omit<DefinitionInput, "seriesId">;

export async function updateDefinition(
    id: string,
    data: DefinitionUpdateInput,
): Promise<{ error?: string }> {
    const auth = await requireOwner();
    if (auth.error) return auth;

    if (!data.label && !data.icon) {
        return { error: "At least one of label or icon must be provided" };
    }

    const admin = createAdminClient();
    const { error } = await admin
        .from("badge_definitions")
        .update({
            order: data.order,
            label: data.label,
            description: data.description,
            icon: data.icon,
            condition_key: data.conditionKey,
            threshold: data.threshold,
        })
        .eq("id", id);
    if (error) return { error: error.message };
    return {};
}

export async function deleteDefinition(id: string): Promise<{ error?: string }> {
    const auth = await requireOwner();
    if (auth.error) return auth;

    const admin = createAdminClient();

    const { count, error: countError } = await admin
        .from("user_badges")
        .select("*", { count: "exact", head: true })
        .eq("badge_definition_id", id);
    if (countError) return { error: countError.message };
    if (count && count > 0) {
        return { error: `Cannot delete: ${count} user(s) have earned this badge` };
    }

    const { error } = await admin.from("badge_definitions").delete().eq("id", id);
    if (error) return { error: error.message };
    return {};
}

// ── Grant / Revoke ────────────────────────────────────────────────────────────

export async function grantBadge(
    userId: string,
    badgeDefinitionId: string,
): Promise<{ error?: string }> {
    const auth = await requireOwner();
    if (auth.error) return auth;

    const admin = createAdminClient();
    const { error } = await admin
        .from("user_badges")
        .upsert(
            { user_id: userId, badge_definition_id: badgeDefinitionId },
            { onConflict: "user_id,badge_definition_id", ignoreDuplicates: true },
        );
    if (error) return { error: error.message };
    return {};
}

export async function revokeBadge(
    userId: string,
    badgeDefinitionId: string,
): Promise<{ error?: string }> {
    const auth = await requireOwner();
    if (auth.error) return auth;

    const admin = createAdminClient();
    const { error } = await admin
        .from("user_badges")
        .delete()
        .eq("user_id", userId)
        .eq("badge_definition_id", badgeDefinitionId);
    if (error) return { error: error.message };
    return {};
}
