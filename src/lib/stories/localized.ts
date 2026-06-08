import type { Locale } from "@/i18n/config";
import type { Localized, MaybeLocalized } from "@/interfaces/story";

/**
 * Resolve a `MaybeLocalized` to a single string for the given locale.
 * A plain string is locale-neutral and returned as-is; a per-locale object is
 * indexed by `locale`. `undefined` in → `undefined` out (optional fields).
 */
export function pickLocalized(
    value: MaybeLocalized | undefined,
    locale: Locale,
): string | undefined {
    if (value == null) return undefined;
    return typeof value === "string" ? value : value[locale];
}

/** True when a Localized object has a non-empty (trimmed) string for vi and en. */
export function isFilledLocalized(value: Localized): boolean {
    return (
        typeof value?.vi === "string" &&
        value.vi.trim().length > 0 &&
        typeof value?.en === "string" &&
        value.en.trim().length > 0
    );
}
