import {
    ArrowRight,
    CheckCircle2,
} from "lucide-react";


export default function HomeHero() {
    function smoothScrollTo(id: string) {
        const element = document.getElementById(id);

        if (!element) {
            return;
        }

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
        <div className="relative max-w-[720px] lg:pr-2">
            {/* IDENTIDADE */}
            <div className="mb-7 flex items-center gap-3">
                <span className="h-px w-8 bg-gradient-to-r from-blue-600 to-cyan-400" />

                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
                    Plataforma de gestão para academias
                </span>
            </div>


            {/* TÍTULO */}
            <h1 className="max-w-[720px] font-black leading-[0.98] tracking-[-0.055em] text-slate-950">
                <span className="block text-[3.1rem] sm:text-[3.6rem] lg:text-[3.65rem] xl:text-[3.85rem]">
                    Sua academia em movimento.
                </span>

                <span className="mt-1 block bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-[3.1rem] text-transparent sm:text-[3.6rem] lg:text-[3.65rem] xl:text-[3.85rem]">
                    Sua gestão também.
                </span>
            </h1>


            {/* DESCRIÇÃO */}
            <p className="mt-8 max-w-[590px] text-[17px] leading-8 text-slate-600">
                Centralize alunos, matrículas, financeiro,
                agenda e controle de acesso em uma única
                plataforma feita para acompanhar o ritmo da
                sua academia.
            </p>


            {/* CTAS */}
            <div className="mt-9 flex flex-wrap items-center gap-5">
                <button
                    type="button"
                    onClick={() =>
                        smoothScrollTo("sistema")
                    }
                    className="group inline-flex h-[52px] items-center gap-3 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-[0_16px_35px_-14px_rgba(37,99,235,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_20px_40px_-14px_rgba(37,99,235,0.72)]"
                >
                    Conhecer o Cfit

                    <ArrowRight
                        size={17}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                </button>


                <button
                    type="button"
                    onClick={() =>
                        smoothScrollTo("recursos")
                    }
                    className="group inline-flex h-[52px] items-center gap-2 px-1 text-sm font-semibold text-slate-700 transition-colors duration-300 hover:text-blue-600"
                >
                    Explorar recursos

                    <ArrowRight
                        size={15}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                </button>
            </div>


            {/* BENEFÍCIOS */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                    <CheckCircle2
                        size={15}
                        strokeWidth={2.2}
                        className="text-emerald-500"
                    />

                    <span className="text-[13px] font-medium text-slate-600">
                        Gestão centralizada
                    </span>
                </div>


                <div className="hidden h-4 w-px bg-slate-200 sm:block" />


                <div className="flex items-center gap-2">
                    <CheckCircle2
                        size={15}
                        strokeWidth={2.2}
                        className="text-emerald-500"
                    />

                    <span className="text-[13px] font-medium text-slate-600">
                        Operação conectada
                    </span>
                </div>


                <div className="hidden h-4 w-px bg-slate-200 sm:block" />


                <div className="flex items-center gap-2">
                    <CheckCircle2
                        size={15}
                        strokeWidth={2.2}
                        className="text-emerald-500"
                    />

                    <span className="text-[13px] font-medium text-slate-600">
                        Decisões mais claras
                    </span>
                </div>
            </div>


            {/* ECOSSISTEMA */}
            <div className="mt-10 max-w-[620px] border-t border-slate-200/80 pt-5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Uma plataforma
                    </span>

                    <span className="hidden h-1 w-1 rounded-full bg-blue-500 sm:block" />

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
                                className="flex items-center gap-4"
                            >
                                <span className="text-xs font-semibold text-slate-600">
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