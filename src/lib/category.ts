/**
 * Canonical category URL slug helpers.
 *
 * Single source of truth so the sitemap and the category route always agree.
 * A category name like "AI generated" maps to the slug "ai-generated"; the
 * route reverses it back to a name for lookup.
 */
export function slugifyCategory(category: string): string {
    return category.toLowerCase().replace(/\s+/g, "-");
}

export function deslugifyCategory(slug: string): string {
    return slug.replace(/-/g, " ");
}
