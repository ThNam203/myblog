import type { Metadata } from "next";
import Container from "@/app/_components/container";
import { HeroPost } from "@/app/_components/hero-post";
import { MoreStories } from "@/app/_components/more-stories";
import { getAllPosts } from "@/lib/api";
import { getDictionary } from "@/i18n/dictionaries";
import { isValidLocale, locales } from "@/i18n/config";
import { StoryBar } from "@/app/[locale]/_components/stories/story-bar";
import { stories } from "@/data/stories";
import {
    LETSLIVE_URL,
    WEB_DEFAULT_AUTHOR,
    WEB_DEFAULT_INSTAGRAM_URL,
    WEB_DEFAULT_URL,
} from "@/lib/constants";
import { notFound } from "next/navigation";

type Props = {
    params: Promise<{
        locale: string;
    }>;
};

const SITE_URL = WEB_DEFAULT_URL.replace(/\/$/, "");
const MAX_POSTS_IN_JSONLD = 10;

function absoluteUrl(path: string): string {
    if (!path) return SITE_URL;
    if (/^https?:\/\//i.test(path)) return path;
    return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type PostImageSource = { ogImage?: { url: string }; coverImage?: string };

function postImageUrl(post: PostImageSource): string | undefined {
    if (post.ogImage?.url) return absoluteUrl(post.ogImage.url);
    if (post.coverImage) return absoluteUrl(post.coverImage);
    return undefined;
}

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    if (!isValidLocale(locale)) {
        return {};
    }

    const dictionary = getDictionary(locale);
    const homePath = `/${locale}`;
    const languages: Record<string, string> = {};
    for (const loc of locales) {
        languages[loc === "vi" ? "vi-VN" : "en-US"] = `/${loc}`;
    }
    languages["x-default"] = "/";

    return {
        title: dictionary.metadata.title,
        description: dictionary.metadata.description,
        alternates: {
            canonical: homePath,
            languages,
            types: {
                "application/rss+xml": `/${locale}/rss.xml`,
            },
        },
    };
}

export default async function Index({ params }: Props) {
    const { locale } = await params;
    if (!isValidLocale(locale)) {
        notFound();
    }

    const dictionary = getDictionary(locale);
    const allPosts = getAllPosts(locale);

    const heroPost = allPosts[0];
    const morePosts = allPosts.slice(1);

    if (!heroPost) {
        return null;
    }

    const siteUrl = `${SITE_URL}/${locale}`;
    const avatarUrl = absoluteUrl(heroPost.author.picture);

    const websiteJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: dictionary.metadata.siteName,
        description: dictionary.metadata.description,
        inLanguage: locale === "vi" ? "vi-VN" : "en-US",
        publisher: { "@id": `${SITE_URL}#person` },
    };

    const personJsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${SITE_URL}#person`,
        name: WEB_DEFAULT_AUTHOR,
        url: siteUrl,
        image: avatarUrl,
        description: dictionary.metadata.authorBio,
        sameAs: [LETSLIVE_URL, WEB_DEFAULT_INSTAGRAM_URL],
    };

    const featuredPosts = allPosts.slice(0, MAX_POSTS_IN_JSONLD);

    const blogJsonLd = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "@id": `${siteUrl}#blog`,
        url: siteUrl,
        name: dictionary.metadata.siteName,
        description: dictionary.metadata.description,
        inLanguage: locale === "vi" ? "vi-VN" : "en-US",
        author: { "@id": `${SITE_URL}#person` },
        publisher: { "@id": `${SITE_URL}#person` },
        blogPost: featuredPosts.map((post) => ({
            "@type": "BlogPosting",
            "@id": `${SITE_URL}/${locale}/posts/${post.slug}`,
            headline: post.title,
            url: `${SITE_URL}/${locale}/posts/${post.slug}`,
            description: post.excerpt,
            datePublished: post.date,
            dateModified: post.date,
            inLanguage: locale === "vi" ? "vi-VN" : "en-US",
            image: postImageUrl(post),
            author: { "@id": `${SITE_URL}#person` },
            keywords: post.categories.join(", ") || undefined,
        })),
    };

    const itemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": `${siteUrl}#latest-posts`,
        name:
            locale === "vi"
                ? "Bài viết mới nhất"
                : "Latest posts",
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: featuredPosts.length,
        itemListElement: featuredPosts.map((post, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE_URL}/${locale}/posts/${post.slug}`,
            name: post.title,
        })),
    };

    return (
        <Container>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
            />
            <StoryBar stories={stories} locale={locale} labels={dictionary.story} />
            <h2 className="mb-8 text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
                {dictionary.ui.latestHeading}
            </h2>
            <HeroPost
                title={heroPost.title}
                categories={heroPost.categories}
                coverImage={heroPost.coverImage}
                date={heroPost.date}
                author={heroPost.author}
                slug={heroPost.slug}
                excerpt={heroPost.excerpt}
                locale={locale}
                addresses={heroPost.addresses}
            />
            {morePosts.length > 0 && (
                <MoreStories posts={morePosts} locale={locale} title={dictionary.ui.moreStories} />
            )}
        </Container>
    );
}
