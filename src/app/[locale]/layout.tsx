import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import cn from "classnames";
import Alert from "@/app/_components/alert";
import Footer from "@/app/_components/footer";
import { SiteMusicPlayer } from "@/app/_components/site-music-player";
import { HeaderSiteMenu } from "@/app/_components/header-site-menu";
import { SiteToastContainer } from "@/app/_components/site-toast-container";
import {
    LETSLIVE_URL,
    WEB_DEFAULT_AUTHOR,
    WEB_DEFAULT_INSTAGRAM_URL,
    WEB_DEFAULT_URL,
} from "@/lib/constants";
import { getAuthModalLabels, getDictionary, getSearchDialogLabels } from "@/i18n/dictionaries";
import { isValidLocale, type Locale } from "@/i18n/config";
import { MUSIC_TRACKS } from "@/lib/music-tracks";
import { StoriesOpenProvider } from "@/lib/stories/stories-open-context";
import { buildNoFoucScript } from "@/lib/theme/no-fouc-script";
import { Intro } from "../_components/intro";
import "../globals.css";

const DEFAULT_OG_IMAGE = "/assets/images/05052026_raining.webp";

const inter = Inter({ subsets: ["latin"], display: "swap", preload: true });
const THEME_STORAGE_KEY = "nam-blog-theme";
const noFoucScript = buildNoFoucScript(THEME_STORAGE_KEY);

type Props = {
    children: React.ReactNode;
    params: Promise<{
        locale: string;
    }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    if (!isValidLocale(locale)) {
        return {};
    }

    const dictionary = getDictionary(locale);
    const { title, description, siteName, keywords } = dictionary.metadata;
    const ogLocale = locale === "vi" ? "vi_VN" : "en_US";
    const alternateOgLocale = locale === "vi" ? "en_US" : "vi_VN";

    return {
        metadataBase: new URL(WEB_DEFAULT_URL),
        title: {
            default: title,
            template: `%s — ${siteName}`,
        },
        description,
        keywords,
        applicationName: siteName,
        authors: [{ name: WEB_DEFAULT_AUTHOR }],
        creator: WEB_DEFAULT_AUTHOR,
        publisher: WEB_DEFAULT_AUTHOR,
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-image-preview": "large",
                "max-snippet": -1,
                "max-video-preview": -1,
            },
        },
        alternates: {
            types: {
                "application/rss+xml": `/${locale}/rss.xml`,
            },
        },
        openGraph: {
            type: "website",
            siteName,
            locale: ogLocale,
            alternateLocale: [alternateOgLocale],
            title,
            description,
            url: `/${locale}`,
            images: [
                {
                    url: DEFAULT_OG_IMAGE,
                    width: 1600,
                    height: 900,
                    alt: siteName,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [DEFAULT_OG_IMAGE],
        },
    };
}

export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = await params;
    if (!isValidLocale(locale)) {
        notFound();
    }

    const dictionary = getDictionary(locale as Locale);

    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
                <link rel="manifest" href="/favicon/site.webmanifest" />
                <link rel="shortcut icon" href="/favicon/favicon.ico" />
                <meta name="msapplication-TileColor" content="#000000" />
                <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
                <meta name="theme-color" content="#000" />
                <script dangerouslySetInnerHTML={{ __html: noFoucScript }} />
            </head>
            <body className={cn(inter.className, "dark:bg-slate-900 dark:text-slate-400")}>
                <Alert
                    textPrefix={dictionary.ui.alertTextPrefix}
                    linkLabel={dictionary.ui.alertLinkLabel}
                    sideWebsiteUrl={LETSLIVE_URL}
                />
                <header className="md:container mx-auto px-4 md:px-0 flex items-center justify-between">
                    <Intro
                        heading={dictionary.ui.blogHeading}
                        homeHref={`/${locale}`}
                        secondaryNav={{
                            href: `/${locale}/confessions`,
                            label: dictionary.ui.confessionsNavLabel,
                        }}
                    />
                    <div className="relative flex items-center gap-2">
                        <HeaderSiteMenu
                            locale={locale}
                            vietnameseLabel={dictionary.ui.languageOptionVietnamese}
                            englishLabel={dictionary.ui.languageOptionEnglish}
                            languageSectionLabel={dictionary.ui.languageLabel}
                            themeLabels={{
                                dark: dictionary.ui.themeDark,
                                light: dictionary.ui.themeLight,
                                system: dictionary.ui.themeSystem,
                            }}
                            labels={{
                                menuOpenAria: dictionary.ui.headerMenuOpenAria,
                                themeSection: dictionary.ui.headerMenuTheme,
                                signIn: dictionary.ui.headerMenuSignIn,
                                signUp: dictionary.ui.headerMenuSignUp,
                                signOut: dictionary.ui.headerMenuSignOut,
                                profile: dictionary.ui.headerMenuProfile,
                            }}
                            authModal={getAuthModalLabels(dictionary)}
                            searchDialog={getSearchDialogLabels(dictionary)}
                        />
                    </div>
                </header>
                <StoriesOpenProvider>
                    <main id="site-main" className="pb-8 px-4 md:px-0">
                        {children}
                    </main>
                    {MUSIC_TRACKS.length > 0 && (
                        <SiteMusicPlayer
                            tracks={MUSIC_TRACKS}
                            labels={{
                                play: dictionary.ui.musicPlay,
                                pause: dictionary.ui.musicPause,
                                expand: dictionary.ui.musicExpand,
                                collapse: dictionary.ui.musicCollapse,
                                previous: dictionary.ui.musicPrevious,
                                next: dictionary.ui.musicNext,
                                minimize: dictionary.ui.musicMinimize,
                                restore: dictionary.ui.musicRestore,
                                showPlaylist: dictionary.ui.musicShowPlaylist,
                                playlistHeading: dictionary.ui.musicPlaylistHeading,
                                nowPlaying: dictionary.ui.musicNowPlaying,
                            }}
                        />
                    )}
                </StoriesOpenProvider>
                <Footer
                    description={dictionary.metadata.description}
                    sideWebsiteUrl={LETSLIVE_URL}
                    instagramUrl={WEB_DEFAULT_INSTAGRAM_URL}
                    primaryCta={dictionary.ui.footerPrimaryCta}
                    secondaryCta={dictionary.ui.footerSecondaryCta}
                    locale={locale as Locale}
                    quotes={dictionary.ui.footerQuotes}
                    quotePrevAria={dictionary.ui.footerQuotePrevAria}
                    quoteNextAria={dictionary.ui.footerQuoteNextAria}
                    newsletter={{
                        heading: dictionary.ui.newsletterHeading,
                        description: dictionary.ui.newsletterDescription,
                        placeholder: dictionary.ui.newsletterEmailPlaceholder,
                        submit: dictionary.ui.newsletterSubmit,
                        submitting: dictionary.ui.newsletterSubmitting,
                        success: dictionary.ui.newsletterSuccess,
                        genericError: dictionary.ui.newsletterErrorGeneric,
                    }}
                />
                <SiteToastContainer />
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
