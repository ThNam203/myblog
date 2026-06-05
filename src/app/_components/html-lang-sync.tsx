"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/config";

/**
 * Keeps <html lang> in sync with the active route locale.
 *
 * The root layout is statically rendered, so its <html lang> is the default
 * locale at build time. This client component corrects it per route on the
 * client without forcing the layout into dynamic rendering.
 */
export function HtmlLangSync({ locale }: { locale: Locale }) {
    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    return null;
}
