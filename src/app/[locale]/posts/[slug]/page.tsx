import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/api";
import markdownToHtml from "@/lib/markdownToHtml";
import { estimateReadingMinutes, processPostHtmlAsync } from "@/lib/post-html";
import Container from "@/app/_components/container";
import { PostBody } from "@/app/_components/post-body";
import { PostHeader } from "@/app/_components/post-header";
import { CommentSection } from "@/app/_components/comments/comment-section";
import { PostReactions } from "@/app/_components/post-reactions";
import { PostViewTracker } from "@/app/_components/post-view-tracker";
import { ScrollProgress } from "@/app/_components/scroll-progress";
import { RelatedPosts } from "@/app/_components/related-posts";
import { getDictionary } from "@/i18n/dictionaries";
import { isValidLocale } from "@/i18n/config";

type Params = {
    params: Promise<{
        slug: string;
        locale: string;
    }>;
};

export default async function Post(props: Params) {
    const params = await props.params;
    if (!isValidLocale(params.locale)) {
        return notFound();
    }

    const post = getPostBySlug(params.slug, params.locale);

    if (!post) {
        return notFound();
    }

    const rawHtml = await markdownToHtml(post.content || "");
    const { html } = await processPostHtmlAsync(rawHtml);
    const readingMinutes = estimateReadingMinutes(post.content || "");
    const dictionary = getDictionary(params.locale);
    const related = getRelatedPosts(params.slug, params.locale);

    return (
        <main>
            <PostViewTracker postSlug={params.slug} />
            <ScrollProgress />
            <Container>
                <article className="mb-32 min-w-0">
                    <PostHeader
                        title={post.title}
                        categories={post.categories}
                        coverImage={post.coverImage}
                        date={post.date}
                        author={post.author}
                        locale={params.locale}
                        addresses={post.addresses}
                        readingMinutes={readingMinutes}
                        readingTimeLabel={dictionary.ui.postReadingTime}
                    />
                    <PostBody content={html} />
                </article>
                <PostReactions
                    postSlug={params.slug}
                    reactionLabel={dictionary.ui.reactionsLabel}
                />
                <RelatedPosts
                    posts={related}
                    locale={params.locale}
                    heading={dictionary.ui.postRelatedHeading}
                />
                <CommentSection postSlug={params.slug} locale={params.locale} />
            </Container>
        </main>
    );
}

export async function generateMetadata(props: Params): Promise<Metadata> {
    const params = await props.params;
    if (!isValidLocale(params.locale)) {
        return {};
    }

    const post = getPostBySlug(params.slug, params.locale);
    if (!post) {
        return notFound();
    }

    const dictionary = getDictionary(params.locale);
    const title = `${post.title} | ${dictionary.metadata.siteName}`;
    const explicitOg = post.ogImage?.url;

    return {
        title,
        openGraph: {
            title,
            ...(explicitOg ? { images: [explicitOg] } : {}),
        },
    };
}

export async function generateStaticParams() {
    const viPosts = getAllPosts("vi");
    const enPosts = getAllPosts("en");

    return [
        ...viPosts.map((post) => ({
            locale: "vi",
            slug: post.slug,
        })),
        ...enPosts.map((post) => ({
            locale: "en",
            slug: post.slug,
        })),
    ];
}
