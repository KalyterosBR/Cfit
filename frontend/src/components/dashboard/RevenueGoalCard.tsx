import { useEffect, useState } from "react";

import { Pencil, RefreshCw, Target } from "lucide-react";
import toast from "react-hot-toast";

import ConfirmDialog from "@/components/ConfirmDialog";
import {
    getMonthlyRevenueGoal,
    saveMonthlyRevenueGoal,
    type MonthlyRevenueGoal,
} from "@/features/students/services/financial.service";


type RevenueGoalCardProps = {
    period: string;
    periodLabel: string;
    revenue: string | null;
    revenueLoading: boolean;
    revenueError: boolean;
};


function formatMoney(value: number) {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}


function expectedProgress(period: string) {
    const [year, month] = period.split("-").map(Number);
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear()
        && month === today.getMonth() + 1;

    if (!isCurrentMonth) return 100;

    const daysInMonth = new Date(year, month, 0).getDate();
    return (today.getDate() / daysInMonth) * 100;
}


export default function RevenueGoalCard({
    period,
    periodLabel,
    revenue,
    revenueLoading,
    revenueError,
}: RevenueGoalCardProps) {
    const [goal, setGoal] = useState<MonthlyRevenueGoal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [targetAmount, setTargetAmount] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let current = true;

        getMonthlyRevenueGoal(period)
            .then((data) => {
                if (!current) return;
                setGoal(data);
                setError(false);
            })
            .catch((requestError) => {
                console.error(requestError);
                if (!current) return;
                setGoal(null);
                setError(true);
            })
            .finally(() => {
                if (current) setLoading(false);
            });

        return () => {
            current = false;
        };
    }, [period, reloadKey]);

    function openGoalEditor() {
        setTargetAmount(goal?.target_amount ?? "");
        setModalOpen(true);
    }

    async function saveGoal() {
        const normalizedAmount = targetAmount.replace(",", ".");
        if (Number(normalizedAmount) <= 0) return;

        try {
            setSaving(true);
            const savedGoal = await saveMonthlyRevenueGoal(
                period,
                normalizedAmount,
            );
            setGoal(savedGoal);
            setModalOpen(false);
            toast.success("Meta mensal salva com sucesso!");
        } catch (requestError) {
            console.error(requestError);
            toast.error("Não foi possível salvar a meta mensal.");
        } finally {
            setSaving(false);
        }
    }

    const goalAmount = Number(goal?.target_amount ?? 0);
    const receivedAmount = Number(revenue ?? 0);
    const percentage = goalAmount > 0
        ? (receivedAmount / goalAmount) * 100
        : 0;
    const remaining = Math.max(goalAmount - receivedAmount, 0);
    const status = percentage >= 100
        ? { label: "Meta atingida", className: "bg-emerald-50 text-emerald-700" }
        : percentage >= expectedProgress(period)
            ? { label: "No ritmo", className: "bg-blue-50 text-blue-700" }
            : { label: "Atenção", className: "bg-amber-50 text-amber-700" };

    return (
        <>
            <section className="flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Target size={21} />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">
                                Meta financeira
                            </p>
                            <h2 className="mt-1 text-lg font-black text-slate-950">
                                Receita de {periodLabel}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Acompanhamento proporcional aos dias transcorridos no mês atual.
                            </p>
                        </div>
                    </div>

                    {!loading && !error && goal?.target_amount && (
                        <button
                            type="button"
                            onClick={openGoalEditor}
                            className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                        >
                            <Pencil size={14} /> Editar
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="mt-6 h-24 animate-pulse rounded-xl bg-slate-100" />
                ) : error ? (
                    <button
                        type="button"
                        onClick={() => {
                            setLoading(true);
                            setReloadKey((current) => current + 1);
                        }}
                        className="mt-6 flex items-center gap-2 text-sm font-semibold text-red-700"
                    >
                        <RefreshCw size={16} /> Tentar novamente
                    </button>
                ) : !goal?.target_amount ? (
                    <div className="mt-auto pt-6">
                        <button
                            type="button"
                            onClick={openGoalEditor}
                            className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                            Definir meta de receita
                        </button>
                    </div>
                ) : (
                    <div className="mt-6">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold text-slate-500">Recebido / meta</p>
                                <p className="mt-1 text-xl font-black text-slate-950">
                                    {revenueLoading || revenueError
                                        ? "—"
                                        : `${formatMoney(receivedAmount)} de ${formatMoney(goalAmount)}`}
                                </p>
                            </div>
                            <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${status.className}`}>
                                {revenueLoading || revenueError ? "Aguardando receita" : status.label}
                            </span>
                        </div>
                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                        </div>
                        <div className="mt-3 flex justify-between gap-3 text-xs font-semibold text-slate-500">
                            <span>
                                {revenueLoading || revenueError
                                    ? "—"
                                    : `${percentage.toFixed(1)}% atingido`}
                            </span>
                            <span className="text-right">
                                {remaining > 0
                                    ? `Faltam ${formatMoney(remaining)}`
                                    : "Meta alcançada"}
                            </span>
                        </div>
                    </div>
                )}
            </section>

            <ConfirmDialog
                open={modalOpen}
                title="Meta mensal de receita"
                description={`Defina a meta de recebimentos para ${periodLabel}.`}
                loading={saving}
                confirmDisabled={Number(targetAmount.replace(",", ".")) <= 0}
                onCancel={() => {
                    if (!saving) setModalOpen(false);
                }}
                onConfirm={saveGoal}
            >
                <label className="mt-5 block">
                    <span className="text-sm font-semibold text-slate-800">Valor da meta</span>
                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={targetAmount}
                        onChange={(event) => setTargetAmount(event.target.value)}
                        disabled={saving}
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                    />
                </label>
            </ConfirmDialog>
        </>
    );
}
