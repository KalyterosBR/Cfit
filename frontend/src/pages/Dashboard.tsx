import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Link } from "react-router-dom";
import { useSession } from "@/features/auth/access-control";

import DashboardLayout from "@/layouts/DashboardLayout";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RecentPayments from "@/components/dashboard/RecentPayments";
import RecentCheckins from "@/components/dashboard/RecentCheckins";
import PendingStudents from "@/components/dashboard/PendingStudents";
import DashboardAttention, { type DashboardRole } from "@/components/dashboard/DashboardAttention";
import RevenueGoalCard from "@/components/dashboard/RevenueGoalCard";
import CheckInGoalCard from "@/components/dashboard/CheckInGoalCard";
import ActiveStudentGoalCard from "@/components/dashboard/ActiveStudentGoalCard";
import {
    getDashboardStudentSummary,
    type DashboardStudentSummary,
} from "@/features/students/services/student.service";
import {
    getDashboardFinancialSummary,
    getDashboardOverdueCharges,
    type Charge,
    type DashboardFinancialSummary,
} from "@/features/students/services/financial.service";
import {
    getDashboardCheckInSummary,
    type CheckIn,
} from "@/features/students/services/checkin.service";

import {
    CalendarRange,
    Users,
    DollarSign,
    Dumbbell,
    TrendingUp,
    ArrowUpRight,
    CircleAlert,
    Gauge,
} from "lucide-react";


function getCurrentPeriod() {
    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}


function getPeriodOptions(total = 12) {
    const today = new Date();

    return Array.from({ length: total }, (_, offset) => {
        const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const label = new Intl.DateTimeFormat("pt-BR", {
            month: "long",
            year: "numeric",
        }).format(date);

        return { value, label };
    });
}


function getFinancialPeriodLink(period: string) {
    const [year, month] = period.split("-").map(Number);
    const today = new Date();
    const isCurrentPeriod = year === today.getFullYear()
        && month === today.getMonth() + 1;
    const lastDay = isCurrentPeriod
        ? today.getDate()
        : new Date(year, month, 0).getDate();
    const params = new URLSearchParams({
        category: "paid",
        paid_date_from: `${period}-01`,
        paid_date_to: `${period}-${String(lastDay).padStart(2, "0")}`,
    });

    return `/finance?${params.toString()}#charges`;
}

type PerformanceMetricProps = {
    label: string;
    value: string;
    detail: string;
    icon: ReactNode;
    href?: string;
    disabled?: boolean;
    accent: string;
};

