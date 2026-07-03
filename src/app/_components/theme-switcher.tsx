"use client";

import { useEffect, useRef, useState } from "react";

declare global {
    var updateDOM: () => void;
}

export type ColorSchemePreference = "system" | "dark" | "light" | "blue" | "magenta" | "pink";

const STORAGE_KEY = "nam-blog-theme";

export const THEME_MENU_OPTIONS: ColorSchemePreference[] = [
    "dark",
    "light",
    "blue",
    "magenta",
    "pink",
    "system",
];
type ThemeLabelMap = Record<ColorSchemePreference, string>;
const defaultModeLabels: ThemeLabelMap = {
    dark: "Dark",
    light: "Light",
    blue: "Blue",
    magenta: "Magenta",
    pink: "Pink",
    system: "System",
};

function isColorSchemePreference(value: string | null): value is ColorSchemePreference {
    return (
        value === "system" ||
        value === "dark" ||
        value === "light" ||
        value === "blue" ||
        value === "magenta" ||
        value === "pink"
    );
}

/** to reuse updateDOM function defined inside injected script */

/** function to be injected in script tag for avoiding FOUC (Flash of Unstyled Content) */
export const NoFOUCScript = (storageKey: string) => {
    /* can not use outside constants or function as this script will be injected in a different context */
    const [SYSTEM, DARK, LIGHT] = ["system", "dark", "light"];
    const COLOR_THEMES = ["blue", "magenta", "pink"];

    /** Modify transition globally to avoid patched transitions */
    const modifyTransition = () => {
        const css = document.createElement("style");
        css.textContent = "*,*:after,*:before{transition:none !important;}";
        document.head.appendChild(css);

        return () => {
            /* Force restyle */
            getComputedStyle(document.body);
            /* Wait for next tick before removing */
            setTimeout(() => document.head.removeChild(css), 1);
        };
    };

    const media = matchMedia(`(prefers-color-scheme: ${DARK})`);

    /** function to add remove dark class */
    window.updateDOM = () => {
        const restoreTransitions = modifyTransition();
        const mode = localStorage.getItem(storageKey) ?? SYSTEM;
        const systemMode = media.matches ? DARK : LIGHT;
        const resolvedMode = mode === SYSTEM ? systemMode : mode;
        const root = document.documentElement;
        if (resolvedMode === DARK) root.classList.add(DARK);
        else root.classList.remove(DARK);
        if (COLOR_THEMES.indexOf(mode) !== -1) root.setAttribute("data-theme", mode);
        else root.removeAttribute("data-theme");
        root.setAttribute("data-mode", mode);
        restoreTransitions();
    };
    window.updateDOM();
    media.addEventListener("change", window.updateDOM);
};

let updateDOM: () => void;

type ColorSchemePreferenceState = {
    mode: ColorSchemePreference;
    setMode: (next: ColorSchemePreference) => void;
    isMounted: boolean;
};

export function useColorSchemePreference(): ColorSchemePreferenceState {
    const [mode, setMode] = useState<ColorSchemePreference>("system");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        updateDOM = window.updateDOM;
        const storedMode = localStorage.getItem(STORAGE_KEY);
        if (isColorSchemePreference(storedMode)) {
            setMode(storedMode);
        }
        setIsMounted(true);

        const handleStorage = (e: StorageEvent): void => {
            if (e.key !== STORAGE_KEY) {
                return;
            }

            if (isColorSchemePreference(e.newValue)) {
                setMode(e.newValue);
                return;
            }

            setMode("system");
        };

        addEventListener("storage", handleStorage);

        return () => {
            removeEventListener("storage", handleStorage);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, mode);
        if (updateDOM) {
            updateDOM();
        }
    }, [mode]);

    return { mode, setMode, isMounted };
}

/**
 * Switch button to quickly toggle user preference.
 */
const Switch = ({ labels }: { labels: ThemeLabelMap }) => {
    const { mode, setMode, isMounted } = useColorSchemePreference();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const handleModeSelect = (nextMode: ColorSchemePreference) => {
        setMode(nextMode);
        setIsOpen(false);
    };

    return (
        <div ref={menuRef}>
            <button
                type="button"
                className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm font-semibold
                tracking-wide transition-colors hover:bg-neutral-100 dark:border-slate-600
                dark:bg-slate-900 dark:hover:bg-slate-800"
                onClick={() => setIsOpen((prev) => !prev)}
            >
                {isMounted ? labels[mode] : labels.system}
            </button>
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 min-w-28 rounded-md border border-neutral-300
                    bg-white p-1 shadow-lg dark:border-slate-600 dark:bg-slate-900"
                >
                    {THEME_MENU_OPTIONS.map((themeMode) => (
                        <button
                            key={themeMode}
                            type="button"
                            className="block w-full rounded px-3 py-1 text-left text-sm capitalize
                            hover:bg-neutral-100 dark:hover:bg-slate-800"
                            onClick={() => handleModeSelect(themeMode)}
                        >
                            {labels[themeMode]}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

type Props = {
    labels?: Partial<ThemeLabelMap>;
};

/**
 * This component applies classes and transitions.
 */
export const ThemeSwitcher = ({ labels }: Props) => {
    const resolvedLabels: ThemeLabelMap = {
        ...defaultModeLabels,
        ...labels,
    };

    return <Switch labels={resolvedLabels} />;
};
