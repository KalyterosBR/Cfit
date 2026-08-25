import { useCallback, useEffect, useState } from "react";

import { ArrowDownRight, ArrowUpRight, Plus, Scale } from "lucide-react";
import toast from "react-hot-toast";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import Modal from "@/components/Modal";
import { currencyMask, currencyToDecimal } from "@/utils/masks";
import {
    createCashTransaction,
    getCashFlowSummary,
    type CashCategory,
    type CashFlowFilters,
    type CashFlowSummary,
    type CashTransactionStatus,
    type CashTransactionType,
} from "@/features/students/services/cash-flow.service";


const categories: Array<{ value: CashCategory; label: string }> = [
    { value: "membership", label: "Mensalidades" },
    { value: "services", label: "Serviços" },
    { value: "payroll", label: "Folha de pagamento" },
    { value: "rent", label: "Aluguel" },
    { value: "utilities", label: "Água, energia e internet" },
    { value: "taxes", label: "Impostos e taxas" },
    { value: "maintenance", label: "Manutenção" },
    { value: "marketing", label: "Marketing" },
    { value: "other", label: "Outros" },
];


function money(value: string | number) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}


function axisMoney(value: number) {
    if (Math.abs(value) >= 1000) {
        return `R$ ${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
    }

    return `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}


function periodLabel(value: string, granularity: "daily" | "monthly") {
    const [year, month, day] = value.split("-").map(Number);

    return new Intl.DateTimeFormat("pt-BR", granularity === "daily"
        ? { day: "2-digit", month: "short" }
        : { month: "short", year: "2-digit" }).format(
        new Date(year, month - 1, day),
    );
}


export default function CashFlowSection() {
    const today = new Date().toISOString().slice(0, 10);
    const [summary, setSummary] = useState<CashFlowSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [granularity, setGranularity] = useState<"daily" | "monthly">("monthly");
    const [months, setMonths] = useState<3 | 6 | 12>(6);
    const [filters, setFilters] = useState<CashFlowFilters>({
        transactionType: "all",
        status: "all",
        category: "all",
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [transactionType, setTransactionType] =
        useState<CashTransactionType>("expense");
    const [status, setStatus] = useState<CashTransactionStatus>("planned");
    const [category, setCategory] = useState<CashCategory>("other");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("0,00");
    const [competenceDate, setCompetenceDate] = useState(today);
    const [transactionDate, setTransactionDate] = useState(today);
    const [notes, setNotes] = useState("");

    const loadSummary = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            setSummary(await getCashFlowSummary(filters, granularity, months));
        } catch (requestError) {
            console.error(requestError);
            setSummary(null);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [filters, granularity, months]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    function openModal() {
        setTransactionType("expense");
        setStatus("planned");
        setCategory("other");
        setDescription("");
        setAmount("0,00");
        setCompetenceDate(today);
        setTransactionDate(today);
        setNotes("");
        setModalOpen(true);
    }

    async function saveTransaction(event: React.FormEvent) {
        event.preventDefault();

        const decimalAmount = currencyToDecimal(amount);

        if (!description.trim() || Number(decimalAmount) <= 0) {
            toast.error("Preencha descrição e valor válido.");
            return;
        }

        try {
            setSaving(true);
            await createCashTransaction({
                transaction_type: transactionType,
                status,
                category,
                description: description.trim(),
                amount: decimalAmount,
                competence_date: competenceDate,
                transaction_date: status === "realized" ? transactionDate : null,
                notes: notes.trim(),
            });
            setModalOpen(false);
            toast.success("Movimentação registrada com sucesso!");
            await loadSummary();
        } catch (requestError) {
            console.error(requestError);
            toast.error("Não foi possível registrar a movimentação.");
        } finally {
            setSaving(false);
        }
    }

    const chartData = (summary?.periods ?? []).map((item) => ({
        ...item,
        label: periodLabel(item.period, granularity),
        income: Number(item.projected_income),
        expense: Number(item.projected_expense),
        balance: Number(item.projected_balance),
    }));

    return (
        <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.3)]">
            <div className="flex flex-col gap-4 border-b border-slate-200/80 p-5 xl:flex-row xl:items-center xl:justify-between sm:p-6">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-600">Operação financeira</p>
                    <h2 className="mt-1 text-lg font-black text-slate-950">Fluxo de caixa</h2>
                    <p className="mt-1 text-sm text-slate-500">Entradas e saídas previstas e realizadas, sem saldo bancário inicial.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        value={filters.transactionType}
                        onChange={(event) => setFilters((current) => ({ ...current, transactionType: event.target.value as CashFlowFilters["transactionType"] }))}
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
                    >
                        <option value="all">Entradas e saídas</option>
                        <option value="income">Entradas</option>
                        <option value="expense">Saídas</option>
                    </select>
                    <select
                        value={filters.status}
                        onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as CashFlowFilters["status"] }))}
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
                    >
                        <option value="all">Previstas e realizadas</option>
                        <option value="planned">Previstas</option>
                        <option value="realized">Realizadas</option>
                    </select>
                    <select
                        value={filters.category}
                        onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value as CashFlowFilters["category"] }))}
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
                    >
                        <option value="all">Todas as categorias</option>
                        {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    <button type="button" onClick={openModal} className="flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white hover:bg-blue-700">
                        <Plus size={15} /> Nova movimentação
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3 sm:px-6">
                {(["monthly", "daily"] as const).map((item) => (
                    <button key={item} type="button" onClick={() => setGranularity(item)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${granularity === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {item === "monthly" ? "Mensal" : "Próximos 30 dias"}
                    </button>
                ))}
                {granularity === "monthly" && ([3, 6, 12] as const).map((period) => (
                    <button key={period} type="button" onClick={() => setMonths(period)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${months === period ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                        {period} meses
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4 p-6"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div><div className="h-64 animate-pulse rounded-xl bg-slate-100" /></div>
            ) : error || !summary ? (
                <div className="p-10 text-center"><p className="text-sm font-semibold text-red-700">Não foi possível calcular o fluxo de caixa.</p><button type="button" onClick={loadSummary} className="mt-3 text-sm font-bold text-red-600 underline">Tentar novamente</button></div>
            ) : (
                <div className="p-5 sm:p-6">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            { label: "Entradas previstas", value: summary.totals.projected_income, icon: ArrowUpRight, color: "text-blue-700" },
                            { label: "Entradas realizadas", value: summary.totals.realized_income, icon: ArrowUpRight, color: "text-emerald-700" },
                            { label: "Saídas previstas", value: summary.totals.projected_expense, icon: ArrowDownRight, color: "text-orange-700" },
                            { label: "Saldo projetado", value: summary.totals.projected_balance, icon: Scale, color: Number(summary.totals.projected_balance) >= 0 ? "text-cyan-700" : "text-red-700" },
                        ].map((item) => {
                            const Icon = item.icon;
                            return <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{item.label}</p><Icon size={16} className={item.color} /></div><p className={`mt-2 text-lg font-black ${item.color}`}>{money(item.value)}</p></div>;
                        })}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-5 border-b border-slate-100 pb-4">
                        {[
                            { label: "Entradas previstas", color: "bg-blue-500" },
                            { label: "Saídas previstas", color: "bg-orange-500" },
                            { label: "Saldo projetado", color: "bg-cyan-600" },
                        ].map((item) => (
                            <span key={item.label} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                <span className={`h-0.5 w-5 rounded-full ${item.color}`} />
                                {item.label}
                            </span>
                        ))}
                    </div>

                    <div className="mt-4 h-72 rounded-2xl bg-slate-50/50 p-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="2 5" stroke="var(--cfit-border-default)" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--cfit-text-secondary)" }} />
                                <YAxis axisLine={false} tickLine={false} width={84} tick={{ fontSize: 10, fill: "var(--cfit-text-secondary)" }} tickFormatter={(value) => axisMoney(Number(value))} />
                                <Tooltip
                                    cursor={{ stroke: "var(--cfit-border-strong)", strokeDasharray: "3 3" }}
                                    contentStyle={{ background: "var(--cfit-surface-elevated)", color: "var(--cfit-text-primary)", border: "1px solid var(--cfit-border-default)", borderRadius: "12px", boxShadow: "var(--cfit-shadow-elevated)" }}
                                    formatter={(value, name) => [money(Number(value)), name === "income" ? "Entradas previstas" : name === "expense" ? "Saídas previstas" : "Saldo projetado"]}
                                />
                                <Line dataKey="income" name="income" type="monotone" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 2.5, fill: "#3b82f6", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                <Line dataKey="expense" name="expense" type="monotone" stroke="#f97316" strokeWidth={2.5} dot={{ r: 2.5, fill: "#f97316", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                <Line dataKey="balance" name="balance" type="monotone" stroke="#0891b2" strokeWidth={2.5} dot={{ r: 2.5, fill: "#0891b2", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <Modal open={modalOpen} title="Nova movimentação de caixa" onClose={() => !saving && setModalOpen(false)} maxWidth="lg">
                <form onSubmit={saveTransaction} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-700">Tipo *<select value={transactionType} onChange={(event) => setTransactionType(event.target.value as CashTransactionType)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"><option value="income">Entrada</option><option value="expense">Saída</option></select></label>
                        <label className="text-sm font-semibold text-slate-700">Situação *<select value={status} onChange={(event) => setStatus(event.target.value as CashTransactionStatus)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"><option value="planned">Prevista</option><option value="realized">Realizada</option></select></label>
                        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Descrição *<input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={255} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3" /></label>
                        <label className="text-sm font-semibold text-slate-700">Categoria *<select value={category} onChange={(event) => setCategory(event.target.value as CashCategory)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3">{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                        <label className="text-sm font-semibold text-slate-700">
                            Valor *
                            <div className="relative mt-2">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={amount}
                                    onChange={(event) => setAmount(currencyMask(event.target.value))}
                                    onFocus={(event) => event.currentTarget.select()}
                                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-right font-semibold tabular-nums"
                                />
                            </div>
                        </label>
                        <label className="text-sm font-semibold text-slate-700">Competência *<input type="date" value={competenceDate} onChange={(event) => setCompetenceDate(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3" /></label>
                        {status === "realized" && <label className="text-sm font-semibold text-slate-700">Data efetiva *<input type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3" /></label>}
                        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Observações<textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} rows={3} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2" /></label>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">Cancelar</button><button type="submit" disabled={saving} className="h-10 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar movimentação"}</button></div>
                </form>
            </Modal>
        </section>
    );
}
