import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import type { FinancialForecast as ForecastData } from "@/features/students/services/financial.service";


type Props = {
    data: ForecastData | null;
    loading: boolean;
    error: boolean;
    months: 3 | 6 | 12;
    onMonthsChange: (months: 3 | 6 | 12) => void;
    onMonthOpen: (period: string) => void;
    onRetry: () => void;
};


function money(value: string | number) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}


function monthLabel(period: string) {
    const [year, month] = period.split("-").map(Number);

    return new Intl.DateTimeFormat("pt-BR", {
        month: "short",
        year: "2-digit",
    }).format(new Date(year, month - 1, 1));
}


function niceStep(maxValue: number) {
    if (maxValue <= 0) return 25;

    const roughStep = maxValue / 4;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const normalized = roughStep / magnitude;
    const multiplier = normalized <= 1
        ? 1
        : normalized <= 2
            ? 2
            : normalized <= 2.5
                ? 2.5
                : normalized <= 5
                ? 5
                : 10;

    return multiplier * magnitude;
}


function axisMoney(value: number) {
    if (value >= 1_000_000) {
        return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", {
            maximumFractionDigits: 1,
        })} mi`;
    }

    if (value >= 1_000) {
        return `R$ ${(value / 1_000).toLocaleString("pt-BR", {
            maximumFractionDigits: 1,
        })} mil`;
    }

    return `R$ ${value.toLocaleString("pt-BR", {
        maximumFractionDigits: 0,
    })}`;
}


export default function FinancialForecast({
    data,
    loading,
    error,
    months,
    onMonthsChange,
    onMonthOpen,
    onRetry,
}: Props) {
    const chartData = (data?.monthly ?? []).map((item) => ({
        ...item,
        label: monthLabel(item.period),
        expected: Number(item.expected),
        received: Number(item.received),
    }));
    const largestValue = Math.max(
        0,
        ...chartData.flatMap((item) => [item.expected, item.received]),
    );
    const axisStep = niceStep(largestValue);
    const axisMaximum = Math.max(axisStep * 4, Math.ceil(largestValue / axisStep) * axisStep);
    const axisTicks = Array.from(
        { length: Math.round(axisMaximum / axisStep) + 1 },
        (_, index) => index * axisStep,
    );

    return (
        <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.3)]">
            <div className="flex flex-col gap-4 border-b border-slate-200/80 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                        Projeção com dados reais
                    </p>
                    <h2 className="mt-1 text-lg font-black text-slate-950">
                        Previsão de receita
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Comparação por competência entre valores previstos e recebidos.
                    </p>
                </div>
                <div className="flex gap-2">
                    {([3, 6, 12] as const).map((period) => (
                        <button
                            key={period}
                            type="button"
                            onClick={() => onMonthsChange(period)}
                            className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                                months === period
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {period} meses
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-4 p-6" aria-label="Carregando previsão de receita">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />
                        ))}
                    </div>
                    <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
                </div>
            ) : error || !data ? (
                <div className="p-10 text-center">
                    <p className="text-sm font-semibold text-red-700">
                        Não foi possível calcular a previsão de receita.
                    </p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-3 text-sm font-bold text-red-600 underline"
                    >
                        Tentar novamente
                    </button>
                </div>
            ) : (
                <div className="p-5 sm:p-6">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            { label: "Previsto", value: data.totals.expected, color: "text-blue-700" },
                            { label: "Recebido", value: data.totals.received, color: "text-emerald-700" },
                            { label: "Pendente futuro", value: data.totals.pending, color: "text-amber-700" },
                            { label: "Vencido histórico", value: data.historical_overdue, color: "text-red-700" },
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{item.label}</p>
                                <p className={`mt-2 text-lg font-black ${item.color}`}>{money(item.value)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-100 pb-4">
                        <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Previsto
                        </span>
                        <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Recebido
                        </span>
                        <span className="ml-auto text-[11px] text-slate-400">
                            Escala ajustada ao maior valor do período
                        </span>
                    </div>

                    <div className="mt-4 h-64 w-full rounded-2xl bg-slate-50/50 px-2 pb-2 pt-4 sm:px-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                barGap={5}
                                barCategoryGap="42%"
                                margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="forecastExpected" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#2563eb" />
                                    </linearGradient>
                                    <linearGradient id="forecastReceived" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#34d399" />
                                        <stop offset="100%" stopColor="#10b981" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="2 5" vertical={false} stroke="#dbe3ee" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    width={84}
                                    domain={[0, axisMaximum]}
                                    ticks={axisTicks}
                                    allowDecimals={false}
                                    tick={{ fontSize: 10, fill: "#64748b" }}
                                    tickFormatter={(value) => axisMoney(Number(value))}
                                />
                                <Tooltip
                                    cursor={{ fill: "rgba(37, 99, 235, 0.04)" }}
                                    contentStyle={{
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "12px",
                                        boxShadow: "0 12px 30px -18px rgba(15, 23, 42, 0.45)",
                                    }}
                                    formatter={(value, name) => [money(Number(value)), name === "expected" ? "Previsto" : "Recebido"]}
                                />
                                <Bar dataKey="expected" name="expected" fill="url(#forecastExpected)" radius={[5, 5, 1, 1]} maxBarSize={24} />
                                <Bar dataKey="received" name="received" fill="url(#forecastReceived)" radius={[5, 5, 1, 1]} maxBarSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                        {data.monthly.map((item) => (
                            <button
                                key={item.period}
                                type="button"
                                onClick={() => onMonthOpen(item.period)}
                                className="min-w-[130px] rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50"
                            >
                                <span className="text-xs font-bold capitalize text-slate-700">{monthLabel(item.period)}</span>
                                <span className="mt-1 block text-[11px] text-slate-500">Ver cobranças</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
