import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import { createAdminClient } from "@/lib/supabase/server";
import { parseStoryRows } from "@/lib/stories/story-schema";
import { AdminStories } from "./_components/admin-stories";

export const metadata: Metadata = {
    title: "Stories admin",
    robots: { index: false, follow: false },
};

type Props = {
    params: Promise<{ locale: string }>;
};

export default async function AdminStoriesPage({ params }: Props) {
    const { locale } = await params;
    if (!isValidLocale(locale)) notFound();

    // Auth handled by admin layout. Read uncached so admin always sees current data.
    const admin = createAdminClient();
    const { data, error } = await admin
        .from("story_groups")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw new Error(`Failed to load stories: ${error.message}`);

    const groups = parseStoryRows(data ?? []);

    return (
        <main>
            <h1 className="mb-6 text-3xl font-bold tracking-tight">Stories</h1>
            <AdminStories groups={groups} />
        </main>
    );
}
