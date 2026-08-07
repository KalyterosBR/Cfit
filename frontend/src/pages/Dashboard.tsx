import DashboardLayout from "@/layouts/DashboardLayout";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";

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
                    icon={<Users size={28} />}
                    description="+12 este mês"
                />

                <StatCard
                    title="Receita mensal"
                    value="R$ 89.250"
                    icon={<DollarSign size={28} />}
                    description="+8% em relação ao mês anterior"
                />

                <StatCard
                    title="Check-ins hoje"
                    value="352"
                    icon={<Dumbbell size={28} />}
                    description="Até o momento"
                />

                <StatCard
                    title="Crescimento"
                    value="+12%"
                    icon={<TrendingUp size={28} />}
                    description="Últimos 30 dias"
                />
            </div>
        </DashboardLayout>
    );
}