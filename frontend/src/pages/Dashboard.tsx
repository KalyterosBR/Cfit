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
import { SkeletonBlock } from "@/components/AsyncState";
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
    ChevronDown,
    Gauge,
    LayoutDashboard,
    RotateCcw,
    Settings2,
} from "lucide-react";

type OptionalDashboardSection = "goals" | "attention" | "indicators";
const DASHBOARD_SECTION_LABELS: Record<OptionalDashboardSection, string> = {
    goals: "Metas",
    attention: "Atenção",
    indicators: "Análise",
};

type DashboardPillOption<T extends string> = { value: T; label: string };

function DashboardPillSelect<T extends string>({
    value,
    options,
    onChange,
    icon,
    ariaLabel,
    disabled = false,
    className = "",
    capitalize = false,
}: {
    value: T;
    options: DashboardPillOption<T>[];
    onChange: (value: T) => void;
    icon: ReactNode;
    ariaLabel: string;
    disabled?: boolean;
    className?: string;
    capitalize?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

    return (
        <div
            className={`relative ${className}`}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
            }}
            onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
            }}
        >
            <button
                type="button"
                disabled={disabled}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
                className="relative flex h-11 w-full items-center justify-center rounded-full border border-slate-200/80 bg-white/60 px-11 text-center text-sm font-semibold text-slate-700 backdrop-blur-sm transition-colors hover:border-blue-300 hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-70 dark:border-blue-300/20 dark:bg-[#0d1a2e]/90 dark:text-slate-200 dark:hover:border-blue-300/35 dark:hover:bg-[#10213a]"
            >
                <span aria-hidden="true" className="pointer-events-none absolute left-4 text-blue-600">{icon}</span>
                <span className={capitalize ? "capitalize" : ""}>{selectedLabel}</span>
                <ChevronDown size={15} aria-hidden="true" className={`pointer-events-none absolute right-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div role="listbox" aria-label={ariaLabel} className="cfit-floating-panel absolute right-0 z-50 mt-2 w-full min-w-max overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[var(--cfit-shadow-elevated)]">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={option.value === value}
                            onClick={() => {
                                onChange(option.value);
                                setOpen(false);
                            }}
                            className={`flex min-h-10 w-full items-center justify-center rounded-xl px-5 text-center text-sm font-semibold transition-colors ${capitalize ? "capitalize" : ""} ${option.value === value ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}


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
    loading?: boolean;
    accent: string;
};

