import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/app/_components/container";
import { isValidLocale } from "@/i18n/config";
import { createAdminClient, createClient } from "@/lib/supabase/server";
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

    const ownerEmail = process.env.ADMIN_EMAIL;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!ownerEmail || !user?.email || user.email.toLowerCase() !== ownerEmail.toLowerCase()) {
        notFound();
    }

    // Read uncached so the admin always sees current data (the homepage uses
    // the tagged cache instead).
    const admin = createAdminClient();
    const { data, error } = await admin
        .from("story_groups")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw new Error(`Failed to load stories: ${error.message}`);

    const groups = parseStoryRows(data ?? []);

    return (
        <main>
            <Container>
                <h1 className="my-8 text-3xl font-bold tracking-tight">Stories admin</h1>
                <AdminStories groups={groups} />
            </Container>
        </main>
    );
}
