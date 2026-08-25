import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/features/theme/useTheme";


export default function ThemeToggle({ className = "" }: { className?: string }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo noturno"}
            title={theme === "dark" ? "Ativar modo claro" : "Ativar modo noturno"}
            className={`cfit-theme-toggle flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-500 shadow-none backdrop-blur-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 focus-visible:text-blue-600 ${className}`}
        >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}
