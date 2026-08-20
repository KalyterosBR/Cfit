import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";


type RevenueHistoryItem = {
    period: string;
    revenue: string;
};


type RevenueChartProps = {
    history?: RevenueHistoryItem[];
    loading?: boolean;
    error?: boolean;
    onRetry?: () => void;
};


const demoHistory: RevenueHistoryItem[] = [
    { period: "2026-03", revenue: "58400" },
    { period: "2026-04", revenue: "69300" },
    { period: "2026-05", revenue: "72100" },
    { period: "2026-06", revenue: "78600" },
    { period: "2026-07", revenue: "84200" },
    { period: "2026-08", revenue: "89250" },
];


const formatAxisValue = (value: number) => {
    if (value === 0) return "R$ 0";

    return `R$ ${(value / 1000).toLocaleString("pt-BR", {
        maximumFractionDigits: 1,
    })} mil`;
};


const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
}).format(value);


function formatMonth(period: string) {
    const [year, month] = period.split("-").map(Number);

    return new Intl.DateTimeFormat("pt-BR", {
        month: "short",
    }).format(new Date(year, month - 1, 1));
}


export default function RevenueChart({
    history = demoHistory,
    loading = false,
    error = false,
    onRetry = () => undefined,
}: RevenueChartProps) {
    const data = history.map((item) => ({
        month: formatMonth(item.period),
        revenue: Number(item.revenue),
    }));

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
                        Receita recebida
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Pagamentos confirmados por mês
                    </p>
                </div>

                <span className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-semibold text-slate-300">
                    Últimos 6 meses
                </span>
            </div>

            <div className="relative h-72 w-full">
                {loading ? (
                    <div className="h-full animate-pulse rounded-2xl bg-white/[0.05]" aria-label="Carregando evolução da receita" />
                ) : error ? (
                    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-sm text-red-100">
                        <p>Não foi possível carregar a evolução da receita.</p>
                        <button
                            type="button"
                            onClick={onRetry}
                            className="mt-3 font-semibold underline underline-offset-4"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={formatAxisValue} width={85} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                            <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Receita"]} />
                            <Area type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={3} fill="url(#revenueGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
