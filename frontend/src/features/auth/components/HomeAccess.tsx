import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    CreditCard,
    DoorOpen,
    ScanFace,
    ShieldCheck,
} from "lucide-react";


const accessSteps = [
    {
        icon: ScanFace,
        title: "Identificação",
        description:
            "O aluno é reconhecido de forma rápida e segura.",
    },
    {
        icon: CreditCard,
        title: "Validação",
        description:
            "O Cfit verifica automaticamente a situação do aluno.",
    },
    {
        icon: DoorOpen,
        title: "Liberação",
        description:
            "Com tudo certo, o acesso é autorizado.",
    },
];


export default function HomeAccess() {
    return (
        <section
            id="solucoes"
            className="relative overflow-hidden bg-white pb-12 pt-16 md:pb-14 md:pt-20"
        >
            {/* ATMOSFERA */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-48 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-blue-500/[0.045] blur-[120px]" />

                <div className="absolute -right-48 bottom-0 h-[28rem] w-[28rem] rounded-full bg-cyan-400/[0.045] blur-[120px]" />

                <div className="absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>


            <div className="relative mx-auto max-w-7xl px-6">
                {/* CABEÇALHO */}
                <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-px w-8 bg-gradient-to-r from-blue-600 to-cyan-400" />

                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                                Controle de acesso
                            </span>
                        </div>

                        <h2 className="mt-4 max-w-xl text-4xl font-black leading-[1.03] tracking-[-0.045em] text-slate-950 md:text-5xl">
                            A experiência começa
                            <br />

                            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                na entrada.
                            </span>
                        </h2>
                    </div>


                    <div className="max-w-xl lg:justify-self-end">
                        <p className="text-base leading-7 text-slate-600">
                            Identificação, validação e
                            acesso trabalham juntos para
                            tornar a entrada mais rápida
                            para o aluno e mais segura para
                            a academia.
                        </p>
                    </div>
                </div>


                {/* ÁREA PRINCIPAL */}
                <div className="mt-9 grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
                    {/* FLUXO */}
                    <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#f8fafc] p-6 md:p-7">
                        <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-blue-500/[0.05] blur-[80px]" />

                        <div className="relative">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                Acesso inteligente
                            </p>

                            <h3 className="mt-2.5 max-w-sm text-2xl font-bold tracking-[-0.03em] text-slate-950">
                                Menos etapas para o aluno.
                                <br />

                                <span className="text-slate-600">
                                    Mais controle para a gestão.
                                </span>
                            </h3>
                        </div>


                        {/* FLUXO DAS ETAPAS */}
                        <div className="relative mt-6">
                            {accessSteps.map(
                                (
                                    step,
                                    index,
                                ) => {
                                    const Icon =
                                        step.icon;

                                    const isLast =
                                        index ===
                                        accessSteps.length - 1;

                                    return (
                                        <div
                                            key={
                                                step.title
                                            }
                                            className="relative grid grid-cols-[46px_1fr] gap-4"
                                        >
                                            {/* TRILHA */}
                                            <div className="relative flex flex-col items-center">
                                                <div
                                                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${isLast
                                                        ? "border-blue-600 bg-blue-600 text-white shadow-[0_12px_30px_-12px_rgba(37,99,235,0.65)]"
                                                        : "border-slate-200 bg-white text-slate-700"
                                                        }`}
                                                >
                                                    <Icon
                                                        size={17}
                                                    />
                                                </div>

                                                {!isLast && (
                                                    <div className="absolute bottom-0 top-10 w-px bg-gradient-to-b from-blue-200 via-slate-200 to-slate-200" />
                                                )}
                                            </div>


                                            {/* TEXTO */}
                                            <div
                                                className={
                                                    isLast
                                                        ? "pb-0"
                                                        : "pb-5"
                                                }
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`text-[9px] font-black tracking-[0.18em] ${isLast
                                                            ? "text-blue-600"
                                                            : "text-slate-400"
                                                            }`}
                                                    >
                                                        0
                                                        {index +
                                                            1}
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
                                                            : "Etapa"}
                                                    </span>
                                                </div>

                                                <h4 className="mt-1.5 text-base font-bold text-slate-950">
                                                    {
                                                        step.title
                                                    }
                                                </h4>

                                                <p className="mt-1 max-w-sm text-sm leading-5 text-slate-500">
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


                        {/* REGISTRO */}
                        <div className="mt-5 border-t border-slate-200 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <ShieldCheck
                                        size={17}
                                    />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        Cada acesso fica registrado.
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Mais controle e histórico
                                        para a operação.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* DEMONSTRAÇÃO */}
                    <div className="relative overflow-hidden rounded-[1.75rem] bg-[#050b1c] p-5 shadow-[0_35px_80px_-45px_rgba(15,23,42,0.7)]">
                        {/* EFEITOS */}
                        <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-blue-600/20 blur-[100px]" />

                        <div className="pointer-events-none absolute -bottom-32 left-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-[100px]" />

                        <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:38px_38px]" />


                        <div className="relative z-10">
                            {/* TOPO */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                                        Entrada principal
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-white">
                                        Controle de acesso
                                    </p>
                                </div>


                                <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                                    <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                                        Online
                                    </span>
                                </div>
                            </div>


                            <div className="mt-4 grid gap-4 md:grid-cols-[0.84fr_1.16fr]">
                                {/* IDENTIFICAÇÃO */}
                                <div className="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-slate-400">
                                            Identificação
                                        </p>

                                        <ScanFace
                                            size={16}
                                            className="text-cyan-400"
                                        />
                                    </div>


                                    <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                                        <div className="relative flex h-24 w-24 items-center justify-center">
                                            <div className="absolute inset-0 rounded-[1.7rem] border border-cyan-400/20" />

                                            <div className="absolute inset-3 rounded-[1.3rem] border border-blue-500/20" />

                                            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue-600/20 to-cyan-400/10 blur-xl" />

                                            <ScanFace
                                                size={38}
                                                className="relative text-cyan-400"
                                            />
                                        </div>

                                        <p className="mt-4 font-bold text-white">
                                            Carlos Henrique
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Identificação reconhecida
                                        </p>
                                    </div>


                                    <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2
                                                size={14}
                                                className="text-emerald-400"
                                            />

                                            <span className="text-xs font-semibold text-emerald-300">
                                                Aluno identificado
                                            </span>
                                        </div>
                                    </div>
                                </div>


                                {/* VALIDAÇÃO */}
                                <div className="space-y-3">
                                    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4.5">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                            Situação do aluno
                                        </p>

                                        <div className="mt-3.5 flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-bold text-white">
                                                    Plano Mensal
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Matrícula ativa
                                                </p>
                                            </div>

                                            <span className="rounded-full bg-emerald-400/[0.08] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-300">
                                                Ativo
                                            </span>
                                        </div>


                                        <div className="mt-3.5 border-t border-white/10 pt-3.5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <CreditCard
                                                        size={16}
                                                        className="text-blue-400"
                                                    />

                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-300">
                                                            Financeiro
                                                        </p>

                                                        <p className="mt-0.5 text-[10px] text-slate-500">
                                                            Sem pendências
                                                        </p>
                                                    </div>
                                                </div>

                                                <CheckCircle2
                                                    size={16}
                                                    className="text-emerald-400"
                                                />
                                            </div>
                                        </div>
                                    </div>


                                    {/* ACESSO LIBERADO */}
                                    <div className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-blue-600 to-cyan-500 p-4.5 text-white">
                                        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

                                        <div className="relative">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/70">
                                                        Resultado
                                                    </p>

                                                    <h4 className="mt-1.5 text-lg font-bold">
                                                        Acesso liberado
                                                    </h4>
                                                </div>

                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                                                    <DoorOpen
                                                        size={20}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-3.5 flex items-center gap-2 text-xs text-white/75">
                                                <Clock3
                                                    size={13}
                                                />

                                                Hoje, 09:18
                                            </div>
                                        </div>
                                    </div>


                                    {/* HISTÓRICO */}
                                    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3.5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-white">
                                                    Registro salvo
                                                </p>

                                                <p className="mt-1 text-[10px] text-slate-500">
                                                    Entrada principal
                                                </p>
                                            </div>

                                            <ArrowRight
                                                size={15}
                                                className="text-slate-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* FECHAMENTO */}
                <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-2xl text-sm leading-6 text-slate-500">
                        A entrada deixa de ser apenas uma
                        catraca. Ela passa a fazer parte da
                        operação, conectada ao cadastro, à
                        matrícula e ao financeiro.
                    </p>

                    <div className="flex shrink-0 items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                            Acesso conectado ao Cfit
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}