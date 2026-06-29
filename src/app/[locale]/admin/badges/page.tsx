import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import { createAdminClient } from "@/lib/supabase/server";
import { parseBadgeSeriesRow, parseBadgeDefinitionRow } from "@/lib/badges/badge-schema";
import { AdminBadges } from "./_components/admin-badges";

export const metadata: Metadata = {
    title: "Badges admin",
    robots: { index: false, follow: false },
};

type Props = { params: Promise<{ locale: string }> };

export default async function AdminBadgesPage({ params }: Props) {
    const { locale } = await params;
    if (!isValidLocale(locale)) notFound();

    const admin = createAdminClient();

    const [
        { data: seriesRows, error: seriesError },
        { data: defRows, error: defError },
        { data: earnedRows, error: earnedError },
    ] = await Promise.all([
        admin.from("badge_series").select("*").order("id"),
        admin.from("badge_definitions").select("*").order("series_id").order("order"),
        admin.from("user_badges").select("badge_definition_id"),
    ]);

    if (seriesError) throw new Error(`Failed to load series: ${seriesError.message}`);
    if (defError) throw new Error(`Failed to load definitions: ${defError.message}`);
    if (earnedError) throw new Error(`Failed to load earned counts: ${earnedError.message}`);

    const series = (seriesRows ?? []).map(parseBadgeSeriesRow);
    const definitions = (defRows ?? []).map(parseBadgeDefinitionRow);

    const earnedCounts: Record<string, number> = {};
    for (const row of earnedRows ?? []) {
        earnedCounts[row.badge_definition_id] =
            (earnedCounts[row.badge_definition_id] ?? 0) + 1;
    }

    return (
        <main>
            <h1 className="mb-6 text-3xl font-bold tracking-tight">Badges</h1>
            <AdminBadges series={series} definitions={definitions} earnedCounts={earnedCounts} />
        </main>
    );
}
