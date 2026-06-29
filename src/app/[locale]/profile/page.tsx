import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProfileEditForm } from "@/app/_components/profile-edit-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isValidLocale, type Locale } from "@/i18n/config";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { parseBadgeSeriesRow, parseBadgeDefinitionRow } from "@/lib/badges/badge-schema";
import { BadgeShowcaseSelector } from "./_components/badge-showcase-selector";

type Props = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    if (!isValidLocale(locale)) return {};
    const dictionary = getDictionary(locale);
    return {
        title: `${dictionary.ui.profilePageMetaTitle} · ${dictionary.metadata.siteName}`,
    };
}

export default async function ProfilePage({ params }: Props) {
    const { locale } = await params;
    if (!isValidLocale(locale)) {
        notFound();
    }

    const dictionary = getDictionary(locale as Locale);
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}`);
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

    const meta = user.user_metadata as { display_name?: string } | undefined;
    const initialDisplayName =
        profile?.display_name ?? meta?.display_name ?? (user.email ? user.email.split("@")[0] : "");

    // Fetch badge data for showcase selector
    const admin = createAdminClient();
    const [
        { data: userBadgeRows },
        { data: defRows },
        { data: seriesRows },
        { data: showcaseRows },
    ] = await Promise.all([
        admin.from("user_badges").select("badge_definition_id").eq("user_id", user.id),
        admin.from("badge_definitions").select("*").order("order"),
        admin.from("badge_series").select("*").order("id"),
        supabase.from("user_badge_showcase").select("series_id, badge_definition_id").eq("user_id", user.id),
    ]);

    const allSeries = (seriesRows ?? []).map(parseBadgeSeriesRow);
    const allDefinitions = (defRows ?? []).map(parseBadgeDefinitionRow);
    const earnedDefIds = new Set((userBadgeRows ?? []).map((r) => r.badge_definition_id));
    const showcaseMap = new Map(
        (showcaseRows ?? []).map((r) => [r.series_id, r.badge_definition_id]),
    );

    const badgeGroups = allSeries
        .map((series) => {
            const badges = allDefinitions
                .filter((d) => d.seriesId === series.id)
                .map((d) => ({ definitionId: d.id, definition: d, earned: earnedDefIds.has(d.id) }));
            return {
                series,
                badges,
                showcasedDefinitionId: showcaseMap.get(series.id) ?? null,
            };
        })
        .filter((g) => g.badges.length > 0);

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                    {dictionary.ui.profilePageHeading}
                </h1>
                <Link
                    href={`/${locale}`}
                    className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline dark:hover:text-neutral-300"
                >
                    ← {dictionary.ui.headerTitle}
                </Link>
            </div>

            <ProfileEditForm
                locale={locale}
                initialDisplayName={initialDisplayName}
                email={user.email ?? null}
                labels={{
                    emailFieldLabel: dictionary.ui.profileEmailFieldLabel,
                    displayNameLabel: dictionary.ui.profileDisplayNameLabel,
                    emailHint: dictionary.ui.profileEmailHint,
                    save: dictionary.ui.profileSave,
                    saving: dictionary.ui.profileSaving,
                    saved: dictionary.ui.profileSaved,
                }}
            />

            <div className="mt-10">
                <h2 className="mb-4 text-xl font-semibold tracking-tight">Badges</h2>
                <p className="mb-4 text-sm text-neutral-500">
                    Choose one badge per series to display on your profile.
                </p>
                <BadgeShowcaseSelector groups={badgeGroups} locale={locale} />
            </div>
        </div>
    );
}
