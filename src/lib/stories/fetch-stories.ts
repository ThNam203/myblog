import { unstable_cache } from "next/cache";
import type { StoryGroup } from "@/interfaces/story";
import { createAdminClient } from "@/lib/supabase/server";
import { parseStoryRows } from "./story-schema";

export const STORIES_CACHE_TAG = "stories";

/**
 * All story groups, newest first, cached under the "stories" tag. Admin
 * mutations call revalidateTag(STORIES_CACHE_TAG) so the home page refreshes
 * without a redeploy. Throws on fetch/validation failure — no fallback data.
 */
export const fetchStories = unstable_cache(
    async (): Promise<StoryGroup[]> => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("story_groups")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw new Error(`Failed to fetch stories: ${error.message}`);
        return parseStoryRows(data ?? []);
    },
    ["stories"],
    { tags: [STORIES_CACHE_TAG] },
);
