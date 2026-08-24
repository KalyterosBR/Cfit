import { useEffect, useState } from "react";

import { Footprints, Pencil, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import ConfirmDialog from "@/components/ConfirmDialog";
import {
    getMonthlyCheckInGoal,
    saveMonthlyCheckInGoal,
    type MonthlyCheckInGoal,
} from "@/features/students/services/checkin.service";


type CheckInGoalCardProps = {
    period: string;
    periodLabel: string;
    checkInCount: number | null;
    checkInsLoading: boolean;
    checkInsError: boolean;
};


function expectedProgress(period: string) {
    const [year, month] = period.split("-").map(Number);
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear()
        && month === today.getMonth() + 1;

    if (!isCurrentMonth) return 100;

    return (today.getDate() / new Date(year, month, 0).getDate()) * 100;
}


export default function CheckInGoalCard({
    period,
    periodLabel,
    checkInCount,
    checkInsLoading,
    checkInsError,
}: CheckInGoalCardProps) {
    const [goal, setGoal] = useState<MonthlyCheckInGoal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [targetCount, setTargetCount] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let current = true;

        getMonthlyCheckInGoal(period)
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
        setTargetCount(goal?.target_count?.toString() ?? "");
        setModalOpen(true);
    }

    async function saveGoal() {
        const normalizedTarget = Number(targetCount);
        if (!Number.isInteger(normalizedTarget) || normalizedTarget <= 0) return;

        try {
            setSaving(true);
            setGoal(await saveMonthlyCheckInGoal(period, normalizedTarget));
            setModalOpen(false);
            toast.success("Meta de check-ins salva com sucesso!");
        } catch (requestError) {
            console.error(requestError);
            toast.error("Não foi possível salvar a meta de check-ins.");
        } finally {
            setSaving(false);
        }
    }

    const goalCount = goal?.target_count ?? 0;
    const currentCount = checkInCount ?? 0;
    const percentage = goalCount > 0 ? (currentCount / goalCount) * 100 : 0;
    const remaining = Math.max(goalCount - currentCount, 0);
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
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                            <Footprints size={21} />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-700">Meta operacional</p>
                            <h2 className="mt-1 text-lg font-black text-slate-950">Check-ins de {periodLabel}</h2>
                            <p className="mt-1 text-sm text-slate-500">Acessos acumulados no período selecionado.</p>
                        </div>
                    </div>

                    {!loading && !error && goal?.target_count && (
                        <button type="button" onClick={openGoalEditor} className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:border-blue-300 hover:text-blue-700">
                            <Pencil size={14} /> Editar
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="mt-6 h-24 animate-pulse rounded-xl bg-slate-100" />
                ) : error ? (
                    <button type="button" onClick={() => { setLoading(true); setReloadKey((current) => current + 1); }} className="mt-6 flex items-center gap-2 text-sm font-semibold text-red-700">
                        <RefreshCw size={16} /> Tentar novamente
                    </button>
                ) : !goal?.target_count ? (
                    <div className="mt-auto pt-6">
                        <button type="button" onClick={openGoalEditor} className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
                            Definir meta de check-ins
                        </button>
                    </div>
                ) : (
                    <div className="mt-6">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold text-slate-500">Realizado / meta</p>
                                <p className="mt-1 text-xl font-black text-slate-950">
                                    {checkInsLoading || checkInsError
                                        ? "—"
                                        : `${currentCount.toLocaleString("pt-BR")} de ${goalCount.toLocaleString("pt-BR")}`}
                                </p>
                            </div>
                            <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${status.className}`}>
                                {checkInsLoading || checkInsError ? "Aguardando check-ins" : status.label}
                            </span>
                        </div>
                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${Math.min(percentage, 100)}%` }} />
                        </div>
                        <div className="mt-3 flex justify-between text-xs font-semibold text-slate-500">
                            <span>{checkInsLoading || checkInsError ? "—" : `${percentage.toFixed(1)}% atingido`}</span>
                            <span>{remaining > 0 ? `Faltam ${remaining.toLocaleString("pt-BR")}` : "Meta alcançada"}</span>
                        </div>
                    </div>
                )}
            </section>

            <ConfirmDialog
                open={modalOpen}
                title="Meta mensal de check-ins"
                description={`Defina a quantidade de acessos esperada para ${periodLabel}.`}
                loading={saving}
                confirmDisabled={!Number.isInteger(Number(targetCount)) || Number(targetCount) <= 0}
                onCancel={() => { if (!saving) setModalOpen(false); }}
                onConfirm={saveGoal}
            >
                <label className="mt-5 block">
                    <span className="text-sm font-semibold text-slate-800">Quantidade de check-ins</span>
                    <input type="number" min="1" step="1" value={targetCount} onChange={(event) => setTargetCount(event.target.value)} disabled={saving} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10" />
                </label>
            </ConfirmDialog>
        </>
    );
}
