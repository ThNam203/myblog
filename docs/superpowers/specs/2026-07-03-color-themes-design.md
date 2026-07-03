# Design: Standalone Color Themes (Blue / Magenta / Pink)

**Date:** 2026-07-03
**Status:** approved-pending-review

## Goal

Add 3 standalone color themes — blue-centered, magenta-centered, light-pink-centered — alongside the existing Dark / Light / System options. Themes are "neutral and catchy just enough": light palettes built from hue-tinted gray surfaces plus one sparing accent color.

## Decisions (from brainstorm)

- **Standalone themes**, not an accent dimension. Picker becomes: `System / Dark / Light / Blue / Magenta / Pink`.
- **All three new themes are light-based.** Dark stays the only dark option. `system` resolves to dark/light as today.
- **Approach A — CSS-variable palette remap.** No component churn; existing `neutral-*` utility classes keep working and are re-tinted per theme.

## Architecture

### 1. Tailwind config ([tailwind.config.ts](../../../tailwind.config.ts))

Override the `neutral` scale (50–950) to read CSS variables with alpha support, and add an `accent` color:

```ts
colors: {
    neutral: {
        50: "rgb(var(--tone-50) / <alpha-value>)",
        // ... 100..950
    },
    accent: "rgb(var(--tone-accent) / <alpha-value>)",
    white: "rgb(var(--tone-white) / <alpha-value>)",
    // keep existing accent-1/accent-2/accent-7/success/cyan
}
```

`white` must be remapped because 34 `bg-white` surfaces (cards, menus) would otherwise stay pure white and break the tint. Default `--tone-white: 255 255 255` (pixel-identical today); themes set a near-white tint (≥98% lightness), so the 48 `text-white` usages remain visually white.

Only `neutral` and `white` are remapped. `slate-*` (used almost exclusively in `dark:` variants) is untouched — dark theme keeps its exact current look.

### 2. Theme palettes ([globals.css](../../../src/app/globals.css))

`:root` defines the default variables equal to Tailwind's stock neutral values (space-separated RGB triplets), so Light and Dark themes render pixel-identical to today. Then one block per theme:

```css
[data-theme="blue"]   { /* cool blue-tinted grays, accent ≈ #2563eb */ }
[data-theme="magenta"]{ /* mauve-tinted grays,     accent ≈ #c026d3 */ }
[data-theme="pink"]   { /* warm rose-tinted grays, accent ≈ #e0527f */ }
```

Palette construction rule ("neutral, catchy just enough"): take the stock neutral lightness ladder and shift hue/chroma slightly toward the theme hue — low saturation at the light end (50–200, surfaces), slightly more at the mid/dark end (500–950, text) so text stays readable but carries the hue. Accent reserved for links, active states, focus rings, selection.

Additionally `::selection` gets the accent at low alpha under `[data-theme]` blocks, and the music-player scrubber variables (`--music-played` / `--music-unplayed`) are re-pointed at tone variables so the player tints with the theme.

### 3. Theme state ([theme-switcher.tsx](../../../src/app/_components/theme-switcher.tsx))

- `ColorSchemePreference` becomes `"system" | "dark" | "light" | "blue" | "magenta" | "pink"`.
- `THEME_MENU_OPTIONS` gains the three new entries.
- `useColorSchemePreference` validates stored values against the full list (unknown → `system`; old stored values remain valid).
- On apply: `dark` class added only when resolved mode is `dark`; `data-theme` attribute set to the color theme name (or removed for plain dark/light/system).

### 4. No-FOUC script ([no-fouc-script.ts](../../../src/lib/theme/no-fouc-script.ts))

Same resolution logic added to the injected script: read stored mode, if it's one of `blue|magenta|pink` set `document.documentElement.dataset.theme` and remove `dark`; else current behavior. Keep `data-mode` attribute for compatibility. Update [no-fouc-script.test.ts](../../../src/lib/theme/no-fouc-script.test.ts) accordingly.

### 5. Labels / i18n ([dictionaries.ts](../../../src/i18n/dictionaries.ts))

Add `themeBlue`, `themeMagenta`, `themePink` to both locales:

- en: `Blue`, `Magenta`, `Pink`
- vi: `Xanh dương`, `Hồng cánh sen`, `Hồng phấn`

Thread through `header-site-menu.tsx` theme label map.

## Data flow

localStorage `nam-blog-theme` → no-FOUC script (first paint) and `useColorSchemePreference` (hydration + changes) → `documentElement`: `.dark` class + `data-theme` attribute → CSS variables → Tailwind `neutral`/`accent` utilities.

## Error handling

- Unknown/legacy stored value → falls back to `system` (existing behavior preserved).
- Storage event sync across tabs already handled; extend validation list.

## Testing

- Unit: extend `no-fouc-script.test.ts` for the 3 new stored values (sets `data-theme`, no `dark` class) and fallback.
- Verify: `npm run lint`, typecheck, existing tests; visual spot-check each theme in browser (home, post page, menu, music player).

## Out of scope

- Dark variants of blue/magenta/pink.
- Refactoring components to semantic tokens.
- Theming `slate-*` (dark-mode-only palette).
