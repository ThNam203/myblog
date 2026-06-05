import { cache } from "react";
import { Post, type PostAddress } from "@/interfaces/post";
import { defaultLocale, isValidLocale, type Locale } from "@/i18n/config";
import { validateFrontMatter } from "@/lib/post-schema";
import fs from "fs";
import matter from "gray-matter";
import { join } from "path";

const postsDirectory = join(process.cwd(), "_posts");
const localizedPostsDirectory = (locale: Locale) => join(postsDirectory, locale);
const HIDE_DRAFTS = process.env.NODE_ENV === "production";

function normalizeCategories(value: unknown): string[] {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value
            .filter((category): category is string => typeof category === "string")
            .map((category) => category.trim())
            .filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
        return [value.trim()];
    }

    return [];
}

function isPostAddress(value: unknown): value is PostAddress {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return typeof candidate.name === "string" && typeof candidate.address === "string";
}

function normalizeAddresses(data: Record<string, unknown>): PostAddress[] {
    const addressesValue = data.addresses;
    if (Array.isArray(addressesValue)) {
        return addressesValue.filter(isPostAddress);
    }

    return [];
}

function resolvePostsDirectory(locale: Locale) {
    const localeDir = localizedPostsDirectory(locale);
    if (fs.existsSync(localeDir)) {
        return localeDir;
    }
    return postsDirectory;
}

export function getPostSlugs(locale: string = defaultLocale) {
    if (!isValidLocale(locale)) {
        return [];
    }

    const targetDirectory = resolvePostsDirectory(locale);
    return fs.readdirSync(targetDirectory).filter((fileName) => fileName.endsWith(".md"));
}

export const getPostBySlug = cache((slug: string, locale: string = defaultLocale) => {
    if (!isValidLocale(locale)) {
        return null;
    }

    const realSlug = slug.replace(/\.md$/, "");
    const fullPath = join(resolvePostsDirectory(locale), `${realSlug}.md`);
    if (!fs.existsSync(fullPath)) {
        return null;
    }

    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);
    const validated = validateFrontMatter(data, { slug: realSlug, locale });
    if (!validated) return null;

    const addresses = normalizeAddresses(data);

    const post = {
        ...data,
        categories: normalizeCategories(data.categories),
        addresses,
        draft: data.draft === true,
        slug: realSlug,
        content,
    } as Post;

    if (post.draft && HIDE_DRAFTS) return null;
    return post;
});

export const getAllPosts = cache((locale: string = defaultLocale): Post[] => {
    const slugs = getPostSlugs(locale);
    const posts = slugs
        .map((slug) => getPostBySlug(slug, locale))
        .filter((post): post is Post => post !== null)
        .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
    return posts;
});

export function getAllCategories(locale: string = defaultLocale): string[] {
    const posts = getAllPosts(locale);
    const seen = new Set<string>();
    for (const post of posts) {
        for (const cat of post.categories) {
            seen.add(cat);
        }
    }
    return Array.from(seen).sort();
}

export function getPostsByCategory(category: string, locale: string = defaultLocale): Post[] {
    const normalized = category.toLowerCase();
    return getAllPosts(locale).filter((post) =>
        post.categories.some((c) => c.toLowerCase() === normalized),
    );
}

export function getRelatedPosts(slug: string, locale: string = defaultLocale, limit = 3): Post[] {
    const all = getAllPosts(locale);
    const current = all.find((post) => post.slug === slug);
    if (!current) return [];

    const currentCategories = new Set(current.categories.map((c) => c.toLowerCase()));
    const scored = all
        .filter((post) => post.slug !== slug)
        .map((post) => {
            const shared = post.categories.filter((c) =>
                currentCategories.has(c.toLowerCase()),
            ).length;
            return { post, shared };
        })
        .sort((a, b) => {
            if (b.shared !== a.shared) return b.shared - a.shared;
            return a.post.date > b.post.date ? -1 : 1;
        });

    return scored.slice(0, limit).map((entry) => entry.post);
}
