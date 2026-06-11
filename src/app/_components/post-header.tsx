import Avatar from "./avatar";
import CoverImage from "./cover-image";
import DateFormatter from "./date-formatter";
import { PostTitle } from "@/app/_components/post-title";
import { ReadingTime } from "./reading-time";
import { type Author } from "@/interfaces/author";
import { type Locale } from "@/i18n/config";
import { PostCategories } from "./post-categories";
import { PostAddress } from "./post-address";
import { type PostAddress as PostAddressType } from "@/interfaces/post";

type Props = {
    title: string;
    categories: string[];
    coverImage?: string;
    date: string;
    author: Author;
    locale: Locale;
    addresses?: PostAddressType[];
    readingMinutes?: number;
    readingTimeLabel?: string;
};

export function PostHeader({
    title,
    categories,
    coverImage,
    date,
    author,
    locale,
    addresses,
    readingMinutes,
    readingTimeLabel,
}: Props) {
    return (
        <>
            <PostTitle>{title}</PostTitle>
            <div className="hidden md:block md:mb-12">
                <Avatar name={author.name} picture={author.picture} locale={locale} />
            </div>
            {coverImage ? (
                <div className="mb-8 md:mb-16 sm:mx-0">
                    <CoverImage title={title} src={coverImage} preload={true} />
                </div>
            ) : null}
            <div className="max-w-2xl mx-auto">
                <div className="block md:hidden mb-6">
                    <Avatar name={author.name} picture={author.picture} locale={locale} />
                </div>
                <PostCategories categories={categories} locale={locale} />
                <div className="mb-6 text-lg flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <DateFormatter dateString={date} locale={locale} />
                    {readingMinutes && readingTimeLabel ? (
                        <>
                            <span className="text-neutral-300 dark:text-neutral-600" aria-hidden>
                                ·
                            </span>
                            <ReadingTime minutes={readingMinutes} label={readingTimeLabel} />
                        </>
                    ) : null}
                </div>
                {addresses && addresses.length > 0 && (
                    <div className="mb-6">
                        <PostAddress addresses={addresses} />
                    </div>
                )}
            </div>
        </>
    );
}
