import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import DashboardLayout from "@/layouts/DashboardLayout";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RecentPayments from "@/components/dashboard/RecentPayments";
import RecentCheckins from "@/components/dashboard/RecentCheckins";
import PendingStudents from "@/components/dashboard/PendingStudents";
import { getActiveStudentsCount } from "@/features/students/services/student.service";
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
    Users,
    DollarSign,
    Dumbbell,
    TrendingUp,
} from "lucide-react";

export default function Dashboard() {
    const [activeStudentsCount, setActiveStudentsCount] =
        useState<number | null>(null);
    const [activeStudentsError, setActiveStudentsError] =
        useState(false);
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
    const [overdueCharges, setOverdueCharges] =
        useState<Charge[]>([]);
    const [overdueChargesLoading, setOverdueChargesLoading] =
        useState(true);
    const [overdueChargesError, setOverdueChargesError] =
        useState(false);
    const [todayCheckIns, setTodayCheckIns] =
        useState<number | null>(null);
    const [recentCheckIns, setRecentCheckIns] =
        useState<CheckIn[]>([]);
    const [checkInsLoading, setCheckInsLoading] =
        useState(true);
    const [checkInsError, setCheckInsError] =
        useState(false);

    useEffect(() => {
        let current = true;

        getActiveStudentsCount()
            .then((count) => {
                if (!current) return;

                setActiveStudentsCount(count);
                setActiveStudentsError(false);
            })
            .catch((requestError) => {
                console.error(requestError);

                if (!current) return;

                setActiveStudentsError(true);
            });

        return () => {
            current = false;
        };
    }, []);

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

    async function loadCheckIns() {
        try {
            setCheckInsLoading(true);
            setCheckInsError(false);

            const summary = await getDashboardCheckInSummary();
            setTodayCheckIns(summary.today_count);
            setRecentCheckIns(summary.recent_checkins);
        } catch (requestError) {
            console.error(requestError);
            setTodayCheckIns(null);
            setRecentCheckIns([]);
            setCheckInsError(true);
        } finally {
            setCheckInsLoading(false);
        }
    }

    useEffect(() => {
        loadCheckIns();
    }, []);

    async function loadFinancialSummary() {
        try {
            setFinancialLoading(true);
            setMonthlyRevenueError(false);

            const summary = await getDashboardFinancialSummary();
            setMonthlyRevenue(summary.monthly_revenue);
            setRecentPayments(summary.recent_payments);
            setRevenueGrowth(summary.growth_percentage);
            setPreviousRevenue(summary.previous_revenue);
            setRevenueHistory(summary.revenue_history);
        } catch (requestError) {
            console.error(requestError);
            setMonthlyRevenue(null);
            setRecentPayments([]);
            setRevenueGrowth(null);
            setPreviousRevenue(null);
            setRevenueHistory([]);
            setMonthlyRevenueError(true);
        } finally {
            setFinancialLoading(false);
        }
    }

    useEffect(() => {
        loadFinancialSummary();
    }, []);

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

    return (
        <DashboardLayout>
            <DashboardHeader
                title="Dashboard"
                subtitle="Visão geral da sua academia."
            />

            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs font-medium text-blue-800">
                Todos os indicadores e painéis desta página usam dados operacionais reais.
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <Link
                    to="/students?status=active"
                    aria-label="Abrir lista de alunos ativos"
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
                            : "Abrir alunos ativos"}
                        tone="blue"
                    />
                </Link>

                <StatCard
                    title="Receita mensal"
                    value={monthlyRevenueError
                        ? "Indisponível"
                        : financialLoading || monthlyRevenue === null
                            ? "Carregando..."
                            : formatMoney(monthlyRevenue)}
                    icon={<DollarSign size={21} />}
                    description={monthlyRevenueError
                        ? "Não foi possível calcular agora"
                        : "Recebido no mês atual"}
                    tone="emerald"
                />

                <StatCard
                    title="Check-ins hoje"
                    value={checkInsError
                        ? "Indisponível"
                        : todayCheckIns === null
                            ? "Carregando..."
                            : todayCheckIns.toLocaleString("pt-BR")}
                    icon={<Dumbbell size={21} />}
                    description={checkInsError
                        ? "Não foi possível calcular agora"
                        : "Acessos registrados hoje"}
                    tone="cyan"
                />

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
                            ? "Mês anterior sem receita comparável"
                            : `Mesmo período anterior: ${formatMoney(previousRevenue)}`}
                    tone="violet"
                />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <RevenueChart
                        history={revenueHistory}
                        loading={financialLoading}
                        error={monthlyRevenueError}
                        onRetry={loadFinancialSummary}
                    />
                </div>

                <RecentPayments
                    payments={recentPayments}
                    loading={financialLoading}
                    error={monthlyRevenueError}
                    onRetry={loadFinancialSummary}
                />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <RecentCheckins
                        checkins={recentCheckIns}
                        loading={checkInsLoading}
                        error={checkInsError}
                        onRetry={loadCheckIns}
                    />
                </div>

                <PendingStudents
                    charges={overdueCharges}
                    loading={overdueChargesLoading}
                    error={overdueChargesError}
                    onRetry={loadOverdueCharges}
                />
            </div>
        </DashboardLayout>
    );
}
