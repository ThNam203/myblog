# Standalone Color Themes (Blue / Magenta / Pink) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 standalone light color themes (blue, magenta, light-pink) to the theme picker alongside Dark/Light/System, implemented as CSS-variable remaps of the `neutral`/`white` Tailwind palettes so no component markup changes.

**Architecture:** localStorage key `nam-blog-theme` now stores one of `system|dark|light|blue|magenta|pink`. A no-FOUC inline script and the React hook both set `.dark` class (dark only) and `data-theme` attribute (color themes only) on `<html>`. `tailwind.config.ts` points `neutral`, `white`, and a new `accent` color at CSS variables; `globals.css` defines default values (pixel-identical to today) and per-`[data-theme]` tinted palettes.

**Tech Stack:** Next.js App Router, Tailwind CSS 3, node:test via jiti.

**Spec:** `docs/superpowers/specs/2026-07-03-color-themes-design.md`

## Global Constraints

- Work on feature branch `feature/color-themes` (no direct push to main).
- Light and Dark themes must render pixel-identical to today (default variables = stock Tailwind neutral values, `--tone-white: 255 255 255`).
- New themes are light-based: `.dark` class must NOT be applied when a color theme is active.
- No `any` in TypeScript. No new dependencies.
- Tests: `npm test` (node:test via jiti, glob `src/lib/**/*.test.ts`). Note: `@/` path alias does NOT resolve at test runtime — test files use relative imports.
- Commits reference the spec: `Refs: docs/superpowers/specs/2026-07-03-color-themes-design.md`.

---

### Task 0: Branch

- [ ] **Step 1: Create feature branch**

```bash
cd /Users/ictsaigon.vn/mywork/my-blog && git checkout -b feature/color-themes
```

---

### Task 1: No-FOUC script supports color themes (TDD)

**Files:**
- Modify: `src/lib/theme/no-fouc-script.ts`
- Test: `src/lib/theme/no-fouc-script.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `buildNoFoucScript(storageKey: string): string` (same signature). Behavior contract for later tasks: stored `blue|magenta|pink` → `data-theme="<name>"` set on `<html>`, `dark` class removed; stored `dark|light|system` or unknown → `data-theme` attribute removed. `data-mode` always set to the raw stored mode (or `system`).

- [ ] **Step 1: Extend the test sandbox and add failing tests**

In `src/lib/theme/no-fouc-script.test.ts`:

1. Add attribute-removal tracking to the sandbox. In `runInHead`, extend `calls`:

```ts
const calls = {
    added: [] as string[],
    removed: [] as string[],
    attrs: [] as Array<[string, string]>,
    attrsRemoved: [] as string[],
    styleRemoved: false,
    reflowedTag: null as string | null,
};
```

2. Extend `documentElement` with `removeAttribute`:

```ts
const documentElement = {
    _tag: "HTML",
    classList: {
        add: (c: string) => calls.added.push(c),
        remove: (c: string) => calls.removed.push(c),
    },
    setAttribute: (k: string, v: string) => calls.attrs.push([k, v]),
    removeAttribute: (k: string) => calls.attrsRemoved.push(k),
};
```

3. Append these tests at the end of the file:

```ts
test("applies data-theme and no dark class when stored mode is a color theme", () => {
    const { calls } = runInHead(buildNoFoucScript("k"), { storedMode: "blue" });
    assert.ok(!calls.added.includes("dark"));
    assert.ok(calls.removed.includes("dark"));
    assert.deepEqual(
        calls.attrs.find(([k]) => k === "data-theme"),
        ["data-theme", "blue"],
    );
    assert.deepEqual(
        calls.attrs.find(([k]) => k === "data-mode"),
        ["data-mode", "blue"],
    );
});

test("color themes stay light even when the OS prefers dark", () => {
    const { calls } = runInHead(buildNoFoucScript("k"), {
        storedMode: "pink",
        systemDark: true,
    });
    assert.ok(!calls.added.includes("dark"));
    assert.deepEqual(
        calls.attrs.find(([k]) => k === "data-theme"),
        ["data-theme", "pink"],
    );
});

