import { Post } from "@/interfaces/post";
import { type Locale } from "@/i18n/config";
import { PostPreview } from "./post-preview";
import { ProgressiveList } from "./progressive-list";

type Props = {
    posts: Post[];
    locale: Locale;
    title: string;
};

export function MoreStories({ posts, locale, title }: Props) {
    return (
        <section>
            <h2 className="mb-8 text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
                {title}
            </h2>
            <ProgressiveList
                initial={4}
                step={4}
                className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16 lg:gap-x-32 gap-y-20 md:gap-y-32
                mb-32"
            >
                {posts.map((post) => (
                    <PostPreview
                        key={post.slug}
                        title={post.title}
                        categories={post.categories}
                        coverImage={post.coverImage}
                        date={post.date}
                        author={post.author}
                        slug={post.slug}
                        excerpt={post.excerpt}
                        locale={locale}
                        addresses={post.addresses}
                    />
                ))}
            </ProgressiveList>
        </section>
    );
}
