import { useEffect, useState } from "react";

import { Pencil, RefreshCw, UsersRound } from "lucide-react";
import toast from "react-hot-toast";

import ConfirmDialog from "@/components/ConfirmDialog";
import {
    getMonthlyActiveStudentGoal,
    saveMonthlyActiveStudentGoal,
    type MonthlyActiveStudentGoal,
} from "@/features/students/services/student.service";


type ActiveStudentGoalCardProps = {
    period: string;
    periodLabel: string;
    activeCount: number | null;
    loading: boolean;
    error: boolean;
    dataQuality: "complete" | "partial" | null;
};


export default function ActiveStudentGoalCard({
    period,
    periodLabel,
    activeCount,
    loading: countLoading,
    error: countError,
    dataQuality,
}: ActiveStudentGoalCardProps) {
    const [goal, setGoal] = useState<MonthlyActiveStudentGoal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [targetCount, setTargetCount] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let current = true;

        getMonthlyActiveStudentGoal(period)
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

    function openEditor() {
        setTargetCount(goal?.target_count?.toString() ?? "");
        setModalOpen(true);
    }

    async function saveGoal() {
        const target = Number(targetCount);
        if (!Number.isInteger(target) || target <= 0) return;

        try {
            setSaving(true);
            setGoal(await saveMonthlyActiveStudentGoal(period, target));
            setModalOpen(false);
            toast.success("Meta de alunos ativos salva com sucesso!");
        } catch (requestError) {
            console.error(requestError);
            toast.error("Não foi possível salvar a meta de alunos ativos.");
        } finally {
            setSaving(false);
        }
    }

    const target = goal?.target_count ?? 0;
    const current = activeCount ?? 0;
    const percentage = target > 0 ? current / target * 100 : 0;
    const remaining = Math.max(target - current, 0);
    const status = percentage >= 100
        ? { label: "Meta atingida", className: "bg-emerald-50 text-emerald-700" }
        : percentage >= 90
            ? { label: "Próxima da meta", className: "bg-blue-50 text-blue-700" }
            : { label: "Atenção", className: "bg-amber-50 text-amber-700" };

    return (
        <>
            <section className="flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.3)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><UsersRound size={21} /></div>
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-700">Meta de base</p>
                            <h2 className="mt-1 text-lg font-black text-slate-950">Alunos ativos em {periodLabel}</h2>
                            <p className="mt-1 text-sm text-slate-500">Fotografia da base no fechamento do período.</p>
                        </div>
                    </div>
                    {!loading && !error && goal?.target_count && (
                        <button type="button" onClick={openEditor} className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:border-blue-300 hover:text-blue-700"><Pencil size={14} /> Editar</button>
                    )}
                </div>

                {loading ? (
                    <div className="mt-6 h-24 animate-pulse rounded-xl bg-slate-100" />
                ) : error ? (
                    <button type="button" onClick={() => { setLoading(true); setReloadKey((value) => value + 1); }} className="mt-6 flex items-center gap-2 text-sm font-semibold text-red-700"><RefreshCw size={16} /> Tentar novamente</button>
                ) : !goal?.target_count ? (
                    <div className="mt-auto pt-6"><button type="button" onClick={openEditor} className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">Definir meta de alunos</button></div>
                ) : (
                    <div className="mt-6">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div><p className="text-xs font-semibold text-slate-500">Realizado / meta</p><p className="mt-1 text-xl font-black text-slate-950">{countLoading || countError ? "—" : `${current.toLocaleString("pt-BR")} de ${target.toLocaleString("pt-BR")}`}</p></div>
                            <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${status.className}`}>{countLoading || countError ? "Aguardando base" : status.label}</span>
                        </div>
                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-400" style={{ width: `${Math.min(percentage, 100)}%` }} /></div>
                        <div className="mt-3 flex justify-between text-xs font-semibold text-slate-500"><span>{percentage.toFixed(1)}% atingido</span><span>{remaining > 0 ? `Faltam ${remaining.toLocaleString("pt-BR")}` : "Meta alcançada"}</span></div>
                        {dataQuality === "partial" && <p className="mt-3 text-xs font-semibold text-amber-700">O histórico deste período é parcial.</p>}
                    </div>
                )}
            </section>

            <ConfirmDialog open={modalOpen} title="Meta mensal de alunos ativos" description={`Defina a base ativa esperada para ${periodLabel}.`} loading={saving} confirmDisabled={!Number.isInteger(Number(targetCount)) || Number(targetCount) <= 0} onCancel={() => { if (!saving) setModalOpen(false); }} onConfirm={saveGoal}>
                <label className="mt-5 block"><span className="text-sm font-semibold text-slate-800">Quantidade de alunos ativos</span><input type="number" min="1" step="1" value={targetCount} onChange={(event) => setTargetCount(event.target.value)} disabled={saving} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10" /></label>
            </ConfirmDialog>
        </>
    );
}
