import { useCallback, useEffect, useState } from "react";

import { AlertCircle, RefreshCw, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
    getRecurringAttempts,
    getRecurringAttemptSummary,
    type RecurringAttempt,
    type RecurringAttemptStatus,
    type RecurringAttemptSummary,
} from "@/features/students/services/recurring-attempt.service";


const emptySummary: RecurringAttemptSummary = {
    total_count: 0,
    pending_count: 0,
    processing_count: 0,
    approved_count: 0,
    rejected_count: 0,
    retry_due_count: 0,
    unresolved_charge_count: 0,
};


function dateTime(value: string | null) {
    if (!value) return "—";

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(value));
}


function money(value: string) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}


function statusTone(status: RecurringAttemptStatus) {
    return {
        pending: "warning",
        processing: "info",
        approved: "success",
        rejected: "danger",
    }[status];
}


export default function RecurringFailuresSection() {
    const navigate = useNavigate();
    const [attempts, setAttempts] = useState<RecurringAttempt[]>([]);
    const [summary, setSummary] = useState(emptySummary);
    const [status, setStatus] = useState<"all" | RecurringAttemptStatus>("all");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(search), 350);
        return () => window.clearTimeout(timer);
    }, [search]);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            const [attemptData, summaryData] = await Promise.all([
                getRecurringAttempts(status, debouncedSearch),
                getRecurringAttemptSummary(status, debouncedSearch),
            ]);
            setAttempts(attemptData.results);
            setSummary(summaryData);
        } catch (requestError) {
            console.error(requestError);
            setAttempts([]);
            setSummary(emptySummary);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, status]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <section
            id="recurring-failures"
            className="mt-6 scroll-mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.3)]"
        >
            <div className="flex flex-col gap-4 border-b border-slate-200/80 p-5 lg:flex-row lg:items-center lg:justify-between sm:p-6">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">Recorrências</p>
                    <h2 className="mt-1 text-lg font-black text-slate-950">Tentativas e falhas de cobrança</h2>
                    <p className="mt-1 text-sm text-slate-500">Eventos operacionais reais recebidos pela API, sem dados simulados.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Aluno, plano, cobrança ou falha..." className="h-10 min-w-[260px] rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm" />
                    <select value={status} onChange={(event) => setStatus(event.target.value as "all" | RecurringAttemptStatus)} className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700">
                        <option value="all">Todas as situações</option><option value="pending">Pendentes</option><option value="processing">Processando</option><option value="approved">Aprovadas</option><option value="rejected">Rejeitadas</option>
                    </select>
                    <button type="button" onClick={load} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600"><RefreshCw size={14} /> Atualizar</button>
                </div>
            </div>

            <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-2 xl:grid-cols-4 sm:p-6">
                {[
                    { label: "Tentativas", value: summary.total_count },
                    { label: "Rejeitadas", value: summary.rejected_count },
                    { label: "Cobranças não resolvidas", value: summary.unresolved_charge_count },
                    { label: "Nova tentativa vencida", value: summary.retry_due_count },
                ].map((item) => <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{item.label}</p><p className="mt-2 text-xl font-black text-slate-900">{loading ? "—" : item.value}</p></div>)}
            </div>

            {loading ? (
                <div className="space-y-3 p-6">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
            ) : error ? (
                <div className="p-10 text-center"><AlertCircle className="mx-auto text-red-400" /><p className="mt-3 text-sm font-semibold text-red-700">Não foi possível carregar as recorrências.</p><button type="button" onClick={load} className="mt-3 text-sm font-bold text-red-600 underline">Tentar novamente</button></div>
            ) : attempts.length === 0 ? (
                <div className="p-10 text-center"><RotateCcw className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-800">Nenhuma tentativa real registrada</p><p className="mx-auto mt-1 max-w-xl text-sm text-slate-500">Quando uma integração ou automação enviar tentativas de recorrência, elas aparecerão aqui com resultado, falha e próxima ação.</p></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="cfit-data-table w-full min-w-[1100px]">
                        <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-6 py-4">Aluno</th><th className="px-6 py-4">Cobrança</th><th className="px-6 py-4">Tentativa</th><th className="px-6 py-4">Situação</th><th className="px-6 py-4">Falha</th><th className="px-6 py-4">Próxima tentativa</th><th className="px-6 py-4">Origem</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">{attempts.map((attempt) => <tr key={attempt.id} className="text-sm text-slate-700"><td className="px-6 py-4"><button type="button" onClick={() => navigate(`/students/${attempt.student}`)} className="font-bold text-slate-900 hover:text-blue-600">{attempt.student_name}</button><p className="mt-1 text-xs text-slate-500">{attempt.plan_name}</p></td><td className="px-6 py-4"><p className="font-semibold text-slate-800">{attempt.charge_description}</p><p className="mt-1 text-xs text-slate-500">{money(attempt.charge_amount)}</p></td><td className="px-6 py-4">#{attempt.attempt_number}<p className="mt-1 text-xs text-slate-500">{dateTime(attempt.occurred_at)}</p></td><td className="px-6 py-4"><span className="cfit-chip" data-tone={statusTone(attempt.status)}><span aria-hidden="true" className="cfit-chip-dot" />{attempt.status_label}</span></td><td className="max-w-[260px] px-6 py-4"><p className="font-semibold text-red-700">{attempt.failure_code || "—"}</p><p className="mt-1 text-xs text-slate-500">{attempt.failure_reason || "Sem falha informada"}</p></td><td className="px-6 py-4">{dateTime(attempt.next_retry_at)}</td><td className="px-6 py-4">{attempt.source_label}<p className="mt-1 text-xs text-slate-500">{attempt.provider || attempt.recorded_by || "—"}</p></td></tr>)}</tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
