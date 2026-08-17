import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

import Logo from "@/components/branding/Logo";


export default function HomeHeader() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);


    useEffect(() => {
        function handleScroll() {
            setScrolled(window.scrollY > 24);
        }

        handleScroll();

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);


    function smoothScrollTo(id: string) {
        const element = document.getElementById(id);

        if (!element) return;

        setMenuOpen(false);

        element.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }


    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
                    ? "border-b border-slate-200/70 bg-white/90 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl"
                    : "border-b border-transparent bg-white"
                }`}
        >
            <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6">
                {/* LOGO */}
                <button
                    type="button"
                    onClick={() => window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                    })}
                    aria-label="Voltar ao início"
                    className="shrink-0"
                >
                    <Logo width={116} />
                </button>


                {/* MENU DESKTOP */}
                <nav className="hidden items-center gap-1 md:flex">
                    <button
                        type="button"
                        onClick={() => smoothScrollTo("recursos")}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                        Recursos
                    </button>

                    <button
                        type="button"
                        onClick={() => smoothScrollTo("sistema")}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                        Produto
                    </button>

                    <button
                        type="button"
                        onClick={() => smoothScrollTo("sistema")}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                        Soluções
                    </button>
                </nav>


                {/* AÇÕES */}
                <div className="hidden items-center gap-3 md:flex">
                    <button
                        type="button"
                        onClick={() => smoothScrollTo("login")}
                        className="px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-blue-600"
                    >
                        Entrar
                    </button>

                    <button
                        type="button"
                        onClick={() => smoothScrollTo("sistema")}
                        className="group inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition duration-300 hover:bg-blue-600"
                    >
                        Conhecer o Cfit

                        <ArrowRight
                            size={16}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </button>
                </div>


                {/* MOBILE */}
                <button
                    type="button"
                    onClick={() => setMenuOpen((current) => !current)}
                    aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 md:hidden"
                >
                    {menuOpen ? <X size={21} /> : <Menu size={21} />}
                </button>
            </div>


            {/* MENU MOBILE */}
            <div
                className={`absolute left-0 top-full w-full overflow-hidden border-t border-slate-100 bg-white shadow-xl transition-all duration-300 md:hidden ${menuOpen
                        ? "visible translate-y-0 opacity-100"
                        : "invisible -translate-y-2 opacity-0"
                    }`}
            >
                <nav className="mx-auto flex max-w-7xl flex-col px-6 py-5">
                    <button
                        type="button"
                        onClick={() => smoothScrollTo("recursos")}
                        className="border-b border-slate-100 py-4 text-left font-medium text-slate-700"
                    >
                        Recursos
                    </button>

                    <button
                        type="button"
                        onClick={() => smoothScrollTo("sistema")}
                        className="border-b border-slate-100 py-4 text-left font-medium text-slate-700"
                    >
                        Produto
                    </button>

                    <button
                        type="button"
                        onClick={() => smoothScrollTo("sistema")}
                        className="border-b border-slate-100 py-4 text-left font-medium text-slate-700"
                    >
                        Soluções
                    </button>

                    <button
                        type="button"
                        onClick={() => smoothScrollTo("login")}
                        className="py-4 text-left font-semibold text-slate-700"
                    >
                        Entrar
                    </button>

                    <button
                        type="button"
                        onClick={() => smoothScrollTo("sistema")}
                        className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 font-semibold text-white"
                    >
                        Conhecer o Cfit
                        <ArrowRight size={17} />
                    </button>
                </nav>
            </div>
        </header>
    );
}