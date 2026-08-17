import {
    ArrowRight,
    ArrowUpRight,
} from "lucide-react";

import Logo from "@/components/branding/Logo";


export default function HomeFooter() {
    function smoothScrollTo(id: string) {
        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        const startPosition =
            window.scrollY;

        const targetPosition =
            element.getBoundingClientRect().top +
            window.scrollY;

        const distance =
            targetPosition -
            startPosition;

        const duration = 700;

        let startTime: number | null =
            null;


        function animation(
            currentTime: number,
        ) {
            if (startTime === null) {
                startTime =
                    currentTime;
            }

            const elapsed =
                currentTime -
                startTime;

            const progress =
                Math.min(
                    elapsed / duration,
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


    return (
        <footer className="relative overflow-hidden bg-[#050b1c] text-white">
            {/* FUNDO */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-600/12 blur-[100px]" />

                <div className="absolute -bottom-40 left-[20%] h-72 w-72 rounded-full bg-cyan-400/[0.06] blur-[100px]" />

                <div className="absolute inset-0 opacity-[0.018] [background-image:linear-gradient(rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:42px_42px]" />
            </div>


            <div className="relative mx-auto max-w-7xl px-6">
                {/* CTA */}
                <div className="grid gap-8 py-12 md:py-14 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-px w-7 bg-gradient-to-r from-blue-500 to-cyan-400" />

                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                                Próximo passo
                            </span>
                        </div>


                        <h2 className="mt-4 max-w-2xl text-3xl font-black leading-[1.05] tracking-[-0.04em] md:text-[2.4rem]">
                            Sua gestão acompanha o ritmo da{" "}

                            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                sua academia.
                            </span>
                        </h2>


                        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
                            Centralize sua operação e tenha
                            mais clareza para acompanhar,
                            decidir e crescer.
                        </p>
                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo(
                                "login",
                            )
                        }
                        className="group flex min-w-[235px] items-center justify-between gap-6 rounded-2xl bg-white px-5 py-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50"
                    >
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                Área do gestor
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-950">
                                Acessar o Cfit
                            </p>
                        </div>


                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition-all duration-300 group-hover:bg-blue-600">
                            <ArrowUpRight
                                size={17}
                            />
                        </span>
                    </button>
                </div>


                {/* RODAPÉ */}
                <div className="flex flex-col gap-6 border-t border-white/[0.08] py-6 md:flex-row md:items-center md:justify-between">
                    {/* MARCA */}
                    <div className="flex items-center gap-4">
                        <div className="flex h-9 items-center rounded-lg bg-white px-2.5">
                            <Logo width={76} />
                        </div>

                        <div className="hidden h-5 w-px bg-white/10 sm:block" />

                        <p className="text-xs text-slate-500">
                            Performance para sua gestão.
                        </p>
                    </div>


                    {/* LINKS */}
                    <div className="flex flex-col gap-3 md:items-end">
                        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
                            <button
                                type="button"
                                onClick={() =>
                                    smoothScrollTo(
                                        "recursos",
                                    )
                                }
                                className="text-xs font-medium text-slate-500 transition hover:text-white"
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
                                className="text-xs font-medium text-slate-500 transition hover:text-white"
                            >
                                Produto
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    smoothScrollTo(
                                        "login",
                                    )
                                }
                                className="group inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-white"
                            >
                                Entrar

                                <ArrowRight
                                    size={12}
                                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                                />
                            </button>
                        </nav>

                        <p className="text-[10px] text-slate-700">
                            © 2026 Cfit. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}