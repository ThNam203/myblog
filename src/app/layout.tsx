/**
 * Pass-through root layout.
 *
 * The real document shell (<html lang>, <head>, <body>) lives in
 * src/app/[locale]/layout.tsx so that <html lang> is rendered statically with
 * the correct per-route locale. All user-facing pages route through [locale];
 * the only non-locale routes are the redirect-only catch-all and route handlers
 * (robots, sitemap, auth callback), none of which need a document shell.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return children;
}