test("magenta sets data-theme=magenta", () => {
    const { calls } = runInHead(buildNoFoucScript("k"), { storedMode: "magenta" });
    assert.deepEqual(
        calls.attrs.find(([k]) => k === "data-theme"),
        ["data-theme", "magenta"],
    );
});

test("removes data-theme for dark/light/system modes", () => {
    for (const storedMode of ["dark", "light", "system"]) {
        const { calls } = runInHead(buildNoFoucScript("k"), { storedMode });
        assert.equal(calls.attrs.some(([k]) => k === "data-theme"), false);
        assert.ok(calls.attrsRemoved.includes("data-theme"));
    }
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npm test`
Expected: the 4 new tests FAIL (`data-theme` never set / `removeAttribute` never called); the 6 existing tests still PASS.

- [ ] **Step 3: Implement in `buildNoFoucScript`**

Replace the `window.updateDOM` block inside the template string in `src/lib/theme/no-fouc-script.ts` (keep everything else — `modifyTransition`, media listener — unchanged):

```ts
  const media = matchMedia("(prefers-color-scheme: dark)");
  window.updateDOM = () => {
    const restoreTransitions = modifyTransition();
    const mode = localStorage.getItem(storageKey) ?? SYSTEM;
    const systemMode = media.matches ? DARK : LIGHT;
    const resolvedMode = mode === SYSTEM ? systemMode : mode;
    const root = document.documentElement;
    if (resolvedMode === DARK) root.classList.add(DARK);
    else root.classList.remove(DARK);
    if (COLOR_THEMES.indexOf(mode) !== -1) root.setAttribute("data-theme", mode);
    else root.removeAttribute("data-theme");
    root.setAttribute("data-mode", mode);
    restoreTransitions();
  };
```

and add the constant next to `SYSTEM/DARK/LIGHT` declarations at the top of the script body:

```ts
  const COLOR_THEMES = ["blue", "magenta", "pink"];
```

(Use `indexOf` — the string is injected verbatim; keep it dependency-free and ES5-safe like the rest.)

- [ ] **Step 4: Run tests to verify all pass**

Run: `npm test`
Expected: all 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme/no-fouc-script.ts src/lib/theme/no-fouc-script.test.ts
git commit -m "feat(theme): no-FOUC script applies data-theme for color themes

Refs: docs/superpowers/specs/2026-07-03-color-themes-design.md"
```

---

### Task 2: Tailwind variable remap + theme palettes

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/[locale]/layout.tsx:125` (body className)

**Interfaces:**
- Consumes: `data-theme` attribute contract from Task 1.
- Produces: Tailwind utilities `neutral-50..950`, `white`, `accent` backed by CSS variables `--tone-50..--tone-950`, `--tone-white`, `--tone-accent` (space-separated RGB triplets). Later tasks may use `text-accent` etc.

- [ ] **Step 1: Remap colors in `tailwind.config.ts`**

Replace the `colors` block:

```ts
colors: {
    "accent-1": "#FAFAFA",
    "accent-2": "#EAEAEA",
    "accent-7": "#333",
    success: "#0070f3",
    cyan: "#79FFE1",
    accent: "rgb(var(--tone-accent) / <alpha-value>)",
    white: "rgb(var(--tone-white) / <alpha-value>)",
    neutral: {
        50: "rgb(var(--tone-50) / <alpha-value>)",
        100: "rgb(var(--tone-100) / <alpha-value>)",
        200: "rgb(var(--tone-200) / <alpha-value>)",
        300: "rgb(var(--tone-300) / <alpha-value>)",
        400: "rgb(var(--tone-400) / <alpha-value>)",
        500: "rgb(var(--tone-500) / <alpha-value>)",
        600: "rgb(var(--tone-600) / <alpha-value>)",
        700: "rgb(var(--tone-700) / <alpha-value>)",
        800: "rgb(var(--tone-800) / <alpha-value>)",
        900: "rgb(var(--tone-900) / <alpha-value>)",
        950: "rgb(var(--tone-950) / <alpha-value>)",
    },
},
```

(`extend.colors` merges — `white` and `neutral` override the defaults, everything else in the default palette stays.)

- [ ] **Step 2: Add variables and palettes to `src/app/globals.css`**

Insert directly after the three `@tailwind` directives:

```css
/* Theme tone variables. Defaults = stock Tailwind neutral + pure white, so the
   Light and Dark themes render pixel-identical to the pre-theming site.
   Values are space-separated RGB triplets consumed via rgb(var(--x) / alpha). */
:root {
    --tone-white: 255 255 255;
    --tone-50: 250 250 250;
    --tone-100: 245 245 245;
    --tone-200: 229 229 229;
    --tone-300: 212 212 212;
    --tone-400: 163 163 163;
    --tone-500: 115 115 115;
    --tone-600: 82 82 82;
    --tone-700: 64 64 64;
    --tone-800: 38 38 38;
    --tone-900: 23 23 23;
    --tone-950: 10 10 10;
    --tone-accent: 23 23 23;
}

/* Blue: cool blue-tinted grays, indigo-blue accent (#2563eb) */
[data-theme="blue"] {
    --tone-white: 250 252 255;
    --tone-50: 244 247 252;
    --tone-100: 235 240 248;
    --tone-200: 217 226 238;
    --tone-300: 198 210 227;
    --tone-400: 148 163 187;
    --tone-500: 100 116 144;
    --tone-600: 71 85 110;
    --tone-700: 53 65 88;
    --tone-800: 32 41 59;
    --tone-900: 19 26 41;
    --tone-950: 9 13 23;
    --tone-accent: 37 99 235;
}

/* Magenta: mauve-tinted grays, fuchsia accent (#c026d3) */
[data-theme="magenta"] {
    --tone-white: 254 250 254;
    --tone-50: 250 244 250;
    --tone-100: 246 236 246;
    --tone-200: 235 219 234;
    --tone-300: 222 199 220;
    --tone-400: 180 150 176;
    --tone-500: 136 105 132;
    --tone-600: 100 73 96;
    --tone-700: 77 55 74;
    --tone-800: 49 33 47;
    --tone-900: 32 20 30;
    --tone-950: 16 8 15;
    --tone-accent: 192 38 211;
}

/* Pink: warm rose-tinted grays, soft rose accent (#e0527f) */
[data-theme="pink"] {
    --tone-white: 255 250 251;
    --tone-50: 252 245 247;
    --tone-100: 249 238 241;
    --tone-200: 241 221 227;
    --tone-300: 231 200 209;
    --tone-400: 193 152 164;
    --tone-500: 148 106 119;
    --tone-600: 110 74 86;
    --tone-700: 85 56 66;
    --tone-800: 54 34 41;
    --tone-900: 35 21 26;
    --tone-950: 18 9 12;
    --tone-accent: 224 82 127;
}

/* Accent-tinted text selection under color themes */
[data-theme] ::selection {
    background-color: rgb(var(--tone-accent) / 0.22);
}
```

- [ ] **Step 3: Re-point the light-mode music scrubber at tone variables**

In the same file, update the light-mode `.music-player-range` block and thumbs (the `.dark` overrides stay untouched):

```css
.music-player-range {
    --music-progress: 0%;
    --music-played: rgb(var(--tone-500));
    --music-unplayed: rgb(var(--tone-300));
    background: linear-gradient(
        to right,
        var(--music-played) 0%,
        var(--music-played) var(--music-progress),
        var(--music-unplayed) var(--music-progress),
        var(--music-unplayed) 100%
    );
}
```

and both thumb rules:

```css
.music-player-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 9999px;
    background: rgb(var(--tone-900));
}
```

```css
.music-player-range::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border: none;
    border-radius: 9999px;
    background: rgb(var(--tone-900));
}
```

(Note: `--music-played` was `rgb(107 114 128)` (gray-500) and becomes neutral-500 `rgb(115 115 115)` in the default theme — a 3% imperceptible shift that unifies the scale.)

- [ ] **Step 4: Give `<body>` a themable background**

In `src/app/[locale]/layout.tsx` line 125, the body currently relies on the browser-default white background in light mode, which CSS variables cannot tint. Add `bg-white` (now variable-backed, identical by default):

```tsx
<body className={cn(inter.className, "bg-white dark:bg-slate-900 dark:text-slate-400")}>
```

- [ ] **Step 5: Verify build compiles and default look is unchanged**

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev` (background), open `http://localhost:3000/en`, confirm light mode looks unchanged (white bg, gray text), toggle dark — unchanged. Then in DevTools console run `document.documentElement.setAttribute("data-theme", "blue")` — surfaces should tint blue immediately. Repeat for `magenta`, `pink`. Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts src/app/globals.css "src/app/[locale]/layout.tsx"
git commit -m "feat(theme): CSS-variable tone palettes for blue/magenta/pink themes

