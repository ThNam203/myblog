import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/app/_components/container";
import { getAuthorInfo } from "@/data/author";
import { getDictionary } from "@/i18n/dictionaries";
import { isValidLocale, type Locale } from "@/i18n/config";

type Props = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    if (!isValidLocale(locale)) return {};
    const dictionary = getDictionary(locale);
    return {
        title: `${dictionary.ui.aboutPageMetaTitle} · ${dictionary.metadata.siteName}`,
        description: dictionary.ui.aboutPageDescription,
    };
}

export default async function AboutPage({ params }: Props) {
    const { locale } = await params;
    if (!isValidLocale(locale)) {
        notFound();
    }

    const dictionary = getDictionary(locale as Locale);
    const author = getAuthorInfo(locale as Locale);

    return (
        <>
        <div className="relative h-48 w-full overflow-hidden md:h-64">
            <Image
                src="/assets/avatar/my_bg.jpg"
                alt="Profile background"
                fill
                className="object-cover"
                priority
            />
        </div>
        <Container>
            <div className="mx-auto max-w-2xl py-8 px-4 md:px-0">
                <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <h1 className="text-4xl font-bold tracking-tighter leading-tight text-black dark:text-white md:text-6xl">
                        {dictionary.ui.aboutPageMetaTitle}
                    </h1>
                    <Link
                        href={`/${locale}`}
                        className="shrink-0 text-sm text-black underline-offset-2 hover:underline dark:text-white dark:hover:text-white"
                    >
                        ← {dictionary.ui.headerTitle}
                    </Link>
                </div>

                <section className="mb-10 flex items-center gap-5">
                    <img
                        src={author.picture}
                        alt={author.name}
                        className="h-24 w-24 rounded-full"
                    />
                    <div>
                        <p className="text-2xl font-bold text-black dark:text-white">
                            {author.name}
                        </p>
                        <p className="text-black dark:text-neutral-200">{author.title}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {author.location}
                        </p>
                    </div>
                </section>

                <section className="mb-10">
                    <p className="text-lg leading-relaxed text-black dark:text-neutral-100">
                        {author.bio}
                    </p>
                </section>

                <section className="mb-10">
                    <h2 className="mb-4 text-lg font-semibold tracking-tight text-black dark:text-white">
                        {dictionary.ui.aboutEducationHeading}
                    </h2>
                    <ul className="space-y-2">
                        {author.education.map((entry) => (
                            <li key={entry.school}>
                                <p className="text-black dark:text-neutral-100">
                                    {entry.school}
                                </p>
                                {(entry.detail || entry.period) && (
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {[entry.detail, entry.period]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="mb-10">
                    <h2 className="mb-4 text-lg font-semibold tracking-tight text-black dark:text-white">
                        {dictionary.ui.aboutHobbiesHeading}
                    </h2>
                    <ul className="flex flex-wrap gap-2">
                        {author.hobbies.map((hobby) => (
                            <li
                                key={hobby}
                                className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm text-black dark:border-slate-700 dark:bg-slate-900/40 dark:text-neutral-100"
                            >
                                {hobby}
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="mb-10">
                    <h2 className="mb-4 text-lg font-semibold tracking-tight text-black dark:text-white">
                        {dictionary.ui.aboutLinksHeading}
                    </h2>
                    <ul className="space-y-2">
                        {author.socials.map((social) => (
                            <li
                                key={social.label}
                                className="flex flex-wrap items-baseline gap-x-3"
                            >
                                <a
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-black underline-offset-2 hover:underline dark:text-white"
                                >
                                    {social.label}
                                </a>
                                <span className="break-all text-sm text-neutral-500 dark:text-neutral-400">
                                    {social.href.replace(/^(https?:\/\/|mailto:)/, "")}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>

                <a
                    href={author.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-xl border border-neutral-200 bg-white px-5 py-3 font-semibold text-black transition-colors hover:bg-neutral-100 dark:border-slate-700 dark:bg-slate-900/40 dark:text-white dark:hover:bg-slate-900"
                >
                    {dictionary.ui.aboutPortfolioCta} →
                </a>
            </div>
        </Container>
        </>
    );
}
