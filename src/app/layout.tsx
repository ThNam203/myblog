import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import cn from "classnames";
import { cookies } from "next/headers";
import { defaultLocale, isValidLocale } from "@/i18n/config";

import "./globals.css";
import { SiteToastContainer } from "@/app/_components/site-toast-container";

const inter = Inter({ subsets: ["latin"], display: "swap", preload: true });
const THEME_STORAGE_KEY = "nam-blog-theme";
const noFoucScript = `(() => {
  const SYSTEM = "system";
  const DARK = "dark";
  const LIGHT = "light";
  const storageKey = "${THEME_STORAGE_KEY}";

  const modifyTransition = () => {
    const css = document.createElement("style");
    css.textContent = "*,*:after,*:before{transition:none !important;}";
    document.head.appendChild(css);
    return () => {
      getComputedStyle(document.body);
      setTimeout(() => document.head.removeChild(css), 1);
    };
  };

  const media = matchMedia("(prefers-color-scheme: dark)");
  window.updateDOM = () => {
    const restoreTransitions = modifyTransition();
    const mode = localStorage.getItem(storageKey) ?? SYSTEM;
    const systemMode = media.matches ? DARK : LIGHT;
    const resolvedMode = mode === SYSTEM ? systemMode : mode;
    const classList = document.documentElement.classList;
    if (resolvedMode === DARK) classList.add(DARK);
    else classList.remove(DARK);
    document.documentElement.setAttribute("data-mode", mode);
    restoreTransitions();
  };
  window.updateDOM();
  media.addEventListener("change", window.updateDOM);
})();`;

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
    const locale = cookieLocale && isValidLocale(cookieLocale) ? cookieLocale : defaultLocale;

    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
                <link rel="manifest" href="/favicon/site.webmanifest" />
                {/* <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#000000" /> */}
                <link rel="shortcut icon" href="/favicon/favicon.ico" />
                <meta name="msapplication-TileColor" content="#000000" />
                <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
                <meta name="theme-color" content="#000" />
                <link rel="alternate" type="application/rss+xml" href={`/${locale}/rss.xml`} />
                <script dangerouslySetInnerHTML={{ __html: noFoucScript }} />
            </head>
            <body className={cn(inter.className, "dark:bg-slate-900 dark:text-slate-400")}>
                {children}
                <SiteToastContainer />
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
