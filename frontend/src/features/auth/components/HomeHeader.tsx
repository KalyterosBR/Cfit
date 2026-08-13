import { useState } from "react";
import { Menu, X } from "lucide-react";

import Logo from "@/components/branding/Logo";


export default function HomeHeader() {
    const [menuOpen, setMenuOpen] = useState(false);


    function smoothScrollTo(id: string) {
        const element = document.getElementById(id);

        if (!element) {
            return;
        }

        // Fecha o menu mobile
        setMenuOpen(false);

        const startPosition = window.scrollY;

        const targetPosition =
            element.getBoundingClientRect().top +
            window.scrollY;

        const distance =
            targetPosition - startPosition;

        const duration = 700;

        let startTime: number | null = null;


        function animation(currentTime: number) {
            if (startTime === null) {
                startTime = currentTime;
            }

            const elapsed =
                currentTime - startTime;

            const progress = Math.min(
                elapsed / duration,
                1,
            );

            const ease =
                progress < 0.5
                    ? 2 * progress * progress
                    : 1 -
                    Math.pow(
                        -2 * progress + 2,
                        2,
                    ) /
                    2;

            window.scrollTo(
                0,
                startPosition +
                distance * ease,
            );

            if (progress < 1) {
                requestAnimationFrame(
                    animation,
                );
            }
        }


        requestAnimationFrame(animation);
    }


    return (
        <header className="relative z-50 w-full border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                <Logo width={120} />

                {/* MENU DESKTOP */}
                <nav className="hidden items-center gap-8 md:flex">
                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo("recursos")
                        }
                        className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
                    >
                        Recursos
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo("sistema")
                        }
                        className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
                    >
                        Conheça o Cfit
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo("login")
                        }
                        className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
                    >
                        Entrar
                    </button>
                </nav>


                {/* BOTÃO MOBILE */}
                <button
                    type="button"
                    onClick={() =>
                        setMenuOpen(
                            (current) => !current,
                        )
                    }
                    aria-label={
                        menuOpen
                            ? "Fechar menu"
                            : "Abrir menu"
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 md:hidden"
                >
                    {menuOpen ? (
                        <X size={22} />
                    ) : (
                        <Menu size={22} />
                    )}
                </button>
            </div>


            {/* MENU MOBILE */}
            {menuOpen && (
                <div className="absolute left-0 top-full w-full border-t border-slate-100 bg-white shadow-xl md:hidden">
                    <nav className="mx-auto flex max-w-7xl flex-col px-6 py-5">
                        <button
                            type="button"
                            onClick={() =>
                                smoothScrollTo(
                                    "recursos",
                                )
                            }
                            className="border-b border-slate-100 py-4 text-left font-medium text-slate-700"
                        >
                            Recursos
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                smoothScrollTo(
                                    "sistema",
                                )
                            }
                            className="border-b border-slate-100 py-4 text-left font-medium text-slate-700"
                        >
                            Conheça o Cfit
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                smoothScrollTo(
                                    "login",
                                )
                            }
                            className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-600"
                        >
                            Entrar
                        </button>
                    </nav>
                </div>
            )}
        </header>
    );
}