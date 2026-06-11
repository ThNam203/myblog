import type { MetadataRoute } from "next";
import { getAllCategories, getAllPosts } from "@/lib/api";
import { locales } from "@/i18n/config";
import { slugifyCategory } from "@/lib/category";
import { WEB_DEFAULT_URL } from "@/lib/constants";

const SITE_URL = WEB_DEFAULT_URL.replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();
    const entries: MetadataRoute.Sitemap = [];

    for (const locale of locales) {
        entries.push({
            url: `${SITE_URL}/${locale}`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 1,
        });
        entries.push({
            url: `${SITE_URL}/${locale}/confessions`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.6,
        });
        entries.push({
            url: `${SITE_URL}/${locale}/about`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.6,
        });

        for (const post of getAllPosts(locale)) {
            entries.push({
                url: `${SITE_URL}/${locale}/posts/${post.slug}`,
                lastModified: post.date ? new Date(post.date) : now,
                changeFrequency: "monthly",
                priority: 0.8,
            });
        }

        const seenCategorySlugs = new Set<string>();
        for (const category of getAllCategories(locale)) {
            const slug = slugifyCategory(category);
            if (seenCategorySlugs.has(slug)) continue;
            seenCategorySlugs.add(slug);
            entries.push({
                url: `${SITE_URL}/${locale}/categories/${slug}`,
                lastModified: now,
                changeFrequency: "weekly",
                priority: 0.5,
            });
        }
    }

    return entries;
}
