import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    CreditCard,
    Link2,
} from "lucide-react";


const benefits = [
    {
        number: "01",
        icon: CreditCard,
        eyebrow: "Financeiro",
        title: "Cobranças sob controle.",
        description:
            "Acompanhe pagamentos, pendências e atrasos sem depender de planilhas ou informações espalhadas.",
    },
    {
        number: "02",
        icon: Link2,
        eyebrow: "Operação",
        title: "Tudo trabalha conectado.",
        description:
            "Aluno, matrícula, financeiro e acesso deixam de funcionar como partes isoladas da academia.",
    },
    {
        number: "03",
        icon: BarChart3,
        eyebrow: "Gestão",
        title: "Decisões com mais contexto.",
        description:
            "Transforme o que acontece todos os dias em informações claras para acompanhar resultados e agir melhor.",
    },
];


export default function HomeBenefits() {
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
        <section className="relative overflow-hidden bg-[#f8fafc] py-16 md:py-20">
            {/* FUNDO */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-44 top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full bg-blue-500/[0.045] blur-[120px]" />

                <div className="absolute -right-44 top-12 h-[28rem] w-[28rem] rounded-full bg-cyan-400/[0.045] blur-[120px]" />

                <div className="absolute left-1/2 top-0 h-px w-[72%] -translate-x-1/2 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>


            <div className="relative mx-auto max-w-7xl px-6">
                {/* BLOCO PRINCIPAL */}
                <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
                    {/* NARRATIVA */}
                    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-7 md:p-8">
                        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-blue-500/[0.06] blur-[80px]" />


                        <div className="relative">
                            <div className="flex items-center gap-3">
                                <span className="h-px w-8 bg-gradient-to-r from-blue-600 to-cyan-400" />

                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                                    Menos operação
                                </span>
                            </div>


                            <h2 className="mt-5 max-w-lg text-4xl font-black leading-[1.02] tracking-[-0.045em] text-slate-950 md:text-5xl">
                                Menos trabalho
                                <br />

                                no operacional.
                                <br />

                                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                    Mais tempo para
                                    sua academia.
                                </span>
                            </h2>


                            <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
                                O Cfit organiza o que
                                costuma consumir tempo
                                todos os dias para que a
                                gestão enxergue melhor a
                                operação e consiga focar no
                                crescimento.
                            </p>


                            <div className="mt-6 space-y-2.5">
                                {[
                                    "Menos tarefas espalhadas",
                                    "Mais clareza na rotina",
                                    "Informação pronta para decidir",
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                            <CheckCircle2
                                                size={14}
                                            />
                                        </div>

                                        <span className="text-sm font-medium text-slate-700">
                                            {item}
                                        </span>
                                    </div>
                                ))}
                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    smoothScrollTo(
                                        "sistema",
                                    )
                                }
                                className="group mt-7 inline-flex items-center gap-3 text-sm font-bold text-slate-950 transition-colors hover:text-blue-600"
                            >
                                Ver o Cfit em ação

                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white transition-all duration-300 group-hover:translate-x-1 group-hover:bg-blue-600">
                                    <ArrowRight
                                        size={15}
                                    />
                                </span>
                            </button>
                        </div>
                    </div>


                    {/* BENEFÍCIOS */}
                    <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white">
                        {benefits.map(
                            (
                                benefit,
                                index,
                            ) => {
                                const Icon =
                                    benefit.icon;

                                return (
                                    <div
                                        key={
                                            benefit.number
                                        }
                                        className={`group relative grid gap-5 p-6 transition-all duration-300 hover:bg-slate-50/70 sm:grid-cols-[68px_1fr] md:p-7 ${index <
                                                benefits.length -
                                                1
                                                ? "border-b border-slate-200"
                                                : ""
                                            }`}
                                    >
                                        {/* NÚMERO + ÍCONE */}
                                        <div className="flex items-start gap-3 sm:block">
                                            <span className="text-[10px] font-black tracking-[0.18em] text-slate-300">
                                                {
                                                    benefit.number
                                                }
                                            </span>

                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600 shadow-sm transition-all duration-300 group-hover:border-blue-200 group-hover:bg-blue-50">
                                                <Icon
                                                    size={18}
                                                />
                                            </div>
                                        </div>


                                        {/* TEXTO */}
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-600">
                                                {
                                                    benefit.eyebrow
                                                }
                                            </p>

                                            <div className="mt-1.5 flex items-start justify-between gap-5">
                                                <div>
                                                    <h3 className="text-[1.35rem] font-bold tracking-[-0.025em] text-slate-950 md:text-2xl">
                                                        {
                                                            benefit.title
                                                        }
                                                    </h3>

                                                    <p className="mt-2.5 max-w-xl text-sm leading-6 text-slate-500">
                                                        {
                                                            benefit.description
                                                        }
                                                    </p>
                                                </div>

                                                <span className="hidden text-4xl font-black tracking-[-0.06em] text-slate-100 md:block">
                                                    {
                                                        benefit.number
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </div>
                </div>


                {/* RESULTADO */}
                <div className="relative mt-6 overflow-hidden rounded-[1.75rem] bg-slate-950">
                    <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-600/20 blur-[90px]" />

                    <div className="pointer-events-none absolute -bottom-24 left-[30%] h-56 w-56 rounded-full bg-cyan-400/10 blur-[90px]" />


                    <div className="relative grid gap-5 px-7 py-6 md:grid-cols-[1fr_auto] md:items-center md:px-8">
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                                Resultado
                            </p>

                            <h3 className="mt-2 max-w-2xl text-xl font-bold tracking-[-0.03em] text-white md:text-2xl">
                                Menos tempo procurando
                                informações.

                                <span className="ml-2 text-slate-400">
                                    Mais clareza para
                                    administrar.
                                </span>
                            </h3>
                        </div>


                        <div className="flex items-center gap-3 border-t border-white/10 pt-4 md:border-l md:border-t-0 md:pl-7 md:pt-0">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />

                            <div>
                                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                    Operação
                                </p>

                                <p className="mt-1 text-sm font-semibold text-white">
                                    Mais organizada
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}