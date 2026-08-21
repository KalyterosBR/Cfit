import { useCallback, useEffect, useState } from "react";

import { Dumbbell, Plus, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import Modal from "@/components/Modal";
import {
    createWorkoutPlan,
    getWorkoutPlans,
    updateWorkoutPlan,
    type WorkoutPlan,
} from "@/features/students/services/workout.service";


function today() {
    return new Date().toISOString().slice(0, 10);
}


export default function StudentWorkoutSection({ studentId }: { studentId: string }) {
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", objective: "", start_date: today(), review_date: "", notes: "" });

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            setPlans((await getWorkoutPlans({ student: studentId })).results);
        } catch (requestError) {
            console.error(requestError);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        const timer = window.setTimeout(() => { void load(); }, 0);
        return () => window.clearTimeout(timer);
    }, [load]);

    async function save(event: React.FormEvent) {
        event.preventDefault();
        try {
            setSaving(true);
            await createWorkoutPlan({ student: studentId, ...form, review_date: form.review_date || null });
            setModalOpen(false);
            setForm({ name: "", objective: "", start_date: today(), review_date: "", notes: "" });
            toast.success("Treino criado com sucesso!");
            await load();
        } catch (requestError) {
            console.error(requestError);
            toast.error("Não foi possível criar o treino.");
        } finally {
            setSaving(false);
        }
    }

    const activePlan = plans.find((plan) => plan.status === "active");

    return <>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
                <div><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Treino do aluno</p><h2 className="mt-1 text-lg font-black text-slate-950">Treino atual e histórico</h2></div>
                {!activePlan && <button type="button" onClick={() => setModalOpen(true)} className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"><Plus size={16} /> Criar treino</button>}
            </div>
            {loading ? <div className="space-y-3 p-6">{[1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div>
                : error ? <div className="p-8 text-center text-red-700"><p>Não foi possível carregar os treinos.</p><button type="button" onClick={load} className="mt-3 inline-flex items-center gap-2 font-bold underline"><RefreshCw size={15} /> Tentar novamente</button></div>
                    : plans.length === 0 ? <div className="p-10 text-center"><Dumbbell className="mx-auto text-slate-300" /><p className="mt-3 font-bold text-slate-800">Nenhum treino prescrito</p><p className="mt-1 text-sm text-slate-500">Crie o primeiro treino para iniciar o acompanhamento.</p></div>
                        : <div className="divide-y divide-slate-100">{plans.map((plan) => <article key={plan.id} className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${plan.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{plan.status_label}</span><h3 className="mt-3 font-black text-slate-950">{plan.name}</h3><p className="mt-1 text-sm text-slate-500">{plan.objective} · Responsável: {plan.instructor_name}</p></div>{plan.status === "active" && <button type="button" onClick={async () => { await updateWorkoutPlan(plan.id, { status: "completed" }); await load(); }} className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600">Concluir treino</button>}</div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><span className="text-slate-400">Início</span><p className="font-semibold text-slate-700">{new Date(`${plan.start_date}T00:00:00`).toLocaleDateString("pt-BR")}</p></div><div><span className="text-slate-400">Próxima revisão</span><p className="font-semibold text-slate-700">{plan.review_date ? new Date(`${plan.review_date}T00:00:00`).toLocaleDateString("pt-BR") : "Não definida"}</p></div><div><span className="text-slate-400">Exercícios</span><p className="font-semibold text-slate-700">{plan.exercises.length}</p></div></div></article>)}</div>}
        </section>
        <Modal open={modalOpen} title="Novo treino" onClose={() => !saving && setModalOpen(false)}><form onSubmit={save} className="space-y-4"><label className="block text-sm font-semibold text-slate-700">Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 h-11 w-full rounded-xl border px-3" /></label><label className="block text-sm font-semibold text-slate-700">Objetivo<input required value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} className="mt-2 h-11 w-full rounded-xl border px-3" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Início<input type="date" required value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} className="mt-2 h-11 w-full rounded-xl border px-3" /></label><label className="text-sm font-semibold text-slate-700">Revisão<input type="date" min={form.start_date} value={form.review_date} onChange={(event) => setForm({ ...form, review_date: event.target.value })} className="mt-2 h-11 w-full rounded-xl border px-3" /></label></div><label className="block text-sm font-semibold text-slate-700">Observações<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-2 min-h-24 w-full rounded-xl border p-3" /></label><button disabled={saving} className="h-11 w-full rounded-xl bg-blue-600 font-bold text-white disabled:opacity-60">{saving ? "Salvando..." : "Criar treino"}</button></form></Modal>
    </>;
}