function PerformanceMetric({
    label,
    value,
    detail,
    icon,
    href,
    disabled = false,
    accent,
}: PerformanceMetricProps) {
    const content = (
        <>
            <div className="flex items-center justify-between gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] [&>svg]:h-[19px] [&>svg]:w-[19px] [&>svg]:stroke-[2.4] ${accent}`}>
                    {icon}
                </span>
                {href && !disabled && (
                    <ArrowUpRight size={15} className="text-slate-300 transition group-hover:text-blue-700" />
                )}
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-[clamp(1.55rem,2vw,2.35rem)] font-black tracking-[-0.055em] text-slate-950">
                {value}
            </p>
            <p className="mt-2 max-w-[15rem] text-xs leading-5 text-slate-500">
                {detail}
            </p>
        </>
    );

    const className = "group relative py-5 transition md:pl-7 md:before:absolute md:before:bottom-5 md:before:left-0 md:before:top-5 md:before:w-px md:before:bg-gradient-to-b md:before:from-transparent md:before:via-slate-300 md:before:to-transparent lg:pl-9";

    if (!href || disabled) return <div className={className}>{content}</div>;

    return (
        <Link to={href} className={`${className} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}>
            {content}
        </Link>
    );
}

function OperationalOrbit({ attentionCount, loading, demo = false }: { attentionCount: number; loading: boolean; demo?: boolean }) {
    return (
        <div className="relative mx-auto aspect-square w-full max-w-[420px]" aria-hidden="true">
            <div className="absolute inset-[9%] rounded-full bg-[radial-gradient(circle_at_42%_38%,rgba(255,255,255,.95),rgba(219,234,254,.62)_38%,rgba(186,230,253,.12)_68%,transparent_72%)]" />
            <svg viewBox="0 0 420 420" className="absolute inset-0 h-full w-full overflow-visible">
                <defs>
                    <linearGradient id="orbitStroke" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity=".08" />
                        <stop offset="52%" stopColor="#06b6d4" stopOpacity=".65" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity=".08" />
                    </linearGradient>
                </defs>
                <circle cx="210" cy="210" r="172" fill="none" stroke="url(#orbitStroke)" strokeWidth="1.5" strokeDasharray="3 9" />
                <circle cx="210" cy="210" r="132" fill="none" stroke="#2563eb" strokeOpacity=".12" />
                <path d="M40 236 C106 130 145 305 225 196 C282 119 325 190 386 112" fill="none" stroke="#2563eb" strokeOpacity=".2" strokeWidth="1.5" />
                <path d="M38 246 C108 140 150 315 230 206 C286 130 330 200 390 122" fill="none" stroke="#06b6d4" strokeOpacity=".5" strokeWidth="2.5" />
                <circle cx="230" cy="206" r="5" fill="#06b6d4" />
                <circle cx="386" cy="112" r="4" fill="#2563eb" />
                <circle cx="67" cy="198" r="3" fill="#22c55e" />
            </svg>
            <div className="absolute inset-[28%] flex flex-col items-center justify-center rounded-full border border-blue-200/70 bg-white/70 text-center backdrop-blur-md">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Sinal prioritário</span>
                {demo && (
                    <span className="mt-1 rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-amber-700">
                        Demonstração
                    </span>
                )}
                <strong className="mt-2 text-4xl font-black tracking-[-0.06em] text-slate-950">
                    {loading ? "· ·" : attentionCount}
                </strong>
                <span className="mt-1 max-w-24 text-[10px] font-semibold leading-4 text-slate-500">
                    {attentionCount === 1 ? "ação financeira" : "ações financeiras"}
                </span>
            </div>
            <span className="absolute left-[2%] top-[42%] text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Base</span>
            <span className="absolute right-[1%] top-[20%] text-[9px] font-bold uppercase tracking-[0.18em] text-blue-500">Próximo passo</span>
            <span className="absolute bottom-[8%] right-[16%] text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-600">Ritmo</span>
        </div>
    );
}

export default function Dashboard() {
    const session = useSession();
    const roleMap: Record<string, DashboardRole> = { MANAGER: "manager", RECEPTION: "reception", FINANCIAL: "finance", TRAINER: "instructor", OWNER: "manager", ADMIN: "manager" };
    const canChooseRole = session.role === "OWNER" || session.role === "ADMIN";
    const [dashboardRole, setDashboardRole] = useState<DashboardRole>(() => canChooseRole ? ((localStorage.getItem("cfit_dashboard_role") as DashboardRole | null) ?? "manager") : (roleMap[session.role] ?? "manager"));
    const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod);
    const [activeStudentsCount, setActiveStudentsCount] =
        useState<number | null>(null);
    const [activeStudentsError, setActiveStudentsError] =
        useState(false);
    const [studentSummary, setStudentSummary] =
        useState<DashboardStudentSummary | null>(null);
    const [monthlyRevenue, setMonthlyRevenue] =
        useState<string | null>(null);
    const [monthlyRevenueError, setMonthlyRevenueError] =
        useState(false);
    const [recentPayments, setRecentPayments] =
        useState<Charge[]>([]);
    const [financialLoading, setFinancialLoading] =
        useState(true);
    const [revenueGrowth, setRevenueGrowth] =
        useState<string | null>(null);
    const [previousRevenue, setPreviousRevenue] =
        useState<string | null>(null);
    const [revenueHistory, setRevenueHistory] = useState<
        DashboardFinancialSummary["revenue_history"]
    >([]);
    const [revenueInsight, setRevenueInsight] =
        useState<DashboardFinancialSummary | null>(null);
    const [overdueCharges, setOverdueCharges] =
        useState<Charge[]>([]);
    const [overdueChargesLoading, setOverdueChargesLoading] =
        useState(true);
    const [overdueChargesError, setOverdueChargesError] =
        useState(false);
    const [todayCheckIns, setTodayCheckIns] =
        useState<number | null>(null);
    const [periodCheckIns, setPeriodCheckIns] =
        useState<number | null>(null);
    const [recentCheckIns, setRecentCheckIns] =
        useState<CheckIn[]>([]);
    const [checkInsLoading, setCheckInsLoading] =
        useState(true);
    const [checkInsError, setCheckInsError] =
        useState(false);

    useEffect(() => {
        let current = true;

        getDashboardStudentSummary(selectedPeriod)
            .then((summary) => {
                if (!current) return;

                setActiveStudentsCount(summary.active_count);
                setStudentSummary(summary);
                setActiveStudentsError(false);
            })
            .catch((requestError) => {
                console.error(requestError);

                if (!current) return;

                setActiveStudentsCount(null);
                setStudentSummary(null);
                setActiveStudentsError(true);
            });

        return () => {
            current = false;
        };
    }, [selectedPeriod]);

    async function loadOverdueCharges() {
        try {
            setOverdueChargesLoading(true);
            setOverdueChargesError(false);
            setOverdueCharges(await getDashboardOverdueCharges());
        } catch (requestError) {
            console.error(requestError);
            setOverdueCharges([]);
            setOverdueChargesError(true);
        } finally {
            setOverdueChargesLoading(false);
        }
    }

    useEffect(() => {
        loadOverdueCharges();
    }, []);

    const loadCheckIns = useCallback(async () => {
        try {
            setCheckInsLoading(true);
            setCheckInsError(false);

            const summary = await getDashboardCheckInSummary(selectedPeriod);
            setTodayCheckIns(summary.today_count);
            setPeriodCheckIns(summary.period_count);
            setRecentCheckIns(summary.recent_checkins);
        } catch (requestError) {
            console.error(requestError);
            setTodayCheckIns(null);
            setPeriodCheckIns(null);
            setRecentCheckIns([]);
            setCheckInsError(true);
        } finally {
            setCheckInsLoading(false);
        }
    }, [selectedPeriod]);

    useEffect(() => {
        loadCheckIns();
    }, [loadCheckIns]);

    const loadFinancialSummary = useCallback(async () => {
        try {
            setFinancialLoading(true);
            setMonthlyRevenueError(false);

            const summary = await getDashboardFinancialSummary(selectedPeriod);
            setMonthlyRevenue(summary.monthly_revenue);
            setRecentPayments(summary.recent_payments);
            setRevenueGrowth(summary.growth_percentage);
            setPreviousRevenue(summary.previous_revenue);
            setRevenueHistory(summary.revenue_history);
            setRevenueInsight(summary);
        } catch (requestError) {
            console.error(requestError);
            setMonthlyRevenue(null);
            setRecentPayments([]);
            setRevenueGrowth(null);
            setPreviousRevenue(null);
            setRevenueHistory([]);
            setRevenueInsight(null);
            setMonthlyRevenueError(true);
        } finally {
            setFinancialLoading(false);
        }
    }, [selectedPeriod]);

    useEffect(() => {
        loadFinancialSummary();
    }, [loadFinancialSummary]);

    function formatMoney(value: string) {
        return Number(value).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    function formatGrowth(value: string) {
        const percentage = Number(value);
        const sign = percentage > 0 ? "+" : "";

        return `${sign}${percentage.toLocaleString("pt-BR", {
            maximumFractionDigits: 1,
        })}%`;
    }

    const periodOptions = getPeriodOptions();
    const selectedPeriodLabel = periodOptions.find(
        (option) => option.value === selectedPeriod,
    )?.label ?? selectedPeriod;
    const isCurrentPeriod = selectedPeriod === getCurrentPeriod();
    const financialPeriodLink = getFinancialPeriodLink(selectedPeriod);
    const showFinancial = dashboardRole === "manager" || dashboardRole === "finance";
    const showStudents = dashboardRole === "manager" || dashboardRole === "reception" || dashboardRole === "commercial";
    const showCheckIns = dashboardRole === "manager" || dashboardRole === "reception" || dashboardRole === "instructor";
    const priorityIsDemo = !overdueChargesLoading
        && !overdueChargesError
        && overdueCharges.length === 0;
    const displayedPriorityCount = priorityIsDemo ? 8 : overdueCharges.length;

    return (
        <DashboardLayout>
            <DashboardHeader
                title="Dashboard"
                subtitle="O ritmo da sua operação, traduzido em próximas ações."
            >
                <label className="flex h-11 items-center gap-2 rounded-full border border-slate-200/80 bg-white/60 px-4 text-sm font-semibold text-slate-700 backdrop-blur-sm">
                    <span className="sr-only">Visão do Dashboard</span>
                    <select disabled={!canChooseRole} value={dashboardRole} onChange={(event) => { const role = event.target.value as DashboardRole; setDashboardRole(role); localStorage.setItem("cfit_dashboard_role", role); }} className="bg-transparent outline-none disabled:cursor-not-allowed">
                        <option value="manager">Visão do gestor</option><option value="reception">Visão da recepção</option><option value="finance">Visão financeira</option><option value="instructor">Visão do professor</option><option value="commercial">Visão comercial</option>
                    </select>
                </label>
                <label className="flex h-11 items-center gap-2 rounded-full border border-slate-200/80 bg-white/60 px-4 text-sm font-semibold text-slate-700 backdrop-blur-sm">
                    <CalendarRange size={17} className="text-blue-600" />
                    <span className="sr-only">Período financeiro</span>
                    <select
                        value={selectedPeriod}
                        onChange={(event) => setSelectedPeriod(event.target.value)}
                        className="bg-transparent capitalize outline-none"
                        aria-label="Período financeiro do Dashboard"
                    >
                        {periodOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </DashboardHeader>

            <section id="overview" className="relative scroll-mt-6 py-4 lg:py-8">
                <div className="pointer-events-none absolute -left-[10%] top-[5%] h-[28rem] w-[28rem] rounded-full bg-blue-200/30 blur-[110px]" />
                <div className="pointer-events-none absolute right-[5%] top-[4%] h-[24rem] w-[24rem] rounded-full bg-cyan-200/25 blur-[110px]" />
                <div className="relative grid items-center gap-8 lg:grid-cols-[1.08fr_.92fr]">
                    <div className="py-5">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-700">
                            <Gauge size={15} /> Pulso Cfit · {selectedPeriodLabel}
                        </div>
                        <h2 className="mt-6 max-w-3xl text-[clamp(2.6rem,5.4vw,5.7rem)] font-black leading-[.88] tracking-[-0.075em] text-slate-950">
                            Decida pelo
                            <span className="block bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                movimento.
                            </span>
                        </h2>
                        <p className="mt-7 max-w-xl border-l-2 border-cyan-400 pl-5 text-sm leading-7 text-slate-600 sm:text-base">
                            Uma leitura contínua da unidade ativa. O Cfit conecta resultado, ritmo e desvio para mostrar onde agir agora.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                            <Link to={overdueCharges.length > 0 ? "/finance?category=overdue#charges" : "#attention"} className="group inline-flex items-center gap-3 text-sm font-black text-slate-950">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white transition group-hover:bg-blue-700">
                                    <ArrowUpRight size={17} />
                                </span>
                                {overdueChargesLoading
                                    ? "Analisando a operação"
                                    : priorityIsDemo
                                        ? "Explorar cenário demonstrativo"
                                        : overdueCharges.length > 0
                                        ? "Tratar prioridade financeira"
                                        : "Explorar saúde operacional"}
                            </Link>
                            <span className={`text-xs font-semibold ${priorityIsDemo ? "text-amber-700" : "text-slate-400"}`}>
                                {priorityIsDemo
                                    ? "Cenário fictício para demonstração visual"
                                    : "Dados operacionais reais · unidade ativa"}
                            </span>
                        </div>
                    </div>
                    <OperationalOrbit
                        attentionCount={displayedPriorityCount}
                        loading={overdueChargesLoading}
                        demo={priorityIsDemo}
                    />
                </div>

                <div className="relative mt-4 grid border-y border-slate-200/80 md:grid-cols-2 xl:grid-cols-4">
                    {showStudents && (
                        <PerformanceMetric
                            label="Base ativa"
                            value={activeStudentsError ? "Indisponível" : activeStudentsCount === null ? "Carregando" : activeStudentsCount.toLocaleString("pt-BR")}
                            detail={activeStudentsError ? "Não foi possível calcular agora" : studentSummary ? `${studentSummary.change > 0 ? "+" : ""}${studentSummary.change} alunos em relação ao mês anterior` : "Alunos ativos na operação"}
                            icon={<Users size={16} />}
                            href="/students?status=active"
                            disabled={!isCurrentPeriod}
                            accent="border-blue-200 bg-blue-100 text-blue-700"
                        />
                    )}
                    {showFinancial && (
                        <PerformanceMetric
                            label="Receita realizada"
                            value={monthlyRevenueError ? "Indisponível" : financialLoading || monthlyRevenue === null ? "Carregando" : formatMoney(monthlyRevenue)}
                            detail={`${selectedPeriodLabel}${isCurrentPeriod ? " · acumulado até hoje" : " · período fechado"}`}
                            icon={<DollarSign size={16} />}
                            href={financialPeriodLink}
                            accent="border-emerald-200 bg-emerald-100 text-emerald-700"
                        />
                    )}
                    {showCheckIns && (
                        <PerformanceMetric
                            label="Ritmo de hoje"
                            value={checkInsError ? "Indisponível" : todayCheckIns === null ? "Carregando" : `${todayCheckIns.toLocaleString("pt-BR")} acessos`}
                            detail="Movimento registrado hoje na unidade ativa"
                            icon={<Dumbbell size={16} />}
                            href={`/checkins?from=${getCurrentPeriod()}-${String(new Date().getDate()).padStart(2, "0")}&to=${getCurrentPeriod()}-${String(new Date().getDate()).padStart(2, "0")}`}
                            accent="border-cyan-200 bg-cyan-100 text-cyan-700"
                        />
                    )}
                    {showFinancial && (
                        <PerformanceMetric
                            label="Trajetória da receita"
                            value={monthlyRevenueError ? "Indisponível" : financialLoading ? "Carregando" : revenueGrowth === null ? "Sem base" : formatGrowth(revenueGrowth)}
                            detail={revenueGrowth === null || previousRevenue === null ? "Sem período comparável" : `Base anterior: ${formatMoney(previousRevenue)}`}
                            icon={<TrendingUp size={16} />}
                            href={financialPeriodLink}
                            accent="border-violet-200 bg-violet-100 text-violet-700"
                        />
                    )}
                </div>
            </section>

            <nav aria-label="Seções do Dashboard" className="my-7 flex items-center gap-1 overflow-x-auto border-b border-slate-200/80 pb-px">
                {[
                    ["overview", "Pulso"],
                    ["goals", "Metas"],
                    ["attention", "Atenção"],
                    ["indicators", "Análise"],
                ].map(([id, label]) => (
                    <button key={id} type="button" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })} className="relative h-10 shrink-0 px-4 text-xs font-bold text-slate-500 transition after:absolute after:inset-x-4 after:bottom-[-1px] after:h-0.5 after:origin-left after:scale-x-0 after:bg-blue-600 after:transition-transform hover:text-slate-950 hover:after:scale-x-100 focus:outline-none focus:text-blue-700">
                        {label}
                    </button>
                ))}
                <span className="ml-auto hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 lg:flex">
                    <CircleAlert size={13} /> Dados operacionais reais
                </span>
            </nav>

            <section className="grid border-b border-slate-200/80 xl:grid-cols-2 xl:divide-x xl:divide-slate-200/80">
                {showFinancial && (
                    <article className="py-8 xl:pr-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">Leitura financeira</p>
                        <h2 className="mt-3 max-w-lg text-2xl font-black tracking-[-0.045em] text-slate-950">O que deslocou a receita?</h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                            {financialLoading ? "Calculando os fatores observáveis..." : monthlyRevenueError || !revenueInsight ? "Leitura indisponível neste momento." : revenueInsight.growth_driver === "payment_volume" ? "O volume de pagamentos foi o principal motor da variação." : revenueInsight.growth_driver === "average_ticket" ? "O ticket médio foi o principal motor da variação." : revenueInsight.growth_driver === "combined" ? "Volume e ticket médio atuaram em conjunto." : revenueInsight.growth_driver === "stable" ? "A receita permaneceu estável no comparativo." : "Ainda não existe base anterior suficiente."}
                        </p>
                        {revenueInsight && !financialLoading && !monthlyRevenueError && (
                            <div className="mt-8 grid grid-cols-2 overflow-hidden border-y border-blue-200/70 bg-blue-50/35">
                                <div className="border-b border-r border-blue-200/70 px-4 py-5">
                                    <span className="text-[9px] font-bold uppercase tracking-[.16em] text-blue-600">Diferença</span>
                                    <strong className="mt-2 block text-xl font-black tracking-tight text-slate-900">{Number(revenueInsight.revenue_difference) > 0 ? "+" : ""}{formatMoney(revenueInsight.revenue_difference)}</strong>
                                    <span className="mt-1 block text-[10px] font-semibold text-slate-400">contra o período anterior</span>
                                </div>
                                <div className="border-b border-blue-200/70 px-4 py-5">
                                    <span className="text-[9px] font-bold uppercase tracking-[.16em] text-blue-600">Pagamentos</span>
                                    <strong className="mt-2 block text-xl font-black tracking-tight text-slate-900">{revenueInsight.current_payment_count.toLocaleString("pt-BR")}</strong>
                                    <span className="mt-1 block text-[10px] font-semibold text-slate-400">antes {revenueInsight.previous_payment_count.toLocaleString("pt-BR")}</span>
                                </div>
                                <Link to={financialPeriodLink} className="group border-r border-blue-200/70 px-4 py-5 transition hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400">
                                    <span className="text-[9px] font-bold uppercase tracking-[.16em] text-blue-600">Ticket médio</span>
                                    <strong className="mt-2 block text-xl font-black tracking-tight text-blue-700 group-hover:text-blue-800">{formatMoney(revenueInsight.current_average_ticket)}</strong>
                                    <span className="mt-1 block text-[10px] font-semibold text-slate-400">antes {formatMoney(revenueInsight.previous_average_ticket)}</span>
                                </Link>
                                <div className="px-4 py-5">
                                    <span className="text-[9px] font-bold uppercase tracking-[.16em] text-blue-600">Receita anterior</span>
                                    <strong className="mt-2 block text-xl font-black tracking-tight text-slate-900">{formatMoney(revenueInsight.previous_revenue)}</strong>
                                    <span className="mt-1 block text-[10px] font-semibold text-slate-400">base do comparativo</span>
                                </div>
                            </div>
                        )}
                    </article>
                )}

                {showStudents && (
                    <article className="py-8 xl:pl-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">Leitura da base</p>
                        <h2 className="mt-3 max-w-lg text-2xl font-black tracking-[-0.045em] text-slate-950">Entradas, saídas e o saldo real.</h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Mudanças de status que explicam a base ativa de {selectedPeriodLabel}.</p>
                        {studentSummary && !activeStudentsError && (
                            <div className="mt-8 grid grid-cols-2 overflow-hidden border-y border-blue-200/70 bg-blue-50/35">
                                {[
                                    { label: "Novos", value: studentSummary.created_count, detail: "entraram no período" },
                                    { label: "Reativações", value: studentSummary.reactivated_count, detail: "retornaram à base" },
                                    { label: "Inativações", value: studentSummary.deactivated_count, detail: "saíram da base" },
                                    { label: "Saldo", value: studentSummary.change, detail: "variação líquida" },
                                ].map((item, index) => (
                                    <div
                                        key={item.label}
                                        className={`px-4 py-5 ${index < 2 ? "border-b border-blue-200/70" : ""} ${index % 2 === 0 ? "border-r border-blue-200/70" : ""}`}
                                    >
                                        <span className="text-[9px] font-bold uppercase tracking-[.16em] text-blue-600">{item.label}</span>
                                        <strong className={`mt-2 block text-xl font-black tracking-tight ${item.label === "Inativações" ? "text-rose-600" : item.value >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{item.label === "Saldo" && item.value > 0 ? "+" : ""}{item.value.toLocaleString("pt-BR")}</strong>
                                        <span className="mt-1 block text-[10px] font-semibold text-slate-400">{item.detail}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>
                )}
            </section>

            <section id="goals" className="mt-12 scroll-mt-6">
                <div className="mb-5 flex items-end justify-between gap-6 border-b border-slate-200 pb-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Ritmo esperado</p>
                        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Metas em movimento</h2>
                    </div>
                    <p className="hidden max-w-md text-right text-sm leading-6 text-slate-500 md:block">
                        O resultado atual ganha contexto quando comparado ao ponto em que deveria estar no período.
                    </p>
                </div>
                <div className="relative grid overflow-hidden border-y border-blue-200/70 bg-[linear-gradient(115deg,rgba(219,234,254,.48),rgba(236,254,255,.34)_45%,rgba(238,242,255,.45))] xl:grid-cols-3 xl:divide-x xl:divide-blue-200/70 [&>section]:rounded-none [&>section]:border-0 [&>section]:bg-transparent [&>section]:shadow-none">
                {showFinancial && <RevenueGoalCard
                    key={`revenue-${selectedPeriod}`}
                    period={selectedPeriod}
                    periodLabel={selectedPeriodLabel}
                    revenue={monthlyRevenue}
                    revenueLoading={financialLoading}
                    revenueError={monthlyRevenueError}
                />}
                {showCheckIns && <CheckInGoalCard
                    key={`checkins-${selectedPeriod}`}
                    period={selectedPeriod}
                    periodLabel={selectedPeriodLabel}
                    checkInCount={periodCheckIns}
                    checkInsLoading={checkInsLoading}
                    checkInsError={checkInsError}
                />}
                {showStudents && <ActiveStudentGoalCard
                    key={`students-${selectedPeriod}`}
                    period={selectedPeriod}
                    periodLabel={selectedPeriodLabel}
                    activeCount={activeStudentsCount}
                    loading={activeStudentsCount === null && !activeStudentsError}
                    error={activeStudentsError}
                    dataQuality={studentSummary?.data_quality ?? null}
                />}
                </div>
            </section>

            <div id="attention" className="scroll-mt-6">
                <DashboardAttention role={dashboardRole} variant="canvas" />
            </div>

            <div id="indicators" className="mt-12 scroll-mt-6 border-t border-slate-200 pt-8">
            <div className="mb-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700">Camada analítica</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Entenda o que moveu os números</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Histórico e atividade recente para investigar a origem de cada resultado.</p>
            </div>
            {(showFinancial || showCheckIns) && <div className="mt-6 grid min-w-0 grid-cols-1 2xl:grid-cols-3">
                {showFinancial && <>
                <div className="min-w-0 2xl:col-span-2">
                    <RevenueChart
                        history={revenueHistory}
                        loading={financialLoading}
                        error={monthlyRevenueError}
                        onRetry={loadFinancialSummary}
                        rangeLabel={`6 meses até ${selectedPeriodLabel}`}
                        variant="canvas"
                    />
                </div>

                <RecentPayments
                    payments={recentPayments}
                    loading={financialLoading}
                    error={monthlyRevenueError}
                    onRetry={loadFinancialSummary}
                    periodLabel={selectedPeriodLabel}
                    linkToFinance
                    variant="canvas"
                />
                </>}
            </div>}

            {(showCheckIns || showFinancial) && <div className="mt-8 grid min-w-0 grid-cols-1 2xl:grid-cols-3">
                {showCheckIns &&
                <div className="min-w-0 overflow-hidden 2xl:col-span-2">
                    <RecentCheckins
                        checkins={recentCheckIns}
                        loading={checkInsLoading}
                        error={checkInsError}
                        onRetry={loadCheckIns}
                        variant="canvas"
                    />
                </div>
                }

                {showFinancial && <PendingStudents
                    charges={overdueCharges}
                    loading={overdueChargesLoading}
                    error={overdueChargesError}
                    onRetry={loadOverdueCharges}
                    variant="canvas"
                />}
            </div>}
            </div>
        </DashboardLayout>
    );
}
