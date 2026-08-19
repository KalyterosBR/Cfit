import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const data = [
    { month: "Jan", revenue: 54200 },
    { month: "Fev", revenue: 61800 },
    { month: "Mar", revenue: 58400 },
    { month: "Abr", revenue: 69300 },
    { month: "Mai", revenue: 72100 },
    { month: "Jun", revenue: 78600 },
    { month: "Jul", revenue: 84200 },
    { month: "Ago", revenue: 89250 },
];

const formatAxisValue = (value: number) => {
    if (value === 0) {
        return "R$ 0";
    }

    return `R$ ${value / 1000} mil`;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export default function RevenueChart() {
    return (
        <div className="relative overflow-hidden rounded-[1.6rem] border border-white/[0.08] bg-[#071225] p-5 text-white shadow-[0_30px_70px_-42px_rgba(15,23,42,0.8)] sm:p-6">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-600/20 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-[90px]" />

            <div className="relative mb-6 flex items-start justify-between gap-4">
                <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                        Visão financeira
                    </p>

                    <h2 className="mt-2 text-lg font-bold text-white">
                        Receita mensal
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Evolução da receita nos últimos meses
                    </p>
                </div>

                <span className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-semibold text-slate-300">
                    Últimos 8 meses
                </span>
            </div>

            <div className="relative h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient
                                id="revenueGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#22d3ee"
                                    stopOpacity={0.3}
                                />

                                <stop
                                    offset="95%"
                                    stopColor="#2563eb"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(148,163,184,0.15)"
                        />

                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatAxisValue}
                            width={85}
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                        />

                        <Tooltip
                            formatter={(value) => [
                                formatCurrency(Number(value)),
                                "Receita",
                            ]}
                        />

                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#22d3ee"
                            strokeWidth={3}
                            fill="url(#revenueGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
