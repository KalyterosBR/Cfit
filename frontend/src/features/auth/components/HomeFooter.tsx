import {
    ArrowRight,
    ArrowUpRight,
    CircleCheck,
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


    return (
        <footer className="relative overflow-hidden bg-[#050b1c] text-white">
            {/* ATMOSFERA */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-600/[0.14] blur-[105px]" />

                <div className="absolute -bottom-40 left-[18%] h-72 w-72 rounded-full bg-cyan-400/[0.07] blur-[100px]" />

                <div className="absolute left-[48%] top-10 h-52 w-52 rounded-full bg-blue-500/[0.04] blur-[90px]" />

                <div className="absolute inset-0 opacity-[0.018] [background-image:linear-gradient(rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:42px_42px]" />

                <div className="absolute left-1/2 top-0 h-px w-[72%] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />
            </div>


            <div className="relative mx-auto max-w-7xl px-6">
                {/* CTA PRINCIPAL */}
                <div className="grid gap-8 py-11 md:py-13 lg:grid-cols-[1fr_290px] lg:items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-px w-7 bg-gradient-to-r from-blue-500 to-cyan-400" />

                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                                Próximo passo
                            </span>
                        </div>


                        <h2 className="mt-4 max-w-2xl text-3xl font-black leading-[1.04] tracking-[-0.04em] md:text-[2.35rem]">
                            Sua gestão acompanha o ritmo da
                            <br className="hidden sm:block" />{" "}

                            <span className="bg-gradient-to-r from-blue-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                sua academia.
                            </span>
                        </h2>


                        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
                            Centralize sua operação, acompanhe
                            o que realmente importa e tenha
                            mais clareza para decidir e crescer.
                        </p>


                        {/* ASSINATURA */}
                        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                            <div className="flex items-center gap-2">
                                <CircleCheck
                                    size={14}
                                    className="text-emerald-400"
                                />

                                <span className="text-[11px] font-medium text-slate-500">
                                    Operação conectada
                                </span>
                            </div>

                            <span className="hidden h-3 w-px bg-white/10 sm:block" />

                            <span className="text-[11px] font-medium text-slate-500">
                                Mais contexto para a gestão
                            </span>
                        </div>
                    </div>


                    {/* CTA */}
                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo(
                                "login",
                            )
                        }
                        className="group relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-white px-5 py-4 text-left shadow-[0_25px_55px_-30px_rgba(0,0,0,0.7)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_65px_-28px_rgba(37,99,235,0.35)]"
                    >
                        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-500/[0.08] blur-2xl" />


                        <div className="relative flex items-center justify-between gap-5">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-blue-600">
                                    Área do gestor
                                </p>

                                <p className="mt-1.5 text-base font-bold tracking-[-0.02em] text-slate-950">
                                    Acessar o Cfit
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    Entre na sua operação
                                </p>
                            </div>


                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-blue-600">
                                <ArrowUpRight
                                    size={18}
                                />
                            </span>
                        </div>
                    </button>
                </div>


                {/* DIVISOR / STATUS */}
                <div className="border-t border-white/[0.08]">
                    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" />

                            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                Gestão em movimento
                            </span>
                        </div>

                        <p className="text-[10px] text-slate-600">
                            Tecnologia para acompanhar a operação da academia.
                        </p>
                    </div>
                </div>


                {/* RODAPÉ INFERIOR */}
                <div className="grid gap-6 border-t border-white/[0.08] py-6 md:grid-cols-[1fr_auto] md:items-end">
                    {/* MARCA */}
                    <div>
                        <div className="flex items-center gap-4">
                            <div className="flex h-9 items-center rounded-lg bg-white px-2.5">
                                <Logo width={76} />
                            </div>

                            <div className="hidden h-5 w-px bg-white/10 sm:block" />

                            <p className="text-xs text-slate-500">
                                Performance para sua gestão.
                            </p>
                        </div>


                        <p className="mt-4 max-w-md text-[10px] leading-5 text-slate-700">
                            Uma plataforma para conectar
                            operação, informação e decisões
                            dentro da academia.
                        </p>
                    </div>


                    {/* NAVEGAÇÃO */}
                    <div className="flex flex-col gap-4 md:items-end">
                        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
                            <button
                                type="button"
                                onClick={() =>
                                    smoothScrollTo(
                                        "recursos",
                                    )
                                }
                                className="text-xs font-medium text-slate-500 transition-colors hover:text-white"
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
                                className="text-xs font-medium text-slate-500 transition-colors hover:text-white"
                            >
                                Produto
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    smoothScrollTo(
                                        "solucoes",
                                    )
                                }
                                className="text-xs font-medium text-slate-500 transition-colors hover:text-white"
                            >
                                Soluções
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    smoothScrollTo(
                                        "login",
                                    )
                                }
                                className="group inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-white"
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