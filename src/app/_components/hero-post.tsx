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
        <section className="mb-20 min-[1000px]:mb-28">
            <div className="min-[1000px]:grid min-[1000px]:grid-cols-2 min-[1000px]:gap-x-8 lg:gap-x-16 min-[1000px]:items-center">
                {coverImage ? (
                    <div className="mb-8 md:mb-16 min-[1000px]:mb-0">
                        <CoverImage
                            title={title}
                            src={coverImage}
                            slug={slug}
                            locale={locale}
                            preload={true}
                        />
                    </div>
                ) : null}
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
                    <p className="text-lg leading-relaxed mb-4">{excerpt}</p>
                    <Avatar name={author.name} picture={author.picture} locale={locale} />
                </div>
            </div>
        </section>
    );
}
