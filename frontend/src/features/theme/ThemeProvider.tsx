import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
    ThemeContext,
    getInitialTheme,
    THEME_STORAGE_KEY,
    type ColorTheme,
    type ThemeContextValue,
} from "./theme-context";


export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<ColorTheme>(getInitialTheme);
    const transitionFrame = useRef<number | null>(null);

    useLayoutEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        root.dataset.cfitTheme = theme;
        root.style.colorScheme = theme;
    }, [theme]);

    useEffect(() => () => {
        if (transitionFrame.current !== null) {
            window.cancelAnimationFrame(transitionFrame.current);
        }
        document.documentElement.classList.remove("cfit-theme-changing");
    }, []);

    const toggleTheme = useCallback(() => {
        const root = document.documentElement;
        root.classList.add("cfit-theme-changing");
        if (transitionFrame.current !== null) {
            window.cancelAnimationFrame(transitionFrame.current);
        }

        setTheme((current) => {
            const nextTheme = current === "light" ? "dark" : "light";
            try {
                localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
            } catch {
                // A troca continua válida durante a sessão quando o storage é bloqueado.
            }
            return nextTheme;
        });

        transitionFrame.current = window.requestAnimationFrame(() => {
            transitionFrame.current = window.requestAnimationFrame(() => {
                root.classList.remove("cfit-theme-changing");
                transitionFrame.current = null;
            });
        });
    }, []);

    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        toggleTheme,
    }), [theme, toggleTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
