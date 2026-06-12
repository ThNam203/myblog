"use server";

import { updateTag } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { STORIES_CACHE_TAG } from "@/lib/stories/fetch-stories";
import { storyGroupSchema } from "@/lib/stories/story-schema";

const STORIES_BUCKET = "stories";

// Bucket object paths are built from user input — keep them to one
// `<groupId>/<fileName>` segment pair of safe characters (no traversal).
const OBJECT_PATH_PATTERN = /^[a-z0-9][a-z0-9_-]*\/[a-z0-9][a-z0-9._-]*$/i;

async function requireOwner(): Promise<{ error?: string }> {
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

export type UploadTicket = {
    error?: string;
    /** Token for supabase.storage.from(bucket).uploadToSignedUrl(path, token, file) */
    token?: string;
    path?: string;
    /** Public URL the uploaded object will be served from. */
    publicUrl?: string;
};

export async function createUploadUrl(path: string): Promise<UploadTicket> {
    const owner = await requireOwner();
    if (owner.error) return { error: owner.error };

    if (!OBJECT_PATH_PATTERN.test(path)) return { error: `Invalid upload path: ${path}` };

    const admin = createAdminClient();
    const { data, error } = await admin.storage
        .from(STORIES_BUCKET)
        .createSignedUploadUrl(path, { upsert: true });
    if (error) return { error: error.message };

    const { publicUrl } = admin.storage.from(STORIES_BUCKET).getPublicUrl(path).data;
    return { token: data.token, path: data.path, publicUrl };
}

export async function saveStory(
    group: unknown,
    mode: "create" | "update",
): Promise<{ error?: string }> {
    const owner = await requireOwner();
    if (owner.error) return { error: owner.error };

    const parsed = storyGroupSchema.safeParse(group);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return { error: `Invalid story: ${issue.path.join(".")} ${issue.message}` };
    }

    const row = {
        id: parsed.data.id,
        title: parsed.data.title,
        cover: parsed.data.cover,
        items: parsed.data.items,
        created_at: parsed.data.createdAt,
        active_for_ms: parsed.data.activeForMs ?? null,
    };

    const admin = createAdminClient();
    const { error } =
        mode === "create"
            ? await admin.from("story_groups").insert(row)
            : await admin.from("story_groups").update(row).eq("id", row.id);
    if (error) return { error: error.message };

    updateTag(STORIES_CACHE_TAG);
    return {};
}

export async function deleteStory(groupId: string): Promise<{ error?: string }> {
    const owner = await requireOwner();
    if (owner.error) return { error: owner.error };

    const admin = createAdminClient();
    const { error } = await admin.from("story_groups").delete().eq("id", groupId);
    if (error) return { error: error.message };

    // Best-effort cleanup of the group's media; the row is already gone.
    const { data: objects } = await admin.storage.from(STORIES_BUCKET).list(groupId);
    if (objects?.length) {
        await admin.storage
            .from(STORIES_BUCKET)
            .remove(objects.map((object) => `${groupId}/${object.name}`));
    }

    updateTag(STORIES_CACHE_TAG);
    return {};
}
