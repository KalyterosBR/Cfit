import {
    ArrowRight,
    BarChart3,
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
        <section className="relative overflow-hidden bg-[#f8fafc] py-24 md:py-32">
            {/* FUNDO */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-48 bottom-0 h-[32rem] w-[32rem] rounded-full bg-blue-500/[0.045] blur-[120px]" />

                <div className="absolute -right-48 top-0 h-[34rem] w-[34rem] rounded-full bg-cyan-400/[0.045] blur-[120px]" />

                <div className="absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>


            <div className="relative mx-auto max-w-7xl px-6">
                {/* CABEÇALHO */}
                <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
                    {/* ESQUERDA */}
                    <div className="lg:sticky lg:top-32">
                        <div className="flex items-center gap-3">
                            <span className="h-px w-8 bg-gradient-to-r from-blue-600 to-cyan-400" />

                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
                                Menos operação
                            </span>
                        </div>


                        <h2 className="mt-6 max-w-lg text-4xl font-black leading-[1.03] tracking-[-0.045em] text-slate-950 md:text-5xl">
                            Menos trabalho
                            <br />

                            <span className="text-slate-950">
                                no operacional.
                            </span>

                            <br />

                            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                Mais tempo para
                                sua academia.
                            </span>
                        </h2>


                        <p className="mt-7 max-w-md text-base leading-8 text-slate-600">
                            O Cfit organiza o que
                            costuma consumir tempo
                            todos os dias para que a
                            gestão consiga enxergar
                            melhor a operação e focar
                            no crescimento.
                        </p>


                        <button
                            type="button"
                            onClick={() =>
                                smoothScrollTo(
                                    "sistema",
                                )
                            }
                            className="group mt-8 inline-flex items-center gap-3 text-sm font-bold text-slate-950 transition-colors hover:text-blue-600"
                        >
                            Ver o Cfit em ação

                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white transition-all duration-300 group-hover:translate-x-1 group-hover:bg-blue-600">
                                <ArrowRight
                                    size={16}
                                />
                            </span>
                        </button>
                    </div>


                    {/* DIREITA */}
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
                                        className={`group relative grid gap-6 p-7 transition-colors duration-300 hover:bg-slate-50/70 sm:grid-cols-[76px_1fr] md:p-9 ${index <
                                                benefits.length -
                                                1
                                                ? "border-b border-slate-200"
                                                : ""
                                            }`}
                                    >
                                        {/* NÚMERO + ÍCONE */}
                                        <div>
                                            <span className="text-[10px] font-black tracking-[0.18em] text-slate-300">
                                                {
                                                    benefit.number
                                                }
                                            </span>

                                            <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600 shadow-sm transition-all duration-300 group-hover:border-blue-200 group-hover:shadow-[0_12px_30px_-18px_rgba(37,99,235,0.5)]">
                                                <Icon
                                                    size={
                                                        20
                                                    }
                                                />
                                            </div>
                                        </div>


                                        {/* TEXTO */}
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                                                {
                                                    benefit.eyebrow
                                                }
                                            </p>

                                            <h3 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-slate-950">
                                                {
                                                    benefit.title
                                                }
                                            </h3>

                                            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
                                                {
                                                    benefit.description
                                                }
                                            </p>
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </div>
                </div>


                {/* FECHAMENTO */}
                <div className="mt-16 overflow-hidden rounded-[2rem] bg-slate-950">
                    <div className="relative grid gap-8 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
                        {/* EFEITOS */}
                        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-600/20 blur-[90px]" />

                        <div className="pointer-events-none absolute -bottom-24 left-[35%] h-56 w-56 rounded-full bg-cyan-400/10 blur-[90px]" />


                        <div className="relative">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                                Resultado
                            </p>

                            <h3 className="mt-3 max-w-2xl text-2xl font-bold tracking-[-0.03em] text-white md:text-3xl">
                                Menos tempo procurando
                                informações.
                                <br />

                                <span className="text-slate-400">
                                    Mais clareza para
                                    administrar.
                                </span>
                            </h3>
                        </div>


                        <div className="relative flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />

                            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                Operação organizada
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}