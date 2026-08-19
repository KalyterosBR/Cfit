import DashboardLayout from "@/layouts/DashboardLayout";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RecentPayments from "@/components/dashboard/RecentPayments";
import RecentCheckins from "@/components/dashboard/RecentCheckins";
import PendingStudents from "@/components/dashboard/PendingStudents";

import {
    Users,
    DollarSign,
    Dumbbell,
    TrendingUp,
} from "lucide-react";

export default function Dashboard() {
    return (
        <DashboardLayout>
            <DashboardHeader
                title="Dashboard"
                subtitle="Visão geral da sua academia."
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Alunos ativos"
                    value="1.248"
                    icon={<Users size={21} />}
                    description="+12 este mês"
                    tone="blue"
                />

                <StatCard
                    title="Receita mensal"
                    value="R$ 89.250"
                    icon={<DollarSign size={21} />}
                    description="+8% em relação ao mês anterior"
                    tone="emerald"
                />

                <StatCard
                    title="Check-ins hoje"
                    value="352"
                    icon={<Dumbbell size={21} />}
                    description="Até o momento"
                    tone="cyan"
                />

                <StatCard
                    title="Crescimento"
                    value="+12%"
                    icon={<TrendingUp size={21} />}
                    description="Últimos 30 dias"
                    tone="violet"
                />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <RevenueChart />
                </div>

                <RecentPayments />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <RecentCheckins />
                </div>

                <PendingStudents />
            </div>
        </DashboardLayout>
    );
}
