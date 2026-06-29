import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBadgeSeriesRow, parseBadgeDefinitionRow, parseUserBadgeRow } from "./badge-schema";

const VALID_SERIES_ROW = {
    id: "reading",
    label: { en: "Reading", vi: "Đọc sách" },
};

const VALID_DEF_ROW = {
    id: "00000000-0000-0000-0000-000000000001",
    series_id: "reading",
    order: 1,
    label: { en: "Bookworm", vi: "Mọt sách" },
    description: { en: "Read 5 posts", vi: "Đọc 5 bài" },
    icon: "🐛",
    condition_key: "posts_read",
    threshold: 5,
};

const VALID_USER_BADGE_ROW = {
    id: "00000000-0000-0000-0000-000000000002",
    user_id: "00000000-0000-0000-0000-000000000003",
    badge_definition_id: "00000000-0000-0000-0000-000000000001",
    granted_at: "2026-06-29T00:00:00.000Z",
};

test("parseBadgeSeriesRow parses valid row", () => {
    const result = parseBadgeSeriesRow(VALID_SERIES_ROW);
    assert.deepEqual(result, { id: "reading", label: { en: "Reading", vi: "Đọc sách" } });
});

test("parseBadgeSeriesRow throws on missing label", () => {
    assert.throws(() => parseBadgeSeriesRow({ id: "reading" }));
});

test("parseBadgeDefinitionRow maps snake_case to camelCase", () => {
    const result = parseBadgeDefinitionRow(VALID_DEF_ROW);
    assert.equal(result.seriesId, "reading");
    assert.equal(result.order, 1);
    assert.equal(result.conditionKey, "posts_read");
    assert.equal(result.threshold, 5);
});

test("parseBadgeDefinitionRow allows null label and icon", () => {
    const result = parseBadgeDefinitionRow({ ...VALID_DEF_ROW, label: null, icon: null });
    assert.equal(result.label, null);
    assert.equal(result.icon, null);
});

test("parseBadgeDefinitionRow throws on invalid condition_key", () => {
    assert.throws(() => parseBadgeDefinitionRow({ ...VALID_DEF_ROW, condition_key: "unknown" }));
});

test("parseBadgeDefinitionRow accepts posts_read_all condition_key", () => {
    const result = parseBadgeDefinitionRow({ ...VALID_DEF_ROW, condition_key: "posts_read_all" });
    assert.equal(result.conditionKey, "posts_read_all");
});

test("parseUserBadgeRow parses valid row", () => {
    const result = parseUserBadgeRow(VALID_USER_BADGE_ROW);
    assert.equal(result.id, VALID_USER_BADGE_ROW.id);
    assert.equal(result.userId, VALID_USER_BADGE_ROW.user_id);
    assert.equal(result.badgeDefinitionId, VALID_USER_BADGE_ROW.badge_definition_id);
    assert.equal(result.grantedAt, VALID_USER_BADGE_ROW.granted_at);
});

test("parseUserBadgeRow throws on missing fields", () => {
    assert.throws(() => parseUserBadgeRow({ id: "x" }));
});
