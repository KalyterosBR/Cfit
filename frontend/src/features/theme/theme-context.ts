import { createContext } from "react";


export type ColorTheme = "light" | "dark";


export type ThemeContextValue = {
    theme: ColorTheme;
    toggleTheme: () => void;
};


export const THEME_STORAGE_KEY = "cfit_color_theme";
export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function getInitialTheme(): ColorTheme {
    try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    } catch {
        // Usa a preferência do sistema quando o storage não está disponível.
    }

    const bootstrapTheme = document.documentElement.dataset.cfitTheme;
    if (bootstrapTheme === "light" || bootstrapTheme === "dark") return bootstrapTheme;

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
