"use client";

import { parseISO, format } from "date-fns";
import { vi as viLocale, enUS } from "date-fns/locale";
import { type Locale } from "@/i18n/config";

type Props = {
    dateString: string;
    locale?: Locale;
};

const DateFormatter = ({ dateString, locale = "vi" }: Props) => {
    const date = parseISO(dateString);
    const dateLocale = locale === "vi" ? viLocale : enUS;

    return (
        <time dateTime={dateString} suppressHydrationWarning>
            {format(date, "LLLL d, yyyy HH:mm", { locale: dateLocale })}
        </time>
    );
};

export default DateFormatter;
