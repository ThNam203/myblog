import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCategories, getPostsByCategory } from "@/lib/api";
import Container from "@/app/_components/container";
import { MoreStories } from "@/app/_components/more-stories";
import { getDictionary } from "@/i18n/dictionaries";
import { isValidLocale, locales } from "@/i18n/config";
import { deslugifyCategory, slugifyCategory } from "@/lib/category";

type Props = {
    params: Promise<{ locale: string; category: string }>;
};

export default async function CategoryPage({ params }: Props) {
    const { locale, category: categorySlug } = await params;

    if (!isValidLocale(locale)) {
        notFound();
    }

    const categoryName = deslugifyCategory(categorySlug);
    const dictionary = getDictionary(locale);
    const posts = getPostsByCategory(categoryName, locale);

    if (posts.length === 0) {
        notFound();
    }

    return (
        <main>
            <Container>
                <h2 className="mb-8 text-4xl md:text-6xl font-bold tracking-tighter leading-tight">
                    {dictionary.ui.postsInCategory}{" "}
                    <span className="capitalize">{categoryName}</span>
                </h2>
                <MoreStories posts={posts} locale={locale} title="" />
            </Container>
        </main>
    );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, category: categorySlug } = await params;
    if (!isValidLocale(locale)) return {};

    const dictionary = getDictionary(locale);
    const categoryName = deslugifyCategory(categorySlug);
    const title = `${dictionary.ui.postsInCategory} ${categoryName} | ${dictionary.metadata.siteName}`;

    return { title };
}

export async function generateStaticParams() {
    return locales.flatMap((locale) =>
        getAllCategories(locale).map((category) => ({
            locale,
            category: slugifyCategory(category),
        })),
    );
}
