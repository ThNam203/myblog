import { test } from "node:test";
import assert from "node:assert/strict";
import { pickLocalized, isFilledLocalized } from "./localized";

test("pickLocalized returns a plain string as-is (locale-neutral)", () => {
    assert.equal(pickLocalized("https://maps/x", "vi"), "https://maps/x");
    assert.equal(pickLocalized("https://maps/x", "en"), "https://maps/x");
});

test("pickLocalized indexes a per-locale object", () => {
    const link = { vi: "/vi/posts/x", en: "/en/posts/x" };
    assert.equal(pickLocalized(link, "vi"), "/vi/posts/x");
    assert.equal(pickLocalized(link, "en"), "/en/posts/x");
});

test("pickLocalized returns undefined for undefined", () => {
    assert.equal(pickLocalized(undefined, "vi"), undefined);
});

test("isFilledLocalized true only when both vi and en are non-empty", () => {
    assert.equal(isFilledLocalized({ vi: "a", en: "b" }), true);
    assert.equal(isFilledLocalized({ vi: " ", en: "b" }), false);
    assert.equal(isFilledLocalized({ vi: "a", en: "" }), false);
});
