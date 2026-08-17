import {
    ArrowRight,
    BarChart3,
    CalendarDays,
    CreditCard,
    Dumbbell,
    GraduationCap,
    Users,
} from "lucide-react";


const flowSteps = [
    {
        number: "01",
        icon: Users,
        title: "Aluno",
        description:
            "Cadastro, situação, histórico e informações essenciais em um só lugar.",
    },
    {
        number: "02",
        icon: Dumbbell,
        title: "Plano e matrícula",
        description:
            "Planos, regras e condições acompanham cada aluno desde a entrada.",
    },
    {
        number: "03",
        icon: CreditCard,
        title: "Financeiro",
        description:
            "Cobranças, pagamentos e pendências conectados diretamente à matrícula.",
    },
    {
        number: "04",
        icon: BarChart3,
        title: "Gestão",
        description:
            "A operação vira contexto para acompanhar resultados e tomar decisões.",
    },
];


export default function HomeFeatures() {
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
        <section
            id="recursos"
            className="relative overflow-hidden bg-white py-24 md:py-32"
        >
            {/* ATMOSFERA */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-48 top-24 h-[32rem] w-[32rem] rounded-full bg-blue-500/[0.045] blur-[120px]" />

                <div className="absolute -right-48 bottom-10 h-[34rem] w-[34rem] rounded-full bg-cyan-400/[0.05] blur-[120px]" />

                <div className="absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>


            <div className="relative mx-auto max-w-7xl px-6">
                {/* CABEÇALHO */}
                <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-px w-8 bg-gradient-to-r from-blue-600 to-cyan-400" />

                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
                                Gestão conectada
                            </span>
                        </div>


                        <h2 className="mt-6 max-w-xl text-4xl font-black leading-[1.04] tracking-[-0.045em] text-slate-950 md:text-5xl">
                            A operação inteira,
                            <br />

                            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                conectada.
                            </span>
                        </h2>
                    </div>


                    <div className="max-w-xl lg:justify-self-end">
                        <p className="text-lg leading-8 text-slate-600">
                            Do primeiro cadastro à visão gerencial,
                            o Cfit mantém cada etapa da academia
                            trabalhando dentro do mesmo fluxo.
                        </p>

                        <p className="mt-4 text-sm leading-7 text-slate-500">
                            Menos sistemas isolados. Menos informação
                            espalhada. Mais contexto para acompanhar
                            o que realmente está acontecendo.
                        </p>
                    </div>
                </div>


                {/* CONTEÚDO PRINCIPAL */}
                <div className="mt-16 grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
                    {/* FLUXO DA OPERAÇÃO */}
                    <div className="rounded-[2rem] border border-slate-200/80 bg-[#f8fafc] p-7 md:p-9">
                        <div className="flex items-center justify-between gap-6">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                    Fluxo operacional
                                </p>

                                <h3 className="mt-2 text-xl font-bold tracking-[-0.02em] text-slate-950">
                                    Da entrada à decisão.
                                </h3>
                            </div>

                            <div className="hidden items-center gap-2 sm:flex">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                <span className="text-xs font-semibold text-slate-500">
                                    Tudo conectado
                                </span>
                            </div>
                        </div>


                        <div className="mt-9">
                            {flowSteps.map(
                                (
                                    step,
                                    index,
                                ) => {
                                    const Icon =
                                        step.icon;

                                    const isLast =
                                        index ===
                                        flowSteps.length -
                                        1;

                                    return (
                                        <div
                                            key={
                                                step.title
                                            }
                                            className="relative grid grid-cols-[48px_1fr] gap-5"
                                        >
                                            {/* COLUNA VISUAL */}
                                            <div className="relative flex flex-col items-center">
                                                <div
                                                    className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-xl border ${isLast
                                                            ? "border-blue-600 bg-blue-600 text-white shadow-[0_12px_30px_-12px_rgba(37,99,235,0.65)]"
                                                            : "border-slate-200 bg-white text-slate-700"
                                                        }`}
                                                >
                                                    <Icon
                                                        size={
                                                            18
                                                        }
                                                    />
                                                </div>

                                                {!isLast && (
                                                    <div className="absolute bottom-0 top-11 w-px bg-gradient-to-b from-blue-200 via-slate-200 to-slate-200" />
                                                )}
                                            </div>


                                            {/* TEXTO */}
                                            <div
                                                className={
                                                    isLast
                                                        ? "pb-0"
                                                        : "pb-8"
                                                }
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`text-[10px] font-black tracking-[0.18em] ${isLast
                                                                ? "text-blue-600"
                                                                : "text-slate-400"
                                                            }`}
                                                    >
                                                        {
                                                            step.number
                                                        }
                                                    </span>

                                                    <span className="h-px w-5 bg-slate-200" />

                                                    <span
                                                        className={`text-[10px] font-bold uppercase tracking-[0.16em] ${isLast
                                                                ? "text-blue-600"
                                                                : "text-slate-400"
                                                            }`}
                                                    >
                                                        {isLast
                                                            ? "Resultado"
                                                            : "Operação"}
                                                    </span>
                                                </div>

                                                <h4 className="mt-2 text-lg font-bold text-slate-950">
                                                    {
                                                        step.title
                                                    }
                                                </h4>

                                                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                                    {
                                                        step.description
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </div>


                    {/* NÚCLEO CFIT */}
                    <div className="relative overflow-hidden rounded-[2rem] bg-[#050b1c] p-7 text-white shadow-[0_35px_80px_-45px_rgba(15,23,42,0.7)] md:p-9">
                        {/* EFEITOS */}
                        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/20 blur-[90px]" />

                        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]" />

                        <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:38px_38px]" />


                        <div className="relative z-10">
                            {/* TOPO */}
                            <div className="flex items-start justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="h-px w-7 bg-gradient-to-r from-blue-500 to-cyan-400" />

                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                                            Núcleo Cfit
                                        </span>
                                    </div>

                                    <h3 className="mt-4 max-w-md text-2xl font-bold tracking-[-0.03em] text-white md:text-3xl">
                                        Tudo converge para
                                        uma única operação.
                                    </h3>
                                </div>

                                <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 sm:flex">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                                    <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                                        Conectado
                                    </span>
                                </div>
                            </div>


                            {/* MAPA */}
                            <div className="relative mt-8 h-[350px] sm:h-[390px]">
                                {/* CONEXÕES */}
                                <svg
                                    viewBox="0 0 100 100"
                                    preserveAspectRatio="none"
                                    className="pointer-events-none absolute inset-0 h-full w-full"
                                >
                                    <line
                                        x1="24"
                                        y1="22"
                                        x2="50"
                                        y2="50"
                                        stroke="rgba(59,130,246,0.35)"
                                        strokeWidth="0.35"
                                    />

                                    <line
                                        x1="76"
                                        y1="22"
                                        x2="50"
                                        y2="50"
                                        stroke="rgba(34,211,238,0.30)"
                                        strokeWidth="0.35"
                                    />

                                    <line
                                        x1="24"
                                        y1="78"
                                        x2="50"
                                        y2="50"
                                        stroke="rgba(59,130,246,0.30)"
                                        strokeWidth="0.35"
                                    />

                                    <line
                                        x1="76"
                                        y1="78"
                                        x2="50"
                                        y2="50"
                                        stroke="rgba(34,211,238,0.35)"
                                        strokeWidth="0.35"
                                    />
                                </svg>


                                {/* ALUNO */}
                                <div className="absolute left-[2%] top-[7%] w-[140px] rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm sm:left-[5%] sm:w-[155px]">
                                    <Users
                                        size={17}
                                        className="text-cyan-400"
                                    />

                                    <p className="mt-3 text-sm font-bold text-white">
                                        Alunos
                                    </p>

                                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                        Cadastro e histórico
                                    </p>
                                </div>


                                {/* MATRÍCULAS */}
                                <div className="absolute right-[2%] top-[7%] w-[140px] rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm sm:right-[5%] sm:w-[155px]">
                                    <Dumbbell
                                        size={17}
                                        className="text-blue-400"
                                    />

                                    <p className="mt-3 text-sm font-bold text-white">
                                        Matrículas
                                    </p>

                                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                        Planos e regras
                                    </p>
                                </div>


                                {/* FINANCEIRO */}
                                <div className="absolute bottom-[5%] left-[2%] w-[140px] rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm sm:left-[5%] sm:w-[155px]">
                                    <CreditCard
                                        size={17}
                                        className="text-blue-400"
                                    />

                                    <p className="mt-3 text-sm font-bold text-white">
                                        Financeiro
                                    </p>

                                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                        Cobranças e pagamentos
                                    </p>
                                </div>


                                {/* GESTÃO */}
                                <div className="absolute bottom-[5%] right-[2%] w-[140px] rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm sm:right-[5%] sm:w-[155px]">
                                    <BarChart3
                                        size={17}
                                        className="text-cyan-400"
                                    />

                                    <p className="mt-3 text-sm font-bold text-white">
                                        Gestão
                                    </p>

                                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                        Contexto e decisão
                                    </p>
                                </div>


                                {/* CENTRO */}
                                <div className="absolute left-1/2 top-1/2 flex h-[118px] w-[118px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-400/20 bg-slate-950 shadow-[0_0_70px_rgba(37,99,235,0.25)] sm:h-[140px] sm:w-[140px]">
                                    <div className="absolute inset-3 rounded-full border border-blue-500/20" />

                                    <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue-600/20 to-cyan-400/10 blur-md" />

                                    <div className="relative text-center">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                                            Cfit
                                        </span>

                                        <p className="mt-1 text-lg font-black tracking-[-0.03em] text-white">
                                            Operação
                                        </p>

                                        <p className="text-[10px] font-medium text-slate-500">
                                            conectada
                                        </p>
                                    </div>
                                </div>
                            </div>


                            {/* ROTINA + EVOLUÇÃO */}
                            <div className="grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2">
                                <div className="flex items-start gap-3">
                                    <CalendarDays
                                        size={18}
                                        className="mt-0.5 shrink-0 text-cyan-400"
                                    />

                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            Agenda integrada
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            A rotina também faz
                                            parte da operação.
                                        </p>
                                    </div>
                                </div>


                                <div className="flex items-start gap-3">
                                    <GraduationCap
                                        size={18}
                                        className="mt-0.5 shrink-0 text-blue-400"
                                    />

                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            Evolução do aluno
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Treino e acompanhamento
                                            no mesmo contexto.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* FECHAMENTO */}
                <div className="mt-12 flex flex-col gap-6 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            Uma base. Uma operação.
                        </p>

                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                            Cada informação alimenta a próxima etapa.
                            O resultado é uma gestão mais simples,
                            consistente e preparada para crescer.
                        </p>
                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo(
                                "sistema",
                            )
                        }
                        className="group inline-flex shrink-0 items-center gap-3 text-sm font-bold text-slate-950 transition-colors hover:text-blue-600"
                    >
                        Ver o Cfit em ação

                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white transition-all duration-300 group-hover:translate-x-1 group-hover:bg-blue-600">
                            <ArrowRight
                                size={16}
                            />
                        </span>
                    </button>
                </div>
            </div>
        </section>
    );
}