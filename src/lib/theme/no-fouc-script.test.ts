import { test } from "node:test";
import assert from "node:assert/strict";
import { buildNoFoucScript } from "./no-fouc-script";

// Run the generated inline script inside a sandbox that mirrors the browser's
// <head> execution context: the script runs before <body> is parsed, so
// `document.body` is null, and `getComputedStyle` throws on a non-Element
// exactly like the real DOM does.
function runInHead(script: string, opts: { storedMode?: string; systemDark?: boolean } = {}) {
    const calls = {
        added: [] as string[],
        removed: [] as string[],
        attrs: [] as Array<[string, string]>,
        styleRemoved: false,
        reflowedTag: null as string | null,
    };

    const styleNode = { textContent: "", _tag: "STYLE" };
    const documentElement = {
        _tag: "HTML",
        classList: {
            add: (c: string) => calls.added.push(c),
            remove: (c: string) => calls.removed.push(c),
        },
        setAttribute: (k: string, v: string) => calls.attrs.push([k, v]),
    };
    const doc = {
        body: null, // <head> executes before <body> exists
        documentElement,
        head: {
            appendChild: () => {},
            removeChild: () => {
                calls.styleRemoved = true;
            },
        },
        createElement: () => styleNode,
    };
    const win: { updateDOM?: () => void } = {};
    const matchMedia = () => ({
        matches: Boolean(opts.systemDark),
        addEventListener: () => {},
    });
    const localStorage = { getItem: () => opts.storedMode ?? null };
    const fakeSetTimeout = (fn: () => void) => {
        fn(); // run the cleanup synchronously so we can assert it ran
        return 0;
    };
    const getComputedStyle = (el: unknown) => {
        if (!el || typeof el !== "object") {
            throw new TypeError(
                "Failed to execute 'getComputedStyle' on 'Window': parameter 1 is not of type 'Element'.",
            );
        }
        calls.reflowedTag = (el as { _tag?: string })._tag ?? "UNKNOWN";
        return {};
    };

    const fn = new Function(
        "window",
        "document",
        "matchMedia",
        "localStorage",
        "setTimeout",
        "getComputedStyle",
        script,
    );
    fn(win, doc, matchMedia, localStorage, fakeSetTimeout, getComputedStyle);
    return { calls, win };
}

test("does not throw when running in <head> (document.body is null)", () => {
    assert.doesNotThrow(() => runInHead(buildNoFoucScript("k")));
});

test("flushes the reflow on an always-present element, not document.body", () => {
    const { calls } = runInHead(buildNoFoucScript("k"));
    assert.notEqual(calls.reflowedTag, null);
    assert.notEqual(calls.reflowedTag, "BODY");
});

test("removes the transition-blocking style after applying the theme", () => {
    const { calls } = runInHead(buildNoFoucScript("k"));
    assert.equal(calls.styleRemoved, true);
});

test("applies dark class and data-mode when stored mode is dark", () => {
    const { calls } = runInHead(buildNoFoucScript("k"), { storedMode: "dark" });
    assert.ok(calls.added.includes("dark"));
    assert.deepEqual(
        calls.attrs.find(([k]) => k === "data-mode"),
        ["data-mode", "dark"],
    );
});

test("system mode resolves to dark when the OS prefers dark", () => {
    const { calls } = runInHead(buildNoFoucScript("k"), { systemDark: true });
    assert.ok(calls.added.includes("dark"));
    assert.deepEqual(
        calls.attrs.find(([k]) => k === "data-mode"),
        ["data-mode", "system"],
    );
});

test("exposes window.updateDOM for the theme switcher", () => {
    const { win } = runInHead(buildNoFoucScript("k"));
    assert.equal(typeof win.updateDOM, "function");
});
