import cn from "classnames";
import Link from "next/link";
import Image from "next/image";
import { type Locale } from "@/i18n/config";

type Props = {
    title: string;
    src: string;
    slug?: string;
    locale?: Locale;
    preload?: boolean;
};

const CoverImage = ({ title, src, slug, locale, preload = false }: Props) => {
    const image = (
        <Image
            src={src}
            alt={`Cover Image for ${title}`}
            className={cn("shadow-sm w-full max-h-[400px] max-w-[800px] mx-auto", {
                "hover:shadow-lg transition-shadow duration-200": slug,
            })}
            width={800}
            height={400}
            preload={preload}
            loading={preload ? "eager" : "lazy"}
            quality={75}
        />
    );
    return (
        <div className="sm:mx-0">
            {slug ? (
                <Link
                    href={locale ? `/${locale}/posts/${slug}` : `/posts/${slug}`}
                    aria-label={title}
                >
                    {image}
                </Link>
            ) : (
                image
            )}
        </div>
    );
};

export default CoverImage;
