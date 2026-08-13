import {
    DollarSign,
    Dumbbell,
    TrendingUp,
    Users,
} from "lucide-react";

import RecentPayments from "@/components/dashboard/RecentPayments";
import RevenueChart from "@/components/dashboard/RevenueChart";
import StatCard from "@/components/dashboard/StatCard";


export default function HomeSystem() {
    return (
        <section
            id="sistema"
            className="overflow-hidden bg-slate-950 py-24"
        >
            <div className="mx-auto max-w-7xl px-6">
                {/* TÍTULO */}
                <div className="mx-auto max-w-3xl text-center">
                    <span className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                        Conheça o Cfit
                    </span>

                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
                        Sua academia em uma única visão
                    </h2>

                    <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
                        Informações importantes organizadas para você
                        acompanhar sua operação e tomar decisões com
                        mais facilidade.
                    </p>
                </div>

                {/* PREVIEW DO SISTEMA */}
                <div className="relative mx-auto mt-16 max-w-6xl">
                    <div className="absolute -inset-16 rounded-full bg-blue-600/20 blur-3xl" />

                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-3 shadow-2xl">
                        {/* BARRA DA JANELA */}
                        <div className="flex h-11 items-center gap-2 px-4">
                            <span className="h-3 w-3 rounded-full bg-red-400" />
                            <span className="h-3 w-3 rounded-full bg-amber-400" />
                            <span className="h-3 w-3 rounded-full bg-emerald-400" />

                            <span className="ml-3 text-xs font-medium text-slate-500">
                                Cfit • Dashboard
                            </span>
                        </div>

                        {/* DASHBOARD REAL */}
                        <div className="rounded-2xl bg-slate-100 p-6 md:p-8">
                            <div className="mb-7">
                                <p className="text-sm text-slate-500">
                                    Visão geral da sua academia.
                                </p>

                                <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                                    Dashboard
                                </h3>
                            </div>

                            {/* CARDS REAIS */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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

                            {/* GRÁFICO + PAGAMENTOS REAIS */}
                            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
                                <div className="xl:col-span-2">
                                    <RevenueChart />
                                </div>

                                <RecentPayments />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}