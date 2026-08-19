import {
    ArrowRight,
    CheckCircle2,
} from "lucide-react";


export default function HomeHero() {
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
                startTime = currentTime;
            }

            const elapsed =
                currentTime -
                startTime;

            const progress = Math.min(
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
        <div className="relative max-w-[720px] lg:pr-4">
            {/* IDENTIDADE */}
            <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-gradient-to-r from-blue-600 to-cyan-400" />

                <span className="text-[10px] font-bold uppercase tracking-[0.21em] text-blue-600">
                    Plataforma de gestão para academias
                </span>
            </div>


            {/* TÍTULO */}
            <h1 className="max-w-[710px] font-black leading-[0.96] tracking-[-0.055em] text-slate-950">
                <span className="block text-[3rem] sm:text-[3.55rem] lg:text-[3.55rem] xl:text-[3.8rem]">
                    Sua academia em movimento.
                </span>

                <span className="mt-1.5 block bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text pb-1 text-[3rem] text-transparent sm:text-[3.55rem] lg:text-[3.55rem] xl:text-[3.8rem]">
                    Sua gestão também.
                </span>
            </h1>


            {/* DESCRIÇÃO */}
            <p className="mt-7 max-w-[590px] text-[16px] leading-8 text-slate-600">
                Centralize alunos, matrículas,
                financeiro, agenda e controle de
                acesso em uma única plataforma
                preparada para acompanhar o ritmo da
                sua academia.
            </p>


            {/* CTAS */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                    type="button"
                    onClick={() =>
                        smoothScrollTo("sistema")
                    }
                    className="group inline-flex h-[52px] items-center gap-4 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white shadow-[0_16px_38px_-16px_rgba(15,23,42,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-[0_20px_42px_-16px_rgba(37,99,235,0.6)]"
                >
                    Conhecer o Cfit

                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-colors duration-300 group-hover:bg-white/15">
                        <ArrowRight
                            size={14}
                            className="transition-transform duration-300 group-hover:translate-x-0.5"
                        />
                    </span>
                </button>


                <button
                    type="button"
                    onClick={() =>
                        smoothScrollTo("recursos")
                    }
                    className="group inline-flex h-[52px] items-center gap-3 px-2 text-sm font-semibold text-slate-700 transition-colors duration-300 hover:text-blue-600"
                >
                    Explorar recursos

                    <ArrowRight
                        size={15}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                </button>
            </div>


            {/* BENEFÍCIOS */}
            <div className="mt-7 grid max-w-[610px] gap-3 sm:grid-cols-3">
                {[
                    "Gestão centralizada",
                    "Operação conectada",
                    "Decisões mais claras",
                ].map((item) => (
                    <div
                        key={item}
                        className="flex items-center gap-2.5"
                    >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <CheckCircle2
                                size={14}
                                strokeWidth={2.2}
                            />
                        </div>

                        <span className="text-[12px] font-semibold text-slate-600">
                            {item}
                        </span>
                    </div>
                ))}
            </div>


            {/* ECOSSISTEMA */}
            <div className="mt-7 max-w-[630px] border-t border-slate-200/80 pt-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                    <span className="mr-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Uma plataforma
                    </span>

                    <span className="hidden h-1.5 w-1.5 rounded-full bg-blue-500 sm:block" />

                    {[
                        "Alunos",
                        "Financeiro",
                        "Matrículas",
                        "Agenda",
                        "Acesso",
                    ].map(
                        (
                            item,
                            index,
                        ) => (
                            <div
                                key={item}
                                className="flex items-center gap-3"
                            >
                                <span className="text-[11px] font-semibold text-slate-600">
                                    {item}
                                </span>

                                {index < 4 && (
                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                )}
                            </div>
                        ),
                    )}
                </div>
            </div>
        </div>
    );
}
