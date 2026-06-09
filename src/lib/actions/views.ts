"use server";

import { createAdminClient } from "@/lib/supabase/server";

// Bump the view counter for a post. Slug comes from the rendered page, but the
// action is publicly callable, so cap the length to avoid junk rows.
export async function recordPostView(postSlug: string): Promise<void> {
    if (!postSlug || postSlug.length > 200) return;
    const admin = createAdminClient();
    await admin.rpc("increment_post_views", { slug: postSlug });
}
