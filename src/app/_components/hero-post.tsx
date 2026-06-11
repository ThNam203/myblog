import Avatar from "@/app/_components/avatar";
import CoverImage from "@/app/_components/cover-image";
import { type Locale } from "@/i18n/config";
import { type Author } from "@/interfaces/author";
import { type PostAddress } from "@/interfaces/post";
import Link from "next/link";
import DateFormatter from "./date-formatter";
import { PostAddress as PostAddressDetails } from "./post-address";
import { PostCategories } from "./post-categories";

type Props = {
    title: string;
    categories: string[];
    coverImage?: string;
    date: string;
    excerpt: string;
    author: Author;
    slug: string;
    locale: Locale;
    addresses?: PostAddress[];
};

export function HeroPost({
    title,
    categories,
    coverImage,
    date,
    excerpt,
    author,
    slug,
    locale,
    addresses,
}: Props) {
    return (
        <section>
            {coverImage ? (
                <div className="mb-8 md:mb-16">
                    <CoverImage
                        title={title}
                        src={coverImage}
                        slug={slug}
                        locale={locale}
                        preload={true}
                    />
                </div>
            ) : null}
            <div className="md:grid md:grid-cols-2 md:gap-x-16 lg:gap-x-8 mb-20 md:mb-28">
                <div>
                    <PostCategories categories={categories} locale={locale} />
                    <h3 className="mb-4 text-4xl lg:text-5xl leading-tight">
                        <Link href={`/${locale}/posts/${slug}`} className="hover:underline">
                            {title}
                        </Link>
                    </h3>
                    <div className="mb-4 text-lg">
                        <DateFormatter dateString={date} locale={locale} />
                    </div>
                    {addresses && addresses.length > 0 ? (
                        <div className="mb-4">
                            <PostAddressDetails addresses={addresses} />
                        </div>
                    ) : null}
                </div>
                <div>
                    <p className="text-lg leading-relaxed mb-4">{excerpt}</p>
                    <Avatar name={author.name} picture={author.picture} locale={locale} />
                </div>
            </div>
        </section>
    );
}
