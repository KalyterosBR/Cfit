import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from "react";

import {
    ThemeContext,
    getInitialTheme,
    THEME_STORAGE_KEY,
    type ColorTheme,
    type ThemeContextValue,
} from "./theme-context";


export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<ColorTheme>(getInitialTheme);

    useLayoutEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        root.dataset.cfitTheme = theme;
        root.style.colorScheme = theme;
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((current) => {
            const nextTheme = current === "light" ? "dark" : "light";
            try {
                localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
            } catch {
                // A troca continua válida durante a sessão quando o storage é bloqueado.
            }
            return nextTheme;
        });
    }, []);

    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        toggleTheme,
    }), [theme, toggleTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
