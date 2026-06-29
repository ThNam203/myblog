import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/i18n/config";
import { createAdminClient } from "@/lib/supabase/server";
import { parseBadgeSeriesRow, parseBadgeDefinitionRow } from "@/lib/badges/badge-schema";
import type { AdminUser, AdminUserBadge } from "./_components/admin-users";
import { AdminUsers } from "./_components/admin-users";

export const metadata: Metadata = {
    title: "Users admin",
    robots: { index: false, follow: false },
};

type Props = { params: Promise<{ locale: string }> };

export default async function AdminUsersPage({ params }: Props) {
    const { locale } = await params;
    if (!isValidLocale(locale)) notFound();

    const admin = createAdminClient();

    const [
        { data: authData },
        { data: profileRows },
        { data: userBadgeRows },
        { data: defRows },
        { data: seriesRows },
    ] = await Promise.all([
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        admin.from("profiles").select("id, display_name"),
        admin.from("user_badges").select("*").order("granted_at", { ascending: false }),
        admin.from("badge_definitions").select("*").order("order"),
        admin.from("badge_series").select("*").order("id"),
    ]);

    const allSeries = (seriesRows ?? []).map(parseBadgeSeriesRow);
    const allDefinitions = (defRows ?? []).map(parseBadgeDefinitionRow);

    const profileMap = new Map((profileRows ?? []).map((p) => [p.id, p.display_name]));
    const seriesMap = new Map(allSeries.map((s) => [s.id, s]));
    const defMap = new Map(allDefinitions.map((d) => [d.id, d]));

    const userBadgesMap = new Map<string, AdminUserBadge[]>();
    for (const row of userBadgeRows ?? []) {
        const definition = defMap.get(row.badge_definition_id);
        if (!definition) continue;
        const series = seriesMap.get(definition.seriesId);
        if (!series) continue;
        const badge: AdminUserBadge = {
            userBadgeId: row.id,
            grantedAt: row.granted_at,
            definition,
            series,
        };
        const list = userBadgesMap.get(row.user_id) ?? [];
        list.push(badge);
        userBadgesMap.set(row.user_id, list);
    }

    const users: AdminUser[] = (authData?.users ?? [])
        .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
        .map((u) => ({
            id: u.id,
            email: u.email ?? "",
            displayName: profileMap.get(u.id) ?? "",
            createdAt: u.created_at,
            badges: userBadgesMap.get(u.id) ?? [],
        }));

    return (
        <main>
            <h1 className="mb-6 text-3xl font-bold tracking-tight">Users</h1>
            <AdminUsers users={users} allSeries={allSeries} allDefinitions={allDefinitions} />
        </main>
    );
}
