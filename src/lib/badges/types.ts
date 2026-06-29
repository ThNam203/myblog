export type BadgeSeries = {
    id: string;
    label: { en: string; vi: string };
};

export type BadgeDefinition = {
    id: string;
    seriesId: string;
    order: number;
    label: { en: string; vi: string } | null;
    description: { en: string; vi: string };
    icon: string | null;
    conditionKey: "posts_read" | "comments_posted";
    threshold: number;
};

export type UserBadgeRow = {
    id: string;
    userId: string;
    badgeDefinitionId: string;
    grantedAt: string;
};

export type UserBadge = UserBadgeRow & {
    definition: BadgeDefinition;
    series: BadgeSeries;
};