function PerformanceMetric({
    label,
    value,
    detail,
    icon,
    href,
    disabled = false,
    loading = false,
    accent,
}: PerformanceMetricProps) {
    const content = (
        <>
            <div className="flex items-center justify-between gap-3">
                {loading ? (
                    <SkeletonBlock className="h-10 w-10 rounded-full" />
                ) : (
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] [&>svg]:h-[19px] [&>svg]:w-[19px] [&>svg]:stroke-[2.4] ${accent}`}>
                        {icon}
                    </span>
                )}
                {href && !disabled && !loading && (
                    <ArrowUpRight size={15} className="text-slate-300 transition group-hover:text-blue-700" />
                )}
            </div>
            {loading ? (
                <div className="mt-5" aria-label={`Carregando ${label}`} aria-busy="true">
                    <SkeletonBlock className="h-2.5 w-24" />
                    <SkeletonBlock className="mt-3 h-9 w-32 max-w-full" />
                    <SkeletonBlock className="mt-3 h-3 w-44 max-w-full" />
                </div>
            ) : (
                <>
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
            )}
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

function OperationalPriorityPanel({
    attentionCount,
    loading,
    error,
    onRetry,
}: {
    attentionCount: number;
    loading: boolean;
    error: boolean;
    onRetry: () => void;
}) {
    const hasPriority = attentionCount > 0;

    return (
        <aside className={`relative flex h-full w-full flex-col justify-center overflow-hidden border-t border-blue-200/70 px-6 lg:border-l lg:border-t-0 lg:px-8 xl:px-10 ${hasPriority || error ? "py-7" : "py-5"}`}>
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 bg-cyan-200/25 blur-[70px]" />
            <div className="relative flex items-center justify-between gap-5 border-b border-slate-200/80 pb-5">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">Foco operacional</p>
                    <h3 className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-950">Decisão em primeiro plano</h3>
                </div>
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${error ? "bg-slate-400" : hasPriority ? "bg-rose-500" : "bg-emerald-500"}`} aria-hidden="true" />
            </div>

            {loading ? (
                <div className="relative py-5" aria-label="Carregando prioridade operacional" aria-busy="true">
                    <div className="grid grid-cols-[5rem_1fr] items-end gap-6">
                        <SkeletonBlock className="h-16 w-20 rounded-xl" />
                        <div className="border-l border-blue-200 pl-5">
                            <SkeletonBlock className="h-4 w-44 max-w-full" />
                            <SkeletonBlock className="mt-3 h-3 w-full" />
                            <SkeletonBlock className="mt-2 h-3 w-4/5" />
                        </div>
                    </div>
                    <div className="mt-5 grid border-y border-slate-200/80 sm:grid-cols-2 sm:divide-x sm:divide-slate-200/80">
                        {[1, 2].map((item) => (
                            <div key={item} className="py-4 first:pr-5 last:border-t last:border-slate-200/80 sm:last:border-t-0 sm:last:pl-5">
                                <SkeletonBlock className="h-2.5 w-16" />
                                <SkeletonBlock className="mt-3 h-3 w-full" />
                                <SkeletonBlock className="mt-2 h-3 w-3/4" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : <>
            <div className={`relative grid grid-cols-[auto_1fr] gap-x-6 ${hasPriority || error ? "py-6" : "py-4"}`}>
                <strong className="text-[clamp(3.4rem,7vw,5.4rem)] font-black leading-[.78] tracking-[-0.09em] text-slate-950">
                    {error ? "—" : attentionCount}
                </strong>
                <div className="self-end border-l border-blue-200 pl-5">
                    <p className="mt-1 text-sm font-black leading-5 text-slate-800">
                        {error
                                ? "leitura financeira indisponível"
                                : hasPriority
                                    ? attentionCount === 1 ? "ação financeira pede atenção" : "ações financeiras pedem atenção"
                                    : "nenhuma cobrança vencida"}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                        {error
                            ? "Não foi possível confirmar a situação financeira da unidade."
                            : hasPriority
                                ? "Cobranças vencidas com impacto direto no resultado da unidade."
                                : "A unidade não possui cobranças vencidas no momento."}
                    </p>
                </div>
            </div>

            <div className="relative grid border-y border-slate-200/80 sm:grid-cols-2 sm:divide-x sm:divide-slate-200/80">
                <div className="py-4 sm:pr-5">
                    <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Impacto</span>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
                        {error
                                ? "Situação ainda não confirmada"
                                : hasPriority ? "Receita e previsibilidade financeira" : "Fluxo financeiro sem atraso identificado"}
                    </p>
                </div>
                <div className="border-t border-slate-200/80 py-4 sm:border-t-0 sm:pl-5">
                    <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Próximo passo</span>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
                        {error
                                ? "Recarregar os dados financeiros"
                                : hasPriority ? "Revisar cobranças por urgência" : "Acompanhar os demais sinais da operação"}
                    </p>
                </div>
            </div>

            {error ? (
                <button
                    type="button"
                    onClick={onRetry}
                    className="group relative mt-5 inline-flex w-fit items-center gap-2 text-xs font-black text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    Tentar novamente
                    <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
            ) : hasPriority ? (
                <Link
                    to="/finance?category=overdue#charges"
                    className="group relative mt-5 inline-flex w-fit items-center gap-2 text-xs font-black text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    Abrir fila financeira
                    <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
            ) : (
                <button
                    type="button"
                    onClick={() => document.getElementById("attention")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="group relative mt-5 inline-flex w-fit items-center gap-2 text-xs font-black text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    Ver saúde operacional
                    <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
            )}
            </>}
        </aside>
    );
}

export default function Dashboard() {
    const session = useSession();
    const roleMap: Record<string, DashboardRole> = { MANAGER: "manager", RECEPTION: "reception", FINANCIAL: "finance", TRAINER: "instructor", OWNER: "manager", ADMIN: "manager" };
    const canChooseRole = session.role === "OWNER" || session.role === "ADMIN";
    const [dashboardRole, setDashboardRole] = useState<DashboardRole>(() => canChooseRole ? ((localStorage.getItem("cfit_dashboard_role") as DashboardRole | null) ?? "manager") : (roleMap[session.role] ?? "manager"));
    const preferencesKey = `cfit_dashboard_hidden_sections:${session.email}`;
    const [hiddenSections, setHiddenSections] = useState<OptionalDashboardSection[]>(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(preferencesKey) ?? "[]");
            return Array.isArray(saved) ? saved.filter((item): item is OptionalDashboardSection => item in DASHBOARD_SECTION_LABELS) : [];
        } catch {
            return [];
        }
    });
    const [customizing, setCustomizing] = useState(false);
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
    const dashboardRoleLabel: Record<DashboardRole, string> = {
        manager: "Visão do gestor",
        reception: "Visão da recepção",
        finance: "Visão financeira",
        instructor: "Visão do professor",
        commercial: "Visão comercial",
    };
    const dashboardRoleOptions = Object.entries(dashboardRoleLabel).map(([value, label]) => ({
        value: value as DashboardRole,
        label,
    }));
    function toggleSection(section: OptionalDashboardSection) {
        const next = hiddenSections.includes(section)
            ? hiddenSections.filter((item) => item !== section)
            : [...hiddenSections, section];
        setHiddenSections(next);
        localStorage.setItem(preferencesKey, JSON.stringify(next));
    }
    function resetSections() {
        setHiddenSections([]);
        localStorage.removeItem(preferencesKey);
    }
    return (
        <DashboardLayout>
            <DashboardHeader
                title="Dashboard"
                subtitle="O ritmo da sua operação, traduzido em próximas ações."
            >
                <DashboardPillSelect value={dashboardRole} options={dashboardRoleOptions} disabled={!canChooseRole} ariaLabel="Visão do Dashboard" icon={<LayoutDashboard size={17} />} className="min-w-48" onChange={(role) => { setDashboardRole(role); localStorage.setItem("cfit_dashboard_role", role); }} />
                <DashboardPillSelect value={selectedPeriod} options={periodOptions} ariaLabel="Período financeiro do Dashboard" icon={<CalendarRange size={17} />} className="min-w-48" capitalize onChange={setSelectedPeriod} />
                <button type="button" aria-expanded={customizing} onClick={() => setCustomizing((value) => !value)} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/60 text-slate-600 transition hover:border-blue-300 hover:text-blue-700" aria-label="Personalizar seções do Dashboard">
                    <Settings2 size={17} />
                </button>
            </DashboardHeader>

            {customizing && (
                <section aria-label="Preferências do Dashboard" className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="mr-2 text-xs font-bold uppercase tracking-wide text-slate-500">Seções visíveis</p>
                    {(Object.entries(DASHBOARD_SECTION_LABELS) as Array<[OptionalDashboardSection, string]>).map(([id, label]) => (
                        <label key={id} className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                            <input type="checkbox" checked={!hiddenSections.includes(id)} onChange={() => toggleSection(id)} />
                            {label}
                        </label>
                    ))}
                    <button type="button" onClick={resetSections} className="ml-auto flex items-center gap-2 text-sm font-bold text-blue-700">
                        <RotateCcw size={15} /> Restaurar padrão
                    </button>
                    <p className="w-full text-xs text-slate-500">Preferência pessoal deste navegador; dados e permissões não são alterados.</p>
                </section>
            )}

            <section id="overview" className="relative scroll-mt-6 py-4 lg:py-8">
                <div className="pointer-events-none absolute -left-[10%] top-[5%] h-[28rem] w-[28rem] rounded-full bg-blue-200/30 blur-[110px]" />
                <div className="pointer-events-none absolute right-[5%] top-[4%] h-[24rem] w-[24rem] rounded-full bg-cyan-200/25 blur-[110px]" />
                <div className="cfit-dashboard-hero relative overflow-hidden border-y border-blue-200/70 bg-[linear-gradient(115deg,rgba(255,255,255,.68),rgba(239,246,255,.72)_52%,rgba(236,254,255,.58))] lg:grid lg:grid-cols-[1.08fr_.92fr]">
                    <div className="relative px-6 py-8 sm:px-8 lg:py-9 xl:px-10">
                        <div className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-blue-200/25 blur-[80px]" />
                        <div className="relative">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-700">
                            <Gauge size={15} /> Pulso Cfit · {selectedPeriodLabel}
                        </div>
                        <h2 className="mt-5 max-w-3xl text-[clamp(2.25rem,4.3vw,4.6rem)] font-black leading-[.9] tracking-[-0.07em] text-slate-950">
                            Decida pelo
                            <span className="block bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                movimento.
                            </span>
                        </h2>
                        <p className="mt-5 max-w-xl border-l-2 border-cyan-400 pl-5 text-sm leading-6 text-slate-600 sm:text-base">
                            Uma leitura contínua da unidade ativa. O Cfit conecta resultado, ritmo e desvio para mostrar onde agir agora.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                            {overdueCharges.length > 0 ? (
                            <Link to="/finance?category=overdue#charges" className="group inline-flex items-center gap-3 text-sm font-black text-slate-950">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white transition group-hover:bg-blue-700">
                                    <ArrowUpRight size={17} />
                                </span>
                                Tratar prioridade financeira
                            </Link>
                            ) : (
                            <button
                                type="button"
                                disabled={overdueChargesLoading}
                                onClick={() => overdueChargesError
                                    ? loadOverdueCharges()
                                    : document.getElementById("attention")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                                className="group inline-flex items-center gap-3 text-sm font-black text-slate-950 disabled:cursor-wait"
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white transition group-hover:bg-blue-700">
                                    <ArrowUpRight size={17} />
                                </span>
                                {overdueChargesError ? "Tentar novamente" : "Explorar saúde operacional"}
                            </button>
                            )}
                            <span className="text-xs font-semibold text-slate-400">
                                Dados operacionais reais · unidade ativa
                            </span>
                        </div>
                        </div>
                    </div>
                    <OperationalPriorityPanel
                        attentionCount={overdueCharges.length}
                        loading={overdueChargesLoading}
                        error={overdueChargesError}
                        onRetry={loadOverdueCharges}
                    />
                </div>

                <div className="relative mt-4 grid border-y border-slate-200/80 md:grid-cols-2 xl:grid-cols-4">
                    {showStudents && (
                        <PerformanceMetric
                            label="Base ativa"
                            value={activeStudentsError ? "Indisponível" : activeStudentsCount?.toLocaleString("pt-BR") ?? ""}
                            detail={activeStudentsError ? "Não foi possível calcular agora" : studentSummary ? `${studentSummary.change > 0 ? "+" : ""}${studentSummary.change} alunos em relação ao mês anterior` : "Alunos ativos na operação"}
                            icon={<Users size={16} />}
                            href="/students?status=active"
                            disabled={!isCurrentPeriod}
                            loading={activeStudentsCount === null && !activeStudentsError}
                            accent="border-blue-200 bg-blue-100 text-blue-700"
                        />
                    )}
                    {showFinancial && (
                        <PerformanceMetric
                            label="Receita realizada"
                            value={monthlyRevenueError ? "Indisponível" : monthlyRevenue === null ? "" : formatMoney(monthlyRevenue)}
                            detail={`${selectedPeriodLabel}${isCurrentPeriod ? " · acumulado até hoje" : " · período fechado"}`}
                            icon={<DollarSign size={16} />}
                            href={financialPeriodLink}
                            loading={financialLoading && !monthlyRevenueError}
                            accent="border-emerald-200 bg-emerald-100 text-emerald-700"
                        />
                    )}
                    {showCheckIns && (
                        <PerformanceMetric
                            label="Ritmo de hoje"
                            value={checkInsError ? "Indisponível" : todayCheckIns === null ? "" : `${todayCheckIns.toLocaleString("pt-BR")} acessos`}
                            detail="Movimento registrado hoje na unidade ativa"
                            icon={<Dumbbell size={16} />}
                            href={`/checkins?from=${getCurrentPeriod()}-${String(new Date().getDate()).padStart(2, "0")}&to=${getCurrentPeriod()}-${String(new Date().getDate()).padStart(2, "0")}`}
                            loading={todayCheckIns === null && !checkInsError}
                            accent="border-cyan-200 bg-cyan-100 text-cyan-700"
                        />
                    )}
                    {showFinancial && (
                        <PerformanceMetric
                            label="Trajetória da receita"
                            value={monthlyRevenueError ? "Indisponível" : revenueGrowth === null ? "Sem base" : formatGrowth(revenueGrowth)}
                            detail={revenueGrowth === null || previousRevenue === null ? "Sem período comparável" : `Base anterior: ${formatMoney(previousRevenue)}`}
                            icon={<TrendingUp size={16} />}
                            href={financialPeriodLink}
                            loading={financialLoading && !monthlyRevenueError}
                            accent="border-violet-200 bg-violet-100 text-violet-700"
                        />
                    )}
                </div>
            </section>

            <nav aria-label="Seções do Dashboard" className="my-7 flex items-center gap-1 overflow-x-auto border-b border-slate-200/80 pb-px">
                {[
                    ["overview", "Pulso"],
                    ...(!hiddenSections.includes("goals") ? [["goals", "Metas"]] : []),
                    ...(!hiddenSections.includes("attention") ? [["attention", "Atenção"]] : []),
                    ...(!hiddenSections.includes("indicators") ? [["indicators", "Análise"]] : []),
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
                        {financialLoading ? (
                            <div className="mt-3" aria-label="Carregando leitura financeira" aria-busy="true">
                                <SkeletonBlock className="h-3 w-full max-w-xl" />
                                <SkeletonBlock className="mt-2 h-3 w-3/4 max-w-md" />
                            </div>
                        ) : (
                            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                                {monthlyRevenueError || !revenueInsight ? "Leitura indisponível neste momento." : revenueInsight.growth_driver === "payment_volume" ? "O volume de pagamentos foi o principal motor da variação." : revenueInsight.growth_driver === "average_ticket" ? "O ticket médio foi o principal motor da variação." : revenueInsight.growth_driver === "combined" ? "Volume e ticket médio atuaram em conjunto." : revenueInsight.growth_driver === "stable" ? "A receita permaneceu estável no comparativo." : "Ainda não existe base anterior suficiente."}
                            </p>
                        )}
                        {financialLoading && (
                            <div className="mt-8 grid grid-cols-2 overflow-hidden border-y border-blue-200/70" aria-hidden="true">
                                {[1, 2, 3, 4].map((item) => (
                                    <div key={item} className={`px-4 py-5 ${item < 3 ? "border-b border-blue-200/70" : ""} ${item % 2 === 1 ? "border-r border-blue-200/70" : ""}`}>
                                        <SkeletonBlock className="h-2.5 w-16" />
                                        <SkeletonBlock className="mt-3 h-6 w-24 max-w-full" />
                                        <SkeletonBlock className="mt-2 h-2.5 w-28 max-w-full" />
                                    </div>
                                ))}
                            </div>
                        )}
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
                        {!studentSummary && !activeStudentsError && (
                            <div className="mt-8 grid grid-cols-2 overflow-hidden border-y border-blue-200/70" aria-label="Carregando leitura da base" aria-busy="true">
                                {[1, 2, 3, 4].map((item) => (
                                    <div key={item} className={`px-4 py-5 ${item < 3 ? "border-b border-blue-200/70" : ""} ${item % 2 === 1 ? "border-r border-blue-200/70" : ""}`}>
                                        <SkeletonBlock className="h-2.5 w-16" />
                                        <SkeletonBlock className="mt-3 h-6 w-16" />
                                        <SkeletonBlock className="mt-2 h-2.5 w-28 max-w-full" />
                                    </div>
                                ))}
                            </div>
                        )}
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

            {!hiddenSections.includes("goals") && <section id="goals" className="mt-12 scroll-mt-6">
                <div className="mb-5 flex items-end justify-between gap-6 border-b border-slate-200 pb-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Ritmo esperado</p>
                        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Metas em movimento</h2>
                    </div>
                    <p className="hidden max-w-md text-right text-sm leading-6 text-slate-500 md:block">
                        O resultado atual ganha contexto quando comparado ao ponto em que deveria estar no período.
                    </p>
                </div>
                <div className="cfit-dashboard-goals relative grid overflow-hidden border-y border-blue-200/70 bg-[linear-gradient(115deg,rgba(219,234,254,.48),rgba(236,254,255,.34)_45%,rgba(238,242,255,.45))] xl:grid-cols-3 xl:divide-x xl:divide-blue-200/70 [&>section]:rounded-none [&>section]:border-0 [&>section]:bg-transparent [&>section]:shadow-none">
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
            </section>}

            {!hiddenSections.includes("attention") && <div id="attention" className="scroll-mt-6">
                <DashboardAttention role={dashboardRole} variant="canvas" />
            </div>}

            {!hiddenSections.includes("indicators") && <div id="indicators" className="mt-12 scroll-mt-6 border-t border-slate-200 pt-8">
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
            </div>}
        </DashboardLayout>
    );
}
