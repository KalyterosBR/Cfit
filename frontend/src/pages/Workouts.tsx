import { useCallback, useEffect, useState } from "react";

import { Dumbbell, Library, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";

import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import {
    createExercise,
    getExercises,
    getWorkoutPlans,
    type Exercise,
    type WorkoutPlan,
} from "@/features/students/services/workout.service";
import DashboardLayout from "@/layouts/DashboardLayout";


export default function Workouts() {
    const [tab, setTab] = useState<"plans" | "exercises">("plans");
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", muscle_group: "", instructions: "" });

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            if (tab === "plans") setPlans((await getWorkoutPlans({ search })).results);
            else setExercises((await getExercises(search)).results);
        } catch (requestError) {
            console.error(requestError);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [search, tab]);

    useEffect(() => {
        const timer = window.setTimeout(() => { void load(); }, 300);
        return () => window.clearTimeout(timer);
    }, [load]);

    async function saveExercise(event: React.FormEvent) {
        event.preventDefault();
        try {
            setSaving(true);
            await createExercise(form);
            setModalOpen(false);
            setForm({ name: "", muscle_group: "", instructions: "" });
            toast.success("Exercício cadastrado!");
            await load();
        } catch (requestError) {
            console.error(requestError);
            toast.error("Não foi possível cadastrar o exercício.");
        } finally { setSaving(false); }
    }

    return <DashboardLayout>
        <PageHeader title="Treinos" subtitle="Prescrições, biblioteca de exercícios e evolução dos alunos." actions={tab === "exercises" ? <button type="button" onClick={() => setModalOpen(true)} className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"><Plus size={16} /> Novo exercício</button> : undefined} />
        <div className="mb-5 flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">{([ ["plans", "Treinos dos alunos", Dumbbell], ["exercises", "Biblioteca de exercícios", Library] ] as const).map(([value, label, Icon]) => <button key={value} type="button" onClick={() => setTab(value)} className={`flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold ${tab === value ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}><Icon size={16} />{label}</button>)}</div>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative border-b border-slate-200 p-5"><Search size={17} className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tab === "plans" ? "Aluno, objetivo ou professor..." : "Exercício ou grupo muscular..."} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4" /></div>
            {loading ? <div className="space-y-3 p-6">{[1,2,3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div> : error ? <div className="p-10 text-center text-red-700">Não foi possível carregar os dados.</div> : tab === "plans" ? <div className="divide-y divide-slate-100">{plans.length === 0 ? <p className="p-10 text-center text-slate-500">Nenhum treino encontrado.</p> : plans.map((plan) => <article key={plan.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-black text-slate-950">{plan.student_name} · {plan.name}</p><p className="mt-1 text-sm text-slate-500">{plan.objective} · {plan.instructor_name}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{plan.status_label}</span></article>)}</div> : <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">{exercises.length === 0 ? <p className="text-sm text-slate-500">Nenhum exercício encontrado.</p> : exercises.map((exercise) => <article key={exercise.id} className="rounded-2xl border border-slate-200 p-5"><p className="font-black text-slate-950">{exercise.name}</p><p className="mt-1 text-xs font-bold uppercase text-blue-600">{exercise.muscle_group || "Grupo não informado"}</p><p className="mt-3 text-sm text-slate-500">{exercise.instructions || "Sem instruções."}</p></article>)}</div>}
        </section>
        <Modal open={modalOpen} title="Novo exercício" onClose={() => !saving && setModalOpen(false)}><form onSubmit={saveExercise} className="space-y-4"><label className="block text-sm font-semibold">Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 h-11 w-full rounded-xl border px-3" /></label><label className="block text-sm font-semibold">Grupo muscular<input value={form.muscle_group} onChange={(event) => setForm({ ...form, muscle_group: event.target.value })} className="mt-2 h-11 w-full rounded-xl border px-3" /></label><label className="block text-sm font-semibold">Instruções<textarea value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} className="mt-2 min-h-28 w-full rounded-xl border p-3" /></label><button disabled={saving} className="h-11 w-full rounded-xl bg-blue-600 font-bold text-white">Salvar exercício</button></form></Modal>
    </DashboardLayout>;
}
