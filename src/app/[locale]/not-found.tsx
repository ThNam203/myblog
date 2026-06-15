import Link from "next/link";
import { headers } from "next/headers";
import Container from "@/app/_components/container";
import { getDictionary } from "@/i18n/dictionaries";
import { isValidLocale, defaultLocale, type Locale } from "@/i18n/config";

export default async function NotFound() {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "";
    const segment = pathname.split("/")[1];
    const locale: Locale = isValidLocale(segment) ? segment : defaultLocale;
    const dictionary = getDictionary(locale);

    return (
        <Container>
            <div className="mx-auto max-w-2xl py-24 px-4 md:px-0 text-center">
                <p className="text-8xl font-bold text-black dark:text-white mb-6">404</p>
                <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white mb-4">
                    {dictionary.ui.notFoundHeading}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mb-10">
                    {dictionary.ui.notFoundDescription}
                </p>
                <Link
                    href={`/${locale}`}
                    className="inline-block rounded-xl border border-neutral-200 bg-white px-5 py-3 font-semibold text-black transition-colors hover:bg-neutral-100 dark:border-slate-700 dark:bg-slate-900/40 dark:text-white dark:hover:bg-slate-900"
                >
                    ← {dictionary.ui.notFoundCta}
                </Link>
            </div>
        </Container>
    );
}
