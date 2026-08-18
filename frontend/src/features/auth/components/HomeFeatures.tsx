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
        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        const startPosition =
            window.scrollY;

        const targetPosition =
            element.getBoundingClientRect()
                .top + window.scrollY;

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
        <section
            id="recursos"
            className="relative overflow-hidden bg-white py-16 md:py-20"
        >
            {/* ATMOSFERA */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-48 top-20 h-[30rem] w-[30rem] rounded-full bg-blue-500/[0.04] blur-[120px]" />

                <div className="absolute -right-48 bottom-0 h-[30rem] w-[30rem] rounded-full bg-cyan-400/[0.045] blur-[120px]" />

                <div className="absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>


            <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
                {/* CABEÇALHO */}
                <div className="grid gap-6 md:gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-px w-8 bg-gradient-to-r from-blue-600 to-cyan-400" />

                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600 md:text-[10px]">
                                Gestão conectada
                            </span>
                        </div>


                        <h2 className="mt-4 max-w-xl text-3xl font-black leading-[1.03] tracking-[-0.045em] text-slate-950 sm:text-4xl md:mt-5 md:text-5xl">
                            A operação inteira,
                            <br />

                            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                conectada.
                            </span>
                        </h2>
                    </div>


                    <div className="max-w-xl lg:justify-self-end">
                        <p className="text-sm leading-7 text-slate-600 md:text-base md:leading-8">
                            Do primeiro cadastro à
                            visão gerencial, o Cfit
                            mantém cada etapa da
                            academia trabalhando
                            dentro do mesmo fluxo.
                        </p>

                        <p className="mt-2.5 text-xs leading-6 text-slate-500 md:mt-3 md:text-sm md:leading-7">
                            Menos sistemas isolados.
                            Menos informação
                            espalhada. Mais contexto
                            para acompanhar o que
                            realmente está
                            acontecendo.
                        </p>
                    </div>
                </div>


                {/* ================================================= */}
                {/* MOBILE */}
                {/* ================================================= */}

                <div className="mt-9 space-y-4 md:hidden">
                    {/* FLUXO MOBILE */}
                    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#f8fafc]">
                        <div className="border-b border-slate-200 px-5 py-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                        Fluxo operacional
                                    </p>

                                    <h3 className="mt-1.5 text-lg font-bold tracking-[-0.02em] text-slate-950">
                                        Da entrada à decisão.
                                    </h3>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                                    <span className="text-[9px] font-semibold text-slate-500">
                                        Conectado
                                    </span>
                                </div>
                            </div>
                        </div>


                        <div className="divide-y divide-slate-200">
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
                                            className={`grid grid-cols-[42px_1fr_auto] items-center gap-3 px-5 py-4 ${isLast
                                                    ? "bg-blue-50/60"
                                                    : ""
                                                }`}
                                        >
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${isLast
                                                        ? "border-blue-600 bg-blue-600 text-white"
                                                        : "border-slate-200 bg-white text-slate-700"
                                                    }`}
                                            >
                                                <Icon
                                                    size={
                                                        17
                                                    }
                                                />
                                            </div>


                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`text-[8px] font-black tracking-[0.16em] ${isLast
                                                                ? "text-blue-600"
                                                                : "text-slate-400"
                                                            }`}
                                                    >
                                                        {
                                                            step.number
                                                        }
                                                    </span>

                                                    <span
                                                        className={`text-[8px] font-bold uppercase tracking-[0.14em] ${isLast
                                                                ? "text-blue-600"
                                                                : "text-slate-400"
                                                            }`}
                                                    >
                                                        {isLast
                                                            ? "Resultado"
                                                            : "Operação"}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-sm font-bold text-slate-950">
                                                    {
                                                        step.title
                                                    }
                                                </p>

                                                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                                                    {
                                                        step.description
                                                    }
                                                </p>
                                            </div>


                                            {!isLast && (
                                                <ArrowRight
                                                    size={
                                                        14
                                                    }
                                                    className="shrink-0 text-slate-300"
                                                />
                                            )}
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </div>


                    {/* NÚCLEO CFIT MOBILE */}
                    <div className="relative overflow-hidden rounded-[1.5rem] bg-[#050b1c] p-5 text-white">
                        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-blue-600/20 blur-[80px]" />

                        <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-cyan-400/10 blur-[80px]" />

                        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:34px_34px]" />


                        <div className="relative">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="h-px w-6 bg-gradient-to-r from-blue-500 to-cyan-400" />

                                        <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                                            Núcleo Cfit
                                        </span>
                                    </div>

                                    <h3 className="mt-3 max-w-[250px] text-xl font-bold leading-tight tracking-[-0.03em]">
                                        Tudo converge
                                        para uma única
                                        operação.
                                    </h3>
                                </div>


                                <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                                    <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                                        Online
                                    </span>
                                </div>
                            </div>


                            {/* CENTRO */}
                            <div className="mt-6 flex justify-center">
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-cyan-400/20 bg-slate-950 shadow-[0_0_50px_rgba(37,99,235,0.22)]">
                                    <div className="absolute inset-3 rounded-full border border-blue-500/20" />

                                    <div className="relative text-center">
                                        <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                                            Cfit
                                        </span>

                                        <p className="mt-1 text-sm font-black">
                                            Operação
                                        </p>

                                        <p className="text-[8px] text-slate-500">
                                            conectada
                                        </p>
                                    </div>
                                </div>
                            </div>


                            {/* MÓDULOS */}
                            <div className="mt-6 grid grid-cols-2 gap-2.5">
                                <div className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                                    <Users
                                        size={15}
                                        className="text-cyan-400"
                                    />

                                    <p className="mt-2 text-xs font-bold">
                                        Alunos
                                    </p>

                                    <p className="mt-1 text-[9px] leading-4 text-slate-500">
                                        Cadastro e
                                        histórico
                                    </p>
                                </div>


                                <div className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                                    <Dumbbell
                                        size={15}
                                        className="text-blue-400"
                                    />

                                    <p className="mt-2 text-xs font-bold">
                                        Matrículas
                                    </p>

                                    <p className="mt-1 text-[9px] leading-4 text-slate-500">
                                        Planos e regras
                                    </p>
                                </div>


                                <div className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                                    <CreditCard
                                        size={15}
                                        className="text-blue-400"
                                    />

                                    <p className="mt-2 text-xs font-bold">
                                        Financeiro
                                    </p>

                                    <p className="mt-1 text-[9px] leading-4 text-slate-500">
                                        Cobranças e
                                        pagamentos
                                    </p>
                                </div>


                                <div className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                                    <BarChart3
                                        size={15}
                                        className="text-cyan-400"
                                    />

                                    <p className="mt-2 text-xs font-bold">
                                        Gestão
                                    </p>

                                    <p className="mt-1 text-[9px] leading-4 text-slate-500">
                                        Contexto e decisão
                                    </p>
                                </div>
                            </div>


                            {/* COMPLEMENTOS */}
                            <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-white/10 pt-4">
                                <div className="flex items-start gap-2">
                                    <CalendarDays
                                        size={14}
                                        className="mt-0.5 shrink-0 text-cyan-400"
                                    />

                                    <div>
                                        <p className="text-[10px] font-semibold">
                                            Agenda
                                        </p>

                                        <p className="mt-0.5 text-[8px] leading-3.5 text-slate-500">
                                            Rotina
                                            integrada
                                        </p>
                                    </div>
                                </div>


                                <div className="flex items-start gap-2">
                                    <GraduationCap
                                        size={14}
                                        className="mt-0.5 shrink-0 text-blue-400"
                                    />

                                    <div>
                                        <p className="text-[10px] font-semibold">
                                            Evolução
                                        </p>

                                        <p className="mt-0.5 text-[8px] leading-3.5 text-slate-500">
                                            Jornada do
                                            aluno
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* ================================================= */}
                {/* TABLET / DESKTOP */}
                {/* ================================================= */}

                <div className="mt-10 hidden gap-6 md:grid lg:grid-cols-[0.9fr_1.1fr]">
                    {/* FLUXO */}
                    <div className="rounded-[1.75rem] border border-slate-200/80 bg-[#f8fafc] p-7 md:p-8">
                        <div className="flex items-center justify-between gap-6">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
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


                        <div className="mt-7">
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
                                            className="relative grid grid-cols-[46px_1fr] gap-4"
                                        >
                                            <div className="relative flex flex-col items-center">
                                                <div
                                                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border ${isLast
                                                            ? "border-blue-600 bg-blue-600 text-white shadow-[0_12px_30px_-12px_rgba(37,99,235,0.65)]"
                                                            : "border-slate-200 bg-white text-slate-700"
                                                        }`}
                                                >
                                                    <Icon
                                                        size={
                                                            17
                                                        }
                                                    />
                                                </div>

                                                {!isLast && (
                                                    <div className="absolute bottom-0 top-10 w-px bg-gradient-to-b from-blue-200 via-slate-200 to-slate-200" />
                                                )}
                                            </div>


                                            <div
                                                className={
                                                    isLast
                                                        ? "pb-0"
                                                        : "pb-6"
                                                }
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`text-[9px] font-black tracking-[0.18em] ${isLast
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
                                                        className={`text-[9px] font-bold uppercase tracking-[0.16em] ${isLast
                                                                ? "text-blue-600"
                                                                : "text-slate-400"
                                                            }`}
                                                    >
                                                        {isLast
                                                            ? "Resultado"
                                                            : "Operação"}
                                                    </span>
                                                </div>

                                                <h4 className="mt-1.5 text-lg font-bold text-slate-950">
                                                    {
                                                        step.title
                                                    }
                                                </h4>

                                                <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">
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
                    <div className="relative overflow-hidden rounded-[1.75rem] bg-[#050b1c] p-7 text-white shadow-[0_35px_80px_-45px_rgba(15,23,42,0.7)] md:p-8">
                        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/20 blur-[90px]" />

                        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]" />

                        <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:38px_38px]" />


                        <div className="relative z-10">
                            <div className="flex items-start justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="h-px w-7 bg-gradient-to-r from-blue-500 to-cyan-400" />

                                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                                            Núcleo Cfit
                                        </span>
                                    </div>

                                    <h3 className="mt-3 max-w-md text-2xl font-bold tracking-[-0.03em] text-white md:text-[1.75rem]">
                                        Tudo converge para
                                        uma única operação.
                                    </h3>
                                </div>

                                <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 sm:flex">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                                    <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                                        Conectado
                                    </span>
                                </div>
                            </div>


                            <div className="relative mt-6 h-[320px] sm:h-[340px]">
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


                                <div className="absolute left-[3%] top-[7%] w-[135px] rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 backdrop-blur-sm sm:left-[5%] sm:w-[150px]">
                                    <Users
                                        size={16}
                                        className="text-cyan-400"
                                    />

                                    <p className="mt-2.5 text-sm font-bold">
                                        Alunos
                                    </p>

                                    <p className="mt-1 text-[10px] leading-5 text-slate-500">
                                        Cadastro e histórico
                                    </p>
                                </div>


                                <div className="absolute right-[3%] top-[7%] w-[135px] rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 backdrop-blur-sm sm:right-[5%] sm:w-[150px]">
                                    <Dumbbell
                                        size={16}
                                        className="text-blue-400"
                                    />

                                    <p className="mt-2.5 text-sm font-bold">
                                        Matrículas
                                    </p>

                                    <p className="mt-1 text-[10px] leading-5 text-slate-500">
                                        Planos e regras
                                    </p>
                                </div>


                                <div className="absolute bottom-[5%] left-[3%] w-[135px] rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 backdrop-blur-sm sm:left-[5%] sm:w-[150px]">
                                    <CreditCard
                                        size={16}
                                        className="text-blue-400"
                                    />

                                    <p className="mt-2.5 text-sm font-bold">
                                        Financeiro
                                    </p>

                                    <p className="mt-1 text-[10px] leading-5 text-slate-500">
                                        Cobranças e
                                        pagamentos
                                    </p>
                                </div>


                                <div className="absolute bottom-[5%] right-[3%] w-[135px] rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 backdrop-blur-sm sm:right-[5%] sm:w-[150px]">
                                    <BarChart3
                                        size={16}
                                        className="text-cyan-400"
                                    />

                                    <p className="mt-2.5 text-sm font-bold">
                                        Gestão
                                    </p>

                                    <p className="mt-1 text-[10px] leading-5 text-slate-500">
                                        Contexto e decisão
                                    </p>
                                </div>


                                <div className="absolute left-1/2 top-1/2 flex h-[112px] w-[112px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-400/20 bg-slate-950 shadow-[0_0_70px_rgba(37,99,235,0.25)] sm:h-[128px] sm:w-[128px]">
                                    <div className="absolute inset-3 rounded-full border border-blue-500/20" />

                                    <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue-600/20 to-cyan-400/10 blur-md" />

                                    <div className="relative text-center">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                                            Cfit
                                        </span>

                                        <p className="mt-1 text-lg font-black tracking-[-0.03em]">
                                            Operação
                                        </p>

                                        <p className="text-[9px] font-medium text-slate-500">
                                            conectada
                                        </p>
                                    </div>
                                </div>
                            </div>


                            <div className="grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
                                <div className="flex items-start gap-3">
                                    <CalendarDays
                                        size={17}
                                        className="mt-0.5 shrink-0 text-cyan-400"
                                    />

                                    <div>
                                        <p className="text-sm font-semibold">
                                            Agenda integrada
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            A rotina também
                                            faz parte da
                                            operação.
                                        </p>
                                    </div>
                                </div>


                                <div className="flex items-start gap-3">
                                    <GraduationCap
                                        size={17}
                                        className="mt-0.5 shrink-0 text-blue-400"
                                    />

                                    <div>
                                        <p className="text-sm font-semibold">
                                            Evolução do aluno
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            Treino e
                                            acompanhamento no
                                            mesmo contexto.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* FECHAMENTO */}
                <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400 md:text-[9px]">
                            Uma base. Uma operação.
                        </p>

                        <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500 md:text-sm md:leading-6">
                            Cada informação alimenta a próxima
                            etapa. O resultado é uma gestão mais
                            simples, consistente e preparada para
                            crescer.
                        </p>
                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            smoothScrollTo(
                                "sistema",
                            )
                        }
                        className="group inline-flex shrink-0 items-center gap-3 text-xs font-bold text-slate-950 transition-colors hover:text-blue-600 md:text-sm"
                    >
                        Ver o Cfit em ação

                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white transition-all duration-300 group-hover:translate-x-1 group-hover:bg-blue-600 md:h-9 md:w-9">
                            <ArrowRight
                                size={14}
                            />
                        </span>
                    </button>
                </div>
            </div>
        </section>
    );
}