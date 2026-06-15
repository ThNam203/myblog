import Link from "next/link";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default function NotFound() {
    const dictionary = getDictionary(defaultLocale);

    return (
        <html lang={defaultLocale}>
            <body>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "100vh",
                        fontFamily: "sans-serif",
                        textAlign: "center",
                        padding: "2rem",
                    }}
                >
                    <p style={{ fontSize: "5rem", fontWeight: 700, margin: 0 }}>404</p>
                    <h1 style={{ fontSize: "1.5rem", margin: "1rem 0 0.5rem" }}>
                        {dictionary.ui.notFoundHeading}
                    </h1>
                    <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
                        {dictionary.ui.notFoundDescription}
                    </p>
                    <Link
                        href={`/${defaultLocale}`}
                        style={{
                            padding: "0.75rem 1.25rem",
                            border: "1px solid #e5e7eb",
                            borderRadius: "0.75rem",
                            fontWeight: 600,
                            textDecoration: "none",
                            color: "#000",
                        }}
                    >
                        ← {dictionary.ui.notFoundCta}
                    </Link>
                </div>
            </body>
        </html>
    );
}
