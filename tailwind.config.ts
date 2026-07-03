import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            colors: {
                "accent-1": "#FAFAFA",
                "accent-2": "#EAEAEA",
                "accent-7": "#333",
                success: "#0070f3",
                cyan: "#79FFE1",
                accent: "rgb(var(--tone-accent) / <alpha-value>)",
                white: "rgb(var(--tone-white) / <alpha-value>)",
                neutral: {
                    50: "rgb(var(--tone-50) / <alpha-value>)",
                    100: "rgb(var(--tone-100) / <alpha-value>)",
                    200: "rgb(var(--tone-200) / <alpha-value>)",
                    300: "rgb(var(--tone-300) / <alpha-value>)",
                    400: "rgb(var(--tone-400) / <alpha-value>)",
                    500: "rgb(var(--tone-500) / <alpha-value>)",
                    600: "rgb(var(--tone-600) / <alpha-value>)",
                    700: "rgb(var(--tone-700) / <alpha-value>)",
                    800: "rgb(var(--tone-800) / <alpha-value>)",
                    900: "rgb(var(--tone-900) / <alpha-value>)",
                    950: "rgb(var(--tone-950) / <alpha-value>)",
                },
            },
            spacing: {
                28: "7rem",
            },
            letterSpacing: {
                tighter: "-.04em",
            },
            fontSize: {
                "5xl": "2.5rem",
                "6xl": "2.75rem",
                "7xl": "4.5rem",
                "8xl": "6.25rem",
            },
            boxShadow: {
                sm: "0 5px 10px rgba(0, 0, 0, 0.12)",
                md: "0 8px 30px rgba(0, 0, 0, 0.12)",
            },
        },
    },
    plugins: [],
};
export default config;
