"use client";

import cn from "classnames";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthModal, type AuthModalTab } from "@/app/_components/comments/auth-modal";
import { SiteSearchDialog, SearchGlyph } from "@/app/_components/site-search-dialog";
import { createClient } from "@/lib/supabase/client";
import type { AuthModalLabels, SearchDialogLabels } from "@/i18n/dictionaries";
import { defaultLocale, type Locale } from "@/i18n/config";
import { swapLocaleInPathname } from "@/i18n/swap-locale-path";
import {
    THEME_MENU_OPTIONS,
    type ColorSchemePreference,
    useColorSchemePreference,
} from "@/app/_components/theme-switcher";

function DefaultAvatar() {
    return (
        <span
            className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                "border-neutral-300 bg-neutral-100 text-neutral-500",
                "dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400",
            )}
            aria-hidden
        >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
        </span>
    );
}

function ChevronDown({ open }: { open: boolean }) {
    return (
        <svg
            className={cn(
                "h-4 w-4 shrink-0 text-neutral-600 transition-transform dark:text-slate-300",
                open && "rotate-180",
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}

type ThemeLabelMap = Record<ColorSchemePreference, string>;

type Props = {
    locale: Locale;
    vietnameseLabel: string;
    englishLabel: string;
    languageSectionLabel: string;
    themeLabels: ThemeLabelMap;
    labels: {
        menuOpenAria: string;
        themeSection: string;
        signIn: string;
        signUp: string;
        signOut: string;
        profile: string;
        admin: string;
    };
    adminEmail: string;
    authModal: AuthModalLabels;
    searchDialog: SearchDialogLabels;
};

export function HeaderSiteMenu({
    locale,
    vietnameseLabel,
    englishLabel,
    languageSectionLabel,
    themeLabels,
    labels,
    adminEmail,
    authModal,
    searchDialog,
}: Props) {
    const router = useRouter();
    const pathname = usePathname() ?? `/${defaultLocale}`;
    const [menuOpen, setMenuOpen] = useState(false);
    const [authSession, setAuthSession] = useState<{ tab: AuthModalTab; id: number } | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [auth, setAuth] = useState<{
        isAuthenticated: boolean;
        avatarUrl: string | null;
        email: string | null;
    }>({
        isAuthenticated: false,
        avatarUrl: null,
        email: null,
    });
    const rootRef = useRef<HTMLDivElement>(null);
    const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
    const { mode, setMode, isMounted } = useColorSchemePreference();

    useEffect(() => {
        const supabase = createClient();
        supabaseRef.current = supabase;
        let active = true;

        const deriveAvatar = (
            metadata: { avatar_url?: string; picture?: string } | undefined,
        ): string | null =>
            (typeof metadata?.avatar_url === "string" && metadata.avatar_url) ||
            (typeof metadata?.picture === "string" && metadata.picture) ||
            null;

        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!active) return;
            setAuth({
                isAuthenticated: !!user,
                avatarUrl: deriveAvatar(user?.user_metadata),
                email: user?.email ?? null,
            });
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const user = session?.user ?? null;
            setAuth({
                isAuthenticated: !!user,
                avatarUrl: deriveAvatar(user?.user_metadata),
                email: user?.email ?? null,
            });
        });

        return () => {
            active = false;
            subscription.unsubscribe();
            supabaseRef.current = null;
        };
    }, []);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent): void => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        const handleEscape = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    useEffect(() => {
        const isTypingTarget = (target: EventTarget | null): boolean => {
            const el = target as HTMLElement | null;
            if (!el) return false;
            if (el.isContentEditable) return true;
            const tag = el.tagName;
            return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
        };
        const handleShortcut = (event: KeyboardEvent): void => {
            const isMeta = event.metaKey || event.ctrlKey;
            if (isMeta && (event.key === "k" || event.key === "K")) {
                event.preventDefault();
                setSearchOpen(true);
                return;
            }
            if (event.key === "/" && !isMeta && !event.altKey && !isTypingTarget(event.target)) {
                event.preventDefault();
                setSearchOpen(true);
            }
        };
        document.addEventListener("keydown", handleShortcut);
        return () => document.removeEventListener("keydown", handleShortcut);
    }, []);

    function openAuth(tab: AuthModalTab) {
        setMenuOpen(false);
        setAuthSession((prev) => ({ tab, id: (prev?.id ?? 0) + 1 }));
    }

    async function handleSignOut() {
        setMenuOpen(false);
        await supabaseRef.current?.auth.signOut();
        router.refresh();
    }

    function selectTheme(next: ColorSchemePreference) {
        setMode(next);
        setMenuOpen(false);
    }

    const menuItemClass =
        "block w-full rounded-md px-3 py-2 text-left text-sm text-neutral-800 " +
        "hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-slate-800";

    const themeRowClass = (active: boolean) =>
        cn(menuItemClass, active && "bg-neutral-100 font-medium dark:bg-slate-800");

    return (
        <div ref={rootRef} className="relative flex items-center gap-2">
            <button
                type="button"
                className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white",
                    "outline-none ring-offset-2 transition-colors hover:bg-neutral-50",
                    "focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-slate-600",
                    "dark:bg-slate-900 dark:hover:bg-slate-800 dark:ring-offset-slate-950",
                    "dark:focus-visible:ring-slate-500",
                )}
                aria-label={searchDialog.openAria}
                aria-expanded={searchOpen}
                aria-haspopup="dialog"
                onClick={() => setSearchOpen(true)}
            >
                <SearchGlyph className="h-4 w-4 text-neutral-700 dark:text-slate-200" />
            </button>
            <button
                type="button"
                className={cn(
                    "flex items-center gap-1 rounded-full border border-neutral-300 bg-white py-1 pl-1 pr-2",
                    "outline-none ring-offset-2 transition-colors hover:bg-neutral-50",
                    "focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-slate-600",
                    "dark:bg-slate-900 dark:hover:bg-slate-800 dark:ring-offset-slate-950",
                    "dark:focus-visible:ring-slate-500",
                )}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label={labels.menuOpenAria}
                onClick={() => setMenuOpen((o) => !o)}
            >
                {auth.avatarUrl ? (
                    <img
                        src={auth.avatarUrl}
                        alt=""
                        width={32}
                        height={32}
                        className={cn(
                            "h-8 w-8 rounded-full border border-neutral-300 object-cover",
                            "dark:border-slate-600",
                        )}
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <DefaultAvatar />
                )}
                <ChevronDown open={menuOpen} />
            </button>

            {menuOpen && (
                <div
                    className={cn(
                        "absolute right-0 top-full z-50 mt-2 w-60 rounded-lg border border-neutral-300",
                        "bg-white py-2 shadow-lg dark:border-slate-600 dark:bg-slate-900",
                    )}
                    role="menu"
                >
                    <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        {languageSectionLabel}
                    </p>
                    <Link
                        href={swapLocaleInPathname(pathname, "vi")}
                        className={menuItemClass}
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                    >
                        {vietnameseLabel}
                    </Link>
                    <Link
                        href={swapLocaleInPathname(pathname, "en")}
                        className={menuItemClass}
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                    >
                        {englishLabel}
                    </Link>

                    <div className="my-2 border-t border-neutral-200 dark:border-slate-700" />

                    <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        {labels.themeSection}
                    </p>
                    {THEME_MENU_OPTIONS.map((themeMode) => (
                        <button
                            key={themeMode}
                            type="button"
                            role="menuitem"
                            className={themeRowClass(isMounted && mode === themeMode)}
                            onClick={() => selectTheme(themeMode)}
                        >
                            {themeLabels[themeMode]}
                        </button>
                    ))}

                    <div className="my-2 border-t border-neutral-200 dark:border-slate-700" />

                    {auth.isAuthenticated ? (
                        <>
                            <Link
                                href={`/${locale}/profile`}
                                className={menuItemClass}
                                role="menuitem"
                                onClick={() => setMenuOpen(false)}
                            >
                                {labels.profile}
                            </Link>
                            {adminEmail && auth.email === adminEmail && (
                                <Link
                                    href={`/${locale}/admin/stories`}
                                    className={menuItemClass}
                                    role="menuitem"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {labels.admin}
                                </Link>
                            )}
                            <button
                                type="button"
                                role="menuitem"
                                className={menuItemClass}
                                onClick={() => void handleSignOut()}
                            >
                                {labels.signOut}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                role="menuitem"
                                className={menuItemClass}
                                onClick={() => openAuth("login")}
                            >
                                {labels.signIn}
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                className={menuItemClass}
                                onClick={() => openAuth("register")}
                            >
                                {labels.signUp}
                            </button>
                        </>
                    )}
                </div>
            )}

            {authSession && (
                <AuthModal
                    key={authSession.id}
                    initialTab={authSession.tab}
                    labels={authModal}
                    onClose={() => setAuthSession(null)}
                />
            )}

            <SiteSearchDialog
                open={searchOpen}
                onClose={() => setSearchOpen(false)}
                locale={locale}
                labels={searchDialog}
            />
        </div>
    );
}
