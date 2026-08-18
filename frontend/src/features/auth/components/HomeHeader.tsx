import {
    useEffect,
    useState,
} from "react";

import {
    ArrowRight,
    Menu,
    X,
} from "lucide-react";

import Logo from "@/components/branding/Logo";


type SectionId =
    | "recursos"
    | "sistema"
    | "solucoes";


export default function HomeHeader() {
    const [menuOpen, setMenuOpen] =
        useState(false);

    const [scrolled, setScrolled] =
        useState(false);

    const [activeSection, setActiveSection] =
        useState<SectionId | null>(null);


    useEffect(() => {
        function handleScroll() {
            setScrolled(
                window.scrollY > 24,
            );


            const sections: SectionId[] = [
                "recursos",
                "sistema",
                "solucoes",
            ];

            const headerOffset = 110;

            let currentSection:
                | SectionId
                | null = null;


            for (
                const sectionId of sections
            ) {
                const element =
                    document.getElementById(
                        sectionId,
                    );

                if (!element) {
                    continue;
                }

                const rect =
                    element.getBoundingClientRect();


                if (
                    rect.top <=
                    headerOffset &&
                    rect.bottom >
                    headerOffset
                ) {
                    currentSection =
                        sectionId;

                    break;
                }
            }


            setActiveSection(
                currentSection,
            );
        }


        handleScroll();

        window.addEventListener(
            "scroll",
            handleScroll,
            {
                passive: true,
            },
        );


        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll,
            );
        };
    }, []);


    function smoothScrollTo(
        id: string,
    ) {
        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        setMenuOpen(false);


        const startPosition =
            window.scrollY;

        const targetPosition =
            element.getBoundingClientRect()
                .top +
            window.scrollY -
            82;

        const distance =
            targetPosition -
            startPosition;

        const duration = 700;

        let startTime:
            | number
            | null = null;


        function animation(
            currentTime: number,
        ) {
            if (
                startTime === null
            ) {
                startTime =
                    currentTime;
            }

            const elapsed =
                currentTime -
                startTime;

            const progress =
                Math.min(
                    elapsed /
                    duration,
                    1,
                );

            const ease =
                progress < 0.5
                    ? 2 *
                    progress *
                    progress
                    : 1 -
                    Math.pow(
                        -2 *
                        progress +
                        2,
                        2,
                    ) /
                    2;


            window.scrollTo(
                0,
                startPosition +
                distance *
                ease,
            );


            if (progress < 1) {
                requestAnimationFrame(
                    animation,
                );
            }
        }


        requestAnimationFrame(
            animation,
        );
    }


    function scrollToTop() {
        setMenuOpen(false);

        const startPosition =
            window.scrollY;

        const duration = 650;

        let startTime:
            | number
            | null = null;


        function animation(
            currentTime: number,
        ) {
            if (
                startTime === null
            ) {
                startTime =
                    currentTime;
            }

            const elapsed =
                currentTime -
                startTime;

            const progress =
                Math.min(
                    elapsed /
                    duration,
                    1,
                );

            const ease =
                progress < 0.5
                    ? 2 *
                    progress *
                    progress
                    : 1 -
                    Math.pow(
                        -2 *
                        progress +
                        2,
                        2,
                    ) /
                    2;


            window.scrollTo(
                0,
                startPosition *
                (1 - ease),
            );


            if (progress < 1) {
                requestAnimationFrame(
                    animation,
                );
            }
        }


        requestAnimationFrame(
            animation,
        );
    }


    function desktopNavClass(
        section: SectionId,
    ) {
        const isActive =
            activeSection === section;


        return `
            group
            relative
            flex
            h-[42px]
            items-center
            justify-center
            px-4
            text-[13px]
            font-semibold
            transition-colors
            duration-300
            ${isActive
                ? "text-slate-950"
                : "text-slate-500 hover:text-slate-950"
            }
        `;
    }


    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
                ? "border-b border-slate-200/70 bg-white/90 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.28)] backdrop-blur-xl"
                : "border-b border-transparent bg-white"
                }`}
        >
            {/* LINHA SUPERIOR */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-blue-600/0 via-blue-500/40 to-cyan-400/0" />


            {/* CONTAINER */}
            <div
                className="
                    mx-auto
                    flex
                    h-[82px]
                    w-full
                    max-w-[1440px]
                    items-center
                    justify-between
                    px-6
                    xl:px-10

                    md:grid
                    md:grid-cols-[1fr_auto_1fr]
                "
            >
                {/* LOGO */}
                <div className="flex items-center justify-start">
                    <button
                        type="button"
                        onClick={
                            scrollToTop
                        }
                        aria-label="Voltar ao início"
                        className="
                            flex
                            h-[52px]
                            translate-y-[2px]
                            items-center
                            justify-start
                            transition-opacity
                            duration-300
                            hover:opacity-80
                        "
                    >
                        <Logo
                            width={152}
                        />
                    </button>
                </div>


                {/* MENU DESKTOP */}
                <nav
                    className="
                        hidden
                        h-[46px]
                        items-center
                        rounded-[14px]
                        border
                        border-slate-200/80
                        bg-slate-50/70
                        px-1
                        shadow-[0_8px_25px_-22px_rgba(15,23,42,0.4)]
                        md:flex
                    "
                >
                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo(
                                "recursos",
                            )
                        }
                        className={desktopNavClass(
                            "recursos",
                        )}
                    >
                        Recursos

                        <span
                            className={`absolute bottom-[2px] left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300 ${activeSection ===
                                "recursos"
                                ? "w-5 opacity-100"
                                : "w-0 opacity-0 group-hover:w-3 group-hover:opacity-40"
                                }`}
                        />
                    </button>


                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo(
                                "sistema",
                            )
                        }
                        className={desktopNavClass(
                            "sistema",
                        )}
                    >
                        Produto

                        <span
                            className={`absolute bottom-[2px] left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300 ${activeSection ===
                                "sistema"
                                ? "w-5 opacity-100"
                                : "w-0 opacity-0 group-hover:w-3 group-hover:opacity-40"
                                }`}
                        />
                    </button>


                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo(
                                "solucoes",
                            )
                        }
                        className={desktopNavClass(
                            "solucoes",
                        )}
                    >
                        Soluções

                        <span
                            className={`absolute bottom-[2px] left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300 ${activeSection ===
                                "solucoes"
                                ? "w-5 opacity-100"
                                : "w-0 opacity-0 group-hover:w-3 group-hover:opacity-40"
                                }`}
                        />
                    </button>
                </nav>


                {/* AÇÕES DESKTOP */}
                <div className="hidden items-center justify-end gap-4 md:flex">
                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo(
                                "login",
                            )
                        }
                        className="px-3 py-2 text-[13px] font-semibold text-slate-600 transition-colors duration-300 hover:text-blue-600"
                    >
                        Entrar
                    </button>


                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo(
                                "sistema",
                            )
                        }
                        className="
                            group
                            inline-flex
                            h-[46px]
                            items-center
                            gap-3
                            rounded-xl
                            bg-slate-950
                            px-5
                            text-[13px]
                            font-semibold
                            text-white
                            shadow-[0_10px_25px_-14px_rgba(15,23,42,0.55)]
                            transition-all
                            duration-300
                            hover:-translate-y-0.5
                            hover:bg-blue-600
                            hover:shadow-[0_14px_30px_-14px_rgba(37,99,235,0.55)]
                        "
                    >
                        Conhecer o Cfit

                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-colors duration-300 group-hover:bg-white/15">
                            <ArrowRight
                                size={14}
                                className="transition-transform duration-300 group-hover:translate-x-0.5"
                            />
                        </span>
                    </button>
                </div>


                {/* BOTÃO MOBILE */}
                <button
                    type="button"
                    onClick={() =>
                        setMenuOpen(
                            (
                                current,
                            ) =>
                                !current,
                        )
                    }
                    aria-label={
                        menuOpen
                            ? "Fechar menu"
                            : "Abrir menu"
                    }
                    aria-expanded={
                        menuOpen
                    }
                    className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        text-slate-700
                        shadow-sm
                        transition-all
                        duration-300
                        hover:border-slate-300
                        hover:bg-slate-50
                        md:hidden
                    "
                >
                    {menuOpen ? (
                        <X size={21} />
                    ) : (
                        <Menu
                            size={21}
                        />
                    )}
                </button>
            </div>


            {/* MENU MOBILE */}
            <div
                className={`absolute left-0 top-full w-full overflow-hidden border-t border-slate-100 bg-white/95 shadow-[0_25px_50px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all duration-300 md:hidden ${menuOpen
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-2 opacity-0"
                    }`}
            >
                <nav className="mx-auto flex max-w-[1440px] flex-col px-6 py-5">
                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo(
                                "recursos",
                            )
                        }
                        className="flex items-center justify-between border-b border-slate-100 py-4 text-left text-sm font-semibold text-slate-700"
                    >
                        Recursos

                        <ArrowRight
                            size={15}
                            className="text-slate-400"
                        />
                    </button>


                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo(
                                "sistema",
                            )
                        }
                        className="flex items-center justify-between border-b border-slate-100 py-4 text-left text-sm font-semibold text-slate-700"
                    >
                        Produto

                        <ArrowRight
                            size={15}
                            className="text-slate-400"
                        />
                    </button>


                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo(
                                "solucoes",
                            )
                        }
                        className="flex items-center justify-between border-b border-slate-100 py-4 text-left text-sm font-semibold text-slate-700"
                    >
                        Soluções

                        <ArrowRight
                            size={15}
                            className="text-slate-400"
                        />
                    </button>


                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo(
                                "login",
                            )
                        }
                        className="py-4 text-left text-sm font-semibold text-slate-700"
                    >
                        Entrar
                    </button>


                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo(
                                "sistema",
                            )
                        }
                        className="group mt-2 flex h-12 items-center justify-between rounded-xl bg-slate-950 px-5 font-semibold text-white shadow-sm transition-all duration-300 hover:bg-blue-600"
                    >
                        Conhecer o Cfit

                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                            <ArrowRight
                                size={14}
                            />
                        </span>
                    </button>
                </nav>
            </div>
        </header>
    );
}