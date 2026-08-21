import { UserMinus, UserPlus, UserRoundCheck, UsersRound } from "lucide-react";

import type { DashboardStudentSummary } from "@/features/students/services/student.service";


type ActiveBaseTrendProps = {
    data: DashboardStudentSummary | null;
    loading: boolean;
    error: boolean;
    periodLabel: string;
};


export default function ActiveBaseTrend({ data, loading, error, periodLabel }: ActiveBaseTrendProps) {
    const items = data ? [
        { label: "Novos alunos", value: data.created_count, icon: UserPlus, color: "text-blue-700" },
        { label: "Reativações", value: data.reactivated_count, icon: UserRoundCheck, color: "text-emerald-700" },
        { label: "Inativações", value: data.deactivated_count, icon: UserMinus, color: "text-red-700" },
        { label: "Saldo da base", value: data.change, icon: UsersRound, color: data.change >= 0 ? "text-emerald-700" : "text-red-700" },
    ] : [];

    return (
        <section className="mt-6 rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.3)] sm:p-6">
            <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-600">Movimento da base</p>
                <h2 className="mt-2 text-lg font-black text-slate-950">O que mudou em {periodLabel}?</h2>
                <p className="mt-1 text-sm text-slate-500">Entradas e mudanças de status que explicam o saldo mensal de alunos ativos.</p>
            </div>
            {loading ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>
            ) : error || !data ? (
                <p className="mt-5 text-sm font-semibold text-red-700">Não foi possível calcular o movimento da base.</p>
            ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {items.map((item) => { const Icon = item.icon; return <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500"><Icon size={14} /> {item.label}</p><p className={`mt-2 text-xl font-black ${item.color}`}>{item.value > 0 && item.label === "Saldo da base" ? "+" : ""}{item.value.toLocaleString("pt-BR")}</p></div>; })}
                </div>
            )}
            {data?.data_quality === "partial" && <p className="mt-4 text-xs font-semibold text-amber-700">O histórico anterior à implantação da auditoria é parcial; use esta leitura com cautela.</p>}
        </section>
    );
}
