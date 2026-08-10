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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">
                    Receita mensal
                </h2>

                <p className="text-sm text-slate-500">
                    Evolução da receita nos últimos meses
                </p>
            </div>

            <div className="h-72 w-full">
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
                                    stopColor="#2563eb"
                                    stopOpacity={0.25}
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
                        />

                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatAxisValue}
                            width={85}
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
                            stroke="#2563eb"
                            strokeWidth={3}
                            fill="url(#revenueGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}