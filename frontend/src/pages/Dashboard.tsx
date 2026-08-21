import { useCallback, useEffect, useState } from "react";

import { Link } from "react-router-dom";

import DashboardLayout from "@/layouts/DashboardLayout";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RecentPayments from "@/components/dashboard/RecentPayments";
import RecentCheckins from "@/components/dashboard/RecentCheckins";
import PendingStudents from "@/components/dashboard/PendingStudents";
import DashboardAttention, { type DashboardRole } from "@/components/dashboard/DashboardAttention";
import RevenueGoalCard from "@/components/dashboard/RevenueGoalCard";
import CheckInGoalCard from "@/components/dashboard/CheckInGoalCard";
import RevenueTrendInsight from "@/components/dashboard/RevenueTrendInsight";
import ActiveStudentGoalCard from "@/components/dashboard/ActiveStudentGoalCard";
import ActiveBaseTrend from "@/components/dashboard/ActiveBaseTrend";
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

export default function Dashboard() {
    const [dashboardRole, setDashboardRole] = useState<DashboardRole>(() => (
        (localStorage.getItem("cfit_dashboard_role") as DashboardRole | null)
        ?? "manager"
    ));
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

    return (
        <DashboardLayout>
            <DashboardHeader
                title="Dashboard"
                subtitle="Visão geral da sua academia."
            >
                <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm">
                    <span className="sr-only">Visão do Dashboard</span>
                    <select value={dashboardRole} onChange={(event) => { const role = event.target.value as DashboardRole; setDashboardRole(role); localStorage.setItem("cfit_dashboard_role", role); }} className="bg-transparent outline-none">
                        <option value="manager">Visão do gestor</option><option value="reception">Visão da recepção</option><option value="finance">Visão financeira</option><option value="instructor">Visão do professor</option><option value="commercial">Visão comercial</option>
                    </select>
                </label>
                <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm">
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

            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs font-medium text-blue-800">
                Dados operacionais reais. O período selecionado afeta receita,
                crescimento, histórico, pagamentos, alunos ativos, check-ins e
                metas; cobranças vencidas refletem a situação atual.
            </div>

            <nav aria-label="Seções do Dashboard" className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                {[
                    ["overview", "Visão geral"],
                    ["goals", "Metas"],
                    ["attention", "Requer atenção"],
                    ["indicators", "Indicadores detalhados"],
                ].map(([id, label]) => (
                    <button key={id} type="button" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })} className="h-9 shrink-0 rounded-xl px-4 text-xs font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {label}
                    </button>
                ))}
            </nav>

            <div id="overview" className="scroll-mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {showStudents && <Link
                    to="/students?status=active"
                    onClick={(event) => {
                        if (!isCurrentPeriod) event.preventDefault();
                    }}
                    aria-label={isCurrentPeriod
                        ? "Abrir lista de alunos ativos"
                        : "Indicador histórico sem listagem retrospectiva"}
                    className="rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <StatCard
                        title="Alunos ativos"
                        value={activeStudentsError
                            ? "Indisponível"
                            : activeStudentsCount === null
                                ? "Carregando..."
                                : activeStudentsCount.toLocaleString("pt-BR")}
                        icon={<Users size={21} />}
                        description={activeStudentsError
                            ? "Não foi possível calcular agora"
                            : !isCurrentPeriod
                                ? studentSummary?.data_quality === "partial"
                                    ? "Histórico parcial neste período"
                                    : "Fechamento histórico do mês"
                                : studentSummary?.data_quality === "partial"
                                ? "Histórico parcial neste período"
                                : studentSummary?.change === 0
                                    ? "Estável em relação ao mês anterior"
                                    : studentSummary
                                        ? `${studentSummary.change > 0 ? "+" : ""}${studentSummary.change} vs. mês anterior`
                                        : "Abrir alunos ativos"}
                        tone="blue"
                    />
                </Link>}

                {showFinancial && <Link
                    to={financialPeriodLink}
                    aria-label={`Abrir recebimentos de ${selectedPeriodLabel}`}
                    className="rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <StatCard
                        title="Receita no período"
                        value={monthlyRevenueError
                            ? "Indisponível"
                            : financialLoading || monthlyRevenue === null
                                ? "Carregando..."
                                : formatMoney(monthlyRevenue)}
                        icon={<DollarSign size={21} />}
                        description={monthlyRevenueError
                            ? "Não foi possível calcular agora"
                            : `Abrir recebimentos de ${selectedPeriodLabel}${isCurrentPeriod ? " até hoje" : ""}`}
                        tone="emerald"
                    />
                </Link>}

                {showCheckIns && <Link to={`/checkins?from=${getCurrentPeriod()}-${String(new Date().getDate()).padStart(2, "0")}&to=${getCurrentPeriod()}-${String(new Date().getDate()).padStart(2, "0")}`} className="rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <StatCard
                        title="Check-ins hoje"
                        value={checkInsError ? "Indisponível" : todayCheckIns === null ? "Carregando..." : todayCheckIns.toLocaleString("pt-BR")}
                        icon={<Dumbbell size={21} />}
                        description={checkInsError ? "Não foi possível calcular agora" : "Abrir acessos de hoje"}
                        tone="cyan"
                    />
                </Link>}

                {showFinancial && <Link
                    to={financialPeriodLink}
                    aria-label={`Abrir dados financeiros de ${selectedPeriodLabel}`}
                    className="rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <StatCard
                        title="Crescimento da receita"
                        value={monthlyRevenueError
                            ? "Indisponível"
                            : financialLoading
                                ? "Carregando..."
                                : revenueGrowth === null
                                    ? "Sem base"
                                    : formatGrowth(revenueGrowth)}
                        icon={<TrendingUp size={21} />}
                        description={monthlyRevenueError
                            ? "Não foi possível calcular agora"
                            : financialLoading
                                ? "Calculando comparação"
                                : revenueGrowth === null || previousRevenue === null
                                    ? "Período anterior sem receita comparável"
                                    : `Período anterior equivalente: ${formatMoney(previousRevenue)}`}
                        tone="violet"
                    />
                </Link>}
            </div>

            {showFinancial && <RevenueTrendInsight
                data={revenueInsight}
                loading={financialLoading}
                error={monthlyRevenueError}
                periodLabel={selectedPeriodLabel}
                detailsLink={financialPeriodLink}
            />}

            {showStudents && <ActiveBaseTrend
                data={studentSummary}
                loading={activeStudentsCount === null && !activeStudentsError}
                error={activeStudentsError}
                periodLabel={selectedPeriodLabel}
            />}

            <div id="goals" className="mt-6 scroll-mt-6 grid gap-6 xl:grid-cols-3">
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

            <div id="attention" className="scroll-mt-6">
                <DashboardAttention role={dashboardRole} />
            </div>

            <div id="indicators" className="scroll-mt-6">
            {(showFinancial || showCheckIns) && <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                {showFinancial && <>
                <div className="xl:col-span-2">
                    <RevenueChart
                        history={revenueHistory}
                        loading={financialLoading}
                        error={monthlyRevenueError}
                        onRetry={loadFinancialSummary}
                        rangeLabel={`6 meses até ${selectedPeriodLabel}`}
                    />
                </div>

                <RecentPayments
                    payments={recentPayments}
                    loading={financialLoading}
                    error={monthlyRevenueError}
                    onRetry={loadFinancialSummary}
                    periodLabel={selectedPeriodLabel}
                    linkToFinance
                />
                </>}
            </div>}

            {(showCheckIns || showFinancial) && <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                {showCheckIns &&
                <div className="xl:col-span-2">
                    <RecentCheckins
                        checkins={recentCheckIns}
                        loading={checkInsLoading}
                        error={checkInsError}
                        onRetry={loadCheckIns}
                    />
                </div>
                }

                {showFinancial && <PendingStudents
                    charges={overdueCharges}
                    loading={overdueChargesLoading}
                    error={overdueChargesError}
                    onRetry={loadOverdueCharges}
                />}
            </div>}
            </div>
        </DashboardLayout>
    );
}
