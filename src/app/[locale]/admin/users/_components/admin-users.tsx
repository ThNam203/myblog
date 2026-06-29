"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BadgeSeries, BadgeDefinition } from "@/lib/badges/types";
import { grantBadge, revokeBadge } from "@/lib/actions/badges";

export type AdminUserBadge = {
    userBadgeId: string;
    grantedAt: string;
    definition: BadgeDefinition;
    series: BadgeSeries;
};

export type AdminUser = {
    id: string;
    email: string;
    displayName: string;
    createdAt: string;
    badges: AdminUserBadge[];
};

type Props = {
    users: AdminUser[];
    allSeries: BadgeSeries[];
    allDefinitions: BadgeDefinition[];
};

export function AdminUsers({ users, allSeries, allDefinitions }: Props) {
    const router = useRouter();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [grantSeriesId, setGrantSeriesId] = useState<string>("");
    const [grantDefId, setGrantDefId] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleGrant(user: AdminUser) {
        if (!grantDefId) return;
        setError(null);
        startTransition(async () => {
            const result = await grantBadge(user.id, grantDefId);
            if (result.error) {
                setError(result.error);
            } else {
                setGrantSeriesId("");
                setGrantDefId("");
                router.refresh();
            }
        });
    }

    function handleRevoke(userId: string, badgeDefinitionId: string) {
        if (!window.confirm("Revoke this badge?")) return;
        setError(null);
        startTransition(async () => {
            const result = await revokeBadge(userId, badgeDefinitionId);
            if (result.error) setError(result.error);
            else router.refresh();
        });
    }

    const defsForSeries = allDefinitions
        .filter((d) => d.seriesId === grantSeriesId)
        .sort((a, b) => a.order - b.order);

    const selectClass =
        "rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900";

    return (
        <div className="flex flex-col gap-2">
            {error && <p className="text-sm text-red-500">{error}</p>}
            {users.length === 0 && <p className="text-sm text-neutral-400">No users.</p>}
            {users.map((user) => {
                const isExpanded = expandedId === user.id;
                const earnedDefIds = new Set(user.badges.map((b) => b.definition.id));
                const unearnedDefs = defsForSeries.filter((d) => !earnedDefIds.has(d.id));

                return (
                    <div
                        key={user.id}
                        className="rounded border border-neutral-300 dark:border-neutral-700"
                    >
                        <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : user.id)}
                            className="flex w-full items-center gap-3 p-3 text-left"
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-medium dark:bg-neutral-700">
                                {user.email[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {user.displayName || user.email}
                                </p>
                                <p className="truncate text-xs text-neutral-400">{user.email}</p>
                            </div>
                            <span className="shrink-0 text-xs text-neutral-400">
                                {user.badges.length} badge{user.badges.length !== 1 ? "s" : ""}
                            </span>
                            <span className="shrink-0 text-xs text-neutral-400">
                                {isExpanded ? "▲" : "▼"}
                            </span>
                        </button>

                        {isExpanded && (
                            <div className="border-t border-neutral-200 p-3 dark:border-neutral-700">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                    Earned badges
                                </p>
                                {user.badges.length === 0 ? (
                                    <p className="mb-3 text-xs text-neutral-400">None yet.</p>
                                ) : (
                                    <ul className="mb-3 flex flex-col gap-1">
                                        {user.badges.map((b) => (
                                            <li
                                                key={b.userBadgeId}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                {b.definition.icon && (
                                                    <img src={b.definition.icon} alt="" className="h-5 w-5 object-contain" />
                                                )}
                                                {b.definition.label && (
                                                    <span>{b.definition.label.en}</span>
                                                )}
                                                <span className="text-xs text-neutral-400">
                                                    ({b.series.label.en})
                                                </span>
                                                <span className="text-xs text-neutral-400">
                                                    · {new Date(b.grantedAt).toLocaleDateString()}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRevoke(user.id, b.definition.id)
                                                    }
                                                    disabled={isPending}
                                                    className="ml-auto text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                                                >
                                                    Revoke
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                    Grant badge
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <select
                                        value={grantSeriesId}
                                        onChange={(e) => {
                                            setGrantSeriesId(e.target.value);
                                            setGrantDefId("");
                                        }}
                                        className={selectClass}
                                    >
                                        <option value="">Series…</option>
                                        {allSeries.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.label.en}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={grantDefId}
                                        onChange={(e) => setGrantDefId(e.target.value)}
                                        disabled={!grantSeriesId}
                                        className={`${selectClass} disabled:opacity-50`}
                                    >
                                        <option value="">Badge…</option>
                                        {unearnedDefs.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.icon ? `${d.icon} ` : ""}
                                                {d.label?.en ?? `#${d.order}`}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => handleGrant(user)}
                                        disabled={!grantDefId || isPending}
                                        className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                                    >
                                        Grant
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
