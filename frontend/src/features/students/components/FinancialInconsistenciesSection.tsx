import { useCallback, useEffect, useState } from "react";

import {
    AlertCircle,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    RefreshCw,
    Search,
    ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Api } from "@/services/http";

import {
    getFinancialInconsistencies,
    type FinancialInconsistency,
    type FinancialInconsistencyPriority,
} from "@/features/students/services/financial.service";


type PriorityFilter = "all" | FinancialInconsistencyPriority;


const emptySummary = {
    total_count: 0,
    critical_count: 0,
    high_count: 0,
    checked_at: "",
};


function dateTime(value: string | null) {
    if (!value) return "—";

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(value));
}


function priorityDetails(priority: FinancialInconsistencyPriority) {
    return {
        critical: { label: "Crítica", className: "bg-red-50 text-red-700 ring-red-600/10" },
        high: { label: "Alta", className: "bg-orange-50 text-orange-700 ring-orange-600/10" },
        medium: { label: "Média", className: "bg-amber-50 text-amber-700 ring-amber-600/10" },
        low: { label: "Baixa", className: "bg-slate-100 text-slate-700 ring-slate-600/10" },
    }[priority];
}


export default function FinancialInconsistenciesSection() {
    const navigate = useNavigate();
    const [issues, setIssues] = useState<FinancialInconsistency[]>([]);
    const [summary, setSummary] = useState(emptySummary);
    const [priority, setPriority] = useState<PriorityFilter>("all");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [next, setNext] = useState<string | null>(null);
    const [previous, setPrevious] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    async function updateWorkflow(issue: FinancialInconsistency, status: "in_progress" | "resolved") {
        const comment = window.prompt(status === "resolved" ? "Descreva a resolução:" : "Adicione um comentário para assumir a tratativa:");
        if (!comment) return;
        await Api.post("/financial/charges/inconsistency-workflow/", { issue_key: issue.id, entity_type: issue.entity_type, entity_id: issue.entity_id, status, resolution: status === "resolved" ? comment : "", comment });
        await load();
    }

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 350);
        return () => window.clearTimeout(timer);
    }, [search]);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            const data = await getFinancialInconsistencies(
                priority,
                debouncedSearch,
                page,
            );
            setIssues(data.results);
            setSummary(data.summary);
            setNext(data.next);
            setPrevious(data.previous);
        } catch (requestError) {
            console.error(requestError);
            setIssues([]);
            setSummary(emptySummary);
            setNext(null);
            setPrevious(null);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, page, priority]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <section
            id="financial-inconsistencies"
            className="mt-6 scroll-mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.3)]"
        >
            <div className="flex flex-col gap-4 border-b border-slate-200/80 p-5 lg:flex-row lg:items-center lg:justify-between sm:p-6">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600">
                        Monitoramento operacional
                    </p>
                    <h2 className="mt-1 text-lg font-black text-slate-950">
                        Central de inconsistências
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Problemas calculados a partir dos dados financeiros reais, com causa e próxima ação.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Aluno, cobrança ou problema..."
                            className="h-10 min-w-[260px] rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>
                    <select
                        value={priority}
                        onChange={(event) => {
                            setPriority(event.target.value as PriorityFilter);
                            setPage(1);
                        }}
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                    >
                        <option value="all">Todas as prioridades</option>
                        <option value="critical">Críticas</option>
                        <option value="high">Altas</option>
                        <option value="medium">Médias</option>
                        <option value="low">Baixas</option>
                    </select>
                    <button
                        type="button"
                        onClick={load}
                        disabled={loading}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        Atualizar
                    </button>
                </div>
            </div>

            <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-3 sm:p-6">
                {[
                    { label: "Inconsistências", value: summary.total_count, color: "text-slate-950" },
                    { label: "Críticas", value: summary.critical_count, color: "text-red-700" },
                    { label: "Prioridade alta", value: summary.high_count, color: "text-orange-700" },
                ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{item.label}</p>
                        <p className={`mt-2 text-xl font-black ${item.color}`}>{loading ? "—" : item.value}</p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="space-y-3 p-6">
                    {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-slate-100" />)}
                </div>
            ) : error ? (
                <div className="p-10 text-center">
                    <AlertCircle className="mx-auto text-red-400" />
                    <p className="mt-3 text-sm font-semibold text-red-700">Não foi possível verificar as inconsistências.</p>
                    <button type="button" onClick={load} className="mt-3 text-sm font-bold text-red-600 underline">Tentar novamente</button>
                </div>
            ) : issues.length === 0 ? (
                <div className="p-10 text-center">
                    <ShieldCheck className="mx-auto text-emerald-400" />
                    <p className="mt-3 font-semibold text-slate-800">
                        {search || priority !== "all" ? "Nenhum problema encontrado com estes filtros" : "Nenhuma inconsistência identificada"}
                    </p>
                    <p className="mx-auto mt-1 max-w-xl text-sm text-slate-500">
                        {search || priority !== "all"
                            ? "Ajuste a busca ou a prioridade para consultar outras ocorrências."
                            : "Os dados financeiros verificados estão coerentes com as regras atuais."}
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {issues.map((issue) => {
                        const priorityInfo = priorityDetails(issue.priority);

                        return (
                            <article key={issue.id} className="grid gap-5 p-5 lg:grid-cols-[minmax(220px,0.8fr)_minmax(320px,1.4fr)_auto] lg:items-start sm:p-6">
                                <div>
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${priorityInfo.className}`}>
                                        {priorityInfo.label}
                                    </span>
                                    <h3 className="mt-3 font-black text-slate-950">{issue.title}</h3>
                                    <p className="mt-1 text-sm font-semibold text-slate-700">{issue.student_name || "Operação financeira"}</p>
                                    <p className="mt-1 text-xs text-slate-500">{issue.context || "Sem contexto adicional"}</p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
                                        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-red-700"><AlertTriangle size={13} /> Causa</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-700">{issue.cause}</p>
                                    </div>
                                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-blue-700">Próxima ação</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-700">{issue.next_action}</p>
                                    </div>
                                </div>

                                <div className="min-w-[170px] text-xs text-slate-500 lg:text-right">
                                    <p>Atualizado em {dateTime(issue.source_updated_at)}</p>
                                    <p className="mt-1">Responsável: {issue.responsible || "Não informado"}</p>
                                    <p className="mt-1 font-bold text-slate-600">Tratativa: {issue.workflow.status === "resolved" ? "Resolvida" : issue.workflow.status === "in_progress" ? "Em andamento" : "Aberta"}</p>
                                    {issue.workflow.due_at && <p className="mt-1">Prazo: {dateTime(issue.workflow.due_at)}</p>}
                                    {issue.workflow.resolution && <p className="mt-1 text-emerald-700">{issue.workflow.resolution}</p>}
                                    <div className="mt-3 flex justify-end gap-2">{issue.workflow.status === "open" && <button type="button" onClick={() => updateWorkflow(issue, "in_progress")} className="font-bold text-blue-600">Assumir</button>}{issue.workflow.status !== "resolved" && <button type="button" onClick={() => updateWorkflow(issue, "resolved")} className="font-bold text-emerald-700">Resolver</button>}</div>
                                    {issue.student && (
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/students/${issue.student}`)}
                                            className="mt-4 inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700"
                                        >
                                            Abrir aluno <ExternalLink size={13} />
                                        </button>
                                    )}
                                    {issue.entity_type === "charge" && (
                                        <button type="button" onClick={() => navigate(`/finance?charge=${issue.entity_id}#charges`)} className="mt-3 inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700">Abrir cobrança <ExternalLink size={13}/></button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {!loading && !error && (previous || next) && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-6">
                    <p className="text-xs text-slate-500">Página {page} · verificação em {dateTime(summary.checked_at)}</p>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setPage((current) => current - 1)} disabled={!previous} aria-label="Página anterior" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"><ChevronLeft size={16} /></button>
                        <button type="button" onClick={() => setPage((current) => current + 1)} disabled={!next} aria-label="Próxima página" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"><ChevronRight size={16} /></button>
                    </div>
                </div>
            )}
        </section>
    );
}
