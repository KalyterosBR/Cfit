import { ArrowDownRight, ArrowRight, ArrowUpRight, ReceiptText, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";

import type { DashboardFinancialSummary } from "@/features/students/services/financial.service";


type RevenueTrendInsightProps = {
    data: DashboardFinancialSummary | null;
    loading: boolean;
    error: boolean;
    periodLabel: string;
    detailsLink: string;
};


function formatMoney(value: string) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}


const driverMessages: Record<DashboardFinancialSummary["growth_driver"], string> = {
    payment_volume: "A quantidade de pagamentos foi o principal fator da variação.",
    average_ticket: "O ticket médio recebido foi o principal fator da variação.",
    combined: "Volume de pagamentos e ticket médio contribuíram de forma relevante.",
    stable: "A receita permaneceu estável em relação ao período equivalente.",
    no_comparison: "Ainda não há receita anterior suficiente para identificar uma causa.",
};


export default function RevenueTrendInsight({
    data,
    loading,
    error,
    periodLabel,
    detailsLink,
}: RevenueTrendInsightProps) {
    const difference = Number(data?.revenue_difference ?? 0);
    const DirectionIcon = difference > 0
        ? ArrowUpRight
        : difference < 0
            ? ArrowDownRight
            : ArrowRight;
    const directionClass = difference > 0
        ? "text-emerald-700"
        : difference < 0
            ? "text-red-700"
            : "text-slate-700";

    return (
        <section className="mt-6 rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.3)] sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-xl">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-violet-600">
                        Leitura da receita
                    </p>
                    <h2 className="mt-2 text-lg font-black text-slate-950">
                        O que explica a variação em {periodLabel}?
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                        {loading
                            ? "Calculando os fatores observáveis..."
                            : error || !data
                                ? "Não foi possível calcular a tendência neste momento."
                                : driverMessages[data.growth_driver]}
                    </p>
                </div>

                {loading ? (
                    <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-3xl">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />
                        ))}
                    </div>
                ) : error || !data ? null : (
                    <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-3xl">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                <DirectionIcon size={14} /> Diferença
                            </p>
                            <p className={`mt-2 text-lg font-black ${directionClass}`}>
                                {difference > 0 ? "+" : ""}{formatMoney(data.revenue_difference)}
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                <ReceiptText size={14} /> Pagamentos
                            </p>
                            <p className="mt-2 text-lg font-black text-slate-900">
                                {data.current_payment_count.toLocaleString("pt-BR")}
                                <span className="ml-2 text-xs font-semibold text-slate-500">
                                    antes {data.previous_payment_count.toLocaleString("pt-BR")}
                                </span>
                            </p>
                        </div>
                        <Link
                            to={detailsLink}
                            className="group rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-blue-200 hover:bg-white"
                        >
                            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                <WalletCards size={14} /> Ticket médio
                            </p>
                            <p className="mt-2 text-lg font-black text-slate-900 group-hover:text-blue-700">
                                {formatMoney(data.current_average_ticket)}
                                <span className="ml-2 text-xs font-semibold text-slate-500">
                                    antes {formatMoney(data.previous_average_ticket)}
                                </span>
                            </p>
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