Refs: docs/superpowers/specs/2026-07-03-color-themes-design.md"
```

---

### Task 3: Theme switcher state + menu options

**Files:**
- Modify: `src/app/_components/theme-switcher.tsx`

**Interfaces:**
- Consumes: `data-theme` contract (Task 1), tone variables (Task 2).
- Produces: `type ColorSchemePreference = "system" | "dark" | "light" | "blue" | "magenta" | "pink"`; `THEME_MENU_OPTIONS: ColorSchemePreference[]` = `["dark", "light", "blue", "magenta", "pink", "system"]`; `useColorSchemePreference()` unchanged signature. `header-site-menu.tsx` and `layout.tsx` consume these (Task 4).

- [ ] **Step 1: Extend the union, options, defaults**

In `src/app/_components/theme-switcher.tsx` replace lines 9–19 with:

```ts
export type ColorSchemePreference = "system" | "dark" | "light" | "blue" | "magenta" | "pink";

const STORAGE_KEY = "nam-blog-theme";

export const THEME_MENU_OPTIONS: ColorSchemePreference[] = [
    "dark",
    "light",
    "blue",
    "magenta",
    "pink",
    "system",
];
type ThemeLabelMap = Record<ColorSchemePreference, string>;
const defaultModeLabels: ThemeLabelMap = {
    dark: "Dark",
    light: "Light",
    blue: "Blue",
    magenta: "Magenta",
    pink: "Pink",
    system: "System",
};

function isColorSchemePreference(value: string | null): value is ColorSchemePreference {
    return (
        value === "system" ||
        value === "dark" ||
        value === "light" ||
        value === "blue" ||
        value === "magenta" ||
        value === "pink"
    );
}
```

- [ ] **Step 2: Sync the injected `NoFOUCScript` helper**

Replace the `window.updateDOM` body inside `NoFOUCScript` (the exported function used for in-context injection) to mirror Task 1's logic:

```ts
export const NoFOUCScript = (storageKey: string) => {
    /* can not use outside constants or function as this script will be injected in a different context */
    const [SYSTEM, DARK, LIGHT] = ["system", "dark", "light"];
    const COLOR_THEMES = ["blue", "magenta", "pink"];

    /** Modify transition globally to avoid patched transitions */
    const modifyTransition = () => {
        const css = document.createElement("style");
        css.textContent = "*,*:after,*:before{transition:none !important;}";
        document.head.appendChild(css);

        return () => {
            /* Force restyle */
            getComputedStyle(document.body);
            /* Wait for next tick before removing */
            setTimeout(() => document.head.removeChild(css), 1);
        };
    };

    const media = matchMedia(`(prefers-color-scheme: ${DARK})`);

    /** function to add remove dark class */
    window.updateDOM = () => {
        const restoreTransitions = modifyTransition();
        const mode = localStorage.getItem(storageKey) ?? SYSTEM;
        const systemMode = media.matches ? DARK : LIGHT;
        const resolvedMode = mode === SYSTEM ? systemMode : mode;
        const root = document.documentElement;
        if (resolvedMode === DARK) root.classList.add(DARK);
        else root.classList.remove(DARK);
        if (COLOR_THEMES.indexOf(mode) !== -1) root.setAttribute("data-theme", mode);
        else root.removeAttribute("data-theme");
        root.setAttribute("data-mode", mode);
        restoreTransitions();
    };
    window.updateDOM();
    media.addEventListener("change", window.updateDOM);
};
```

- [ ] **Step 3: Use the guard in `useColorSchemePreference`**

Replace the two literal-check sites:

```ts
useEffect(() => {
    updateDOM = window.updateDOM;
    const storedMode = localStorage.getItem(STORAGE_KEY);
    if (isColorSchemePreference(storedMode)) {
        setMode(storedMode);
    }
    setIsMounted(true);

    const handleStorage = (e: StorageEvent): void => {
        if (e.key !== STORAGE_KEY) {
            return;
        }

        if (isColorSchemePreference(e.newValue)) {
            setMode(e.newValue);
            return;
        }

        setMode("system");
    };

    addEventListener("storage", handleStorage);

    return () => {
        removeEventListener("storage", handleStorage);
    };
}, []);
```

- [ ] **Step 4: Typecheck (expected intermediate failure)**

Run: `npx tsc --noEmit`
Expected: `layout.tsx` FAILS typecheck — `themeLabels` prop is missing `blue`, `magenta`, `pink` keys (proves `Record<ColorSchemePreference, string>` enforcement). No other errors. Do NOT commit yet — Task 4 fixes this and commits both changes together so no commit has a failing typecheck.

---

### Task 4: i18n labels + layout wiring

**Files:**
- Modify: `src/i18n/dictionaries.ts` (type at ~line 35, vi at ~line 268, en at ~line 433)
- Modify: `src/app/[locale]/layout.tsx:146-150` (themeLabels prop)
- Commit also includes: `src/app/_components/theme-switcher.tsx` (from Task 3 — committed together to keep every commit typechecking)

**Interfaces:**
- Consumes: `ColorSchemePreference` union from Task 3.
- Produces: dictionary keys `ui.themeBlue`, `ui.themeMagenta`, `ui.themePink` (string) in both locales.

- [ ] **Step 1: Add dictionary type fields**

In the `ui` type block next to the existing entries:

```ts
themeSystem: string;
themeDark: string;
themeLight: string;
themeBlue: string;
themeMagenta: string;
themePink: string;
```

- [ ] **Step 2: Add vi values**

Next to existing vi theme labels:

```ts
themeSystem: "Hệ thống",
themeDark: "Tối",
themeLight: "Sáng",
themeBlue: "Xanh dương",
themeMagenta: "Hồng cánh sen",
themePink: "Hồng phấn",
```

- [ ] **Step 3: Add en values**

```ts
themeSystem: "System",
themeDark: "Dark",
themeLight: "Light",
themeBlue: "Blue",
themeMagenta: "Magenta",
themePink: "Pink",
```

- [ ] **Step 4: Wire labels in layout**

In `src/app/[locale]/layout.tsx`, extend the `themeLabels` prop:

```tsx
themeLabels={{
    dark: dictionary.ui.themeDark,
    light: dictionary.ui.themeLight,
    blue: dictionary.ui.themeBlue,
    magenta: dictionary.ui.themeMagenta,
    pink: dictionary.ui.themePink,
    system: dictionary.ui.themeSystem,
}}
```

- [ ] **Step 5: Typecheck, lint, test**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all PASS (Task 3's deliberate type error now resolved).

- [ ] **Step 6: Commit**

```bash
git add src/app/_components/theme-switcher.tsx src/i18n/dictionaries.ts "src/app/[locale]/layout.tsx"
git commit -m "feat(theme): add blue/magenta/pink themes to switcher with vi/en labels

Refs: docs/superpowers/specs/2026-07-03-color-themes-design.md"
```

---

### Task 5: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Full check suite**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all pass.

- [ ] **Step 2: Live verification**

Run `npm run dev` in background, then verify in browser at `http://localhost:3000/en`:

1. Header menu → theme section shows 6 options: Dark, Light, Blue, Magenta, Pink, System.
2. Select Blue → surfaces tint cool blue immediately, no dark styling. Reload → theme persists with no flash (no-FOUC).
3. Select Magenta, then Pink → tint changes; text remains readable; cards/menus (`bg-white` surfaces) tinted, not pure white.
4. Select Dark → exact current dark look, `data-theme` attribute absent on `<html>`.
5. Select Light → exact current light look.
6. Switch OS/emulated `prefers-color-scheme: dark` while theme = Pink → page stays pink/light.
7. `/vi` locale → labels show Tối, Sáng, Xanh dương, Hồng cánh sen, Hồng phấn, Hệ thống.
8. Music player scrubber + selection highlight tint with the active theme.

Stop dev server.

- [ ] **Step 3: Finish branch**

Use superpowers:finishing-a-development-branch — merge/PR decision per user.
