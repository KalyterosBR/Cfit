import { useCallback, useEffect, useState } from "react";

import { Dumbbell, Library, Plus, Search, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import {
  createExercise,
  getExercises,
  getWorkoutPlans,
  type Exercise,
  type WorkoutPlan,
  getWorkoutTemplates,
  createWorkoutTemplate,
  addTemplateExercise,
  type WorkoutTemplate,
} from "@/features/students/services/workout.service";
import DashboardLayout from "@/layouts/DashboardLayout";
import { ErrorState, SkeletonState } from "@/components/AsyncState";

export default function Workouts() {
  const [tab, setTab] = useState<"plans" | "templates" | "exercises">("plans");
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [review, setReview] = useState<"" | "overdue" | "upcoming">("");
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState({ count: 0, next: false, previous: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    muscle_group: "",
    instructions: "",
  });
  const [templateForm, setTemplateForm] = useState({
    name: "",
    objective: "",
    description: "",
    exercise: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      if (tab === "plans") {
        const data = await getWorkoutPlans({ search, review: review || undefined, page });
        setPlans(data.results);
        setPageInfo({ count: data.count, next: Boolean(data.next), previous: Boolean(data.previous) });
      }
      else if (tab === "templates") {
        const [templateData, exerciseData] = await Promise.all([
          getWorkoutTemplates(search, page),
          getExercises(),
        ]);
        setTemplates(templateData.results);
        setPageInfo({ count: templateData.count, next: Boolean(templateData.next), previous: Boolean(templateData.previous) });
        setExercises(exerciseData.results);
      } else {
        const data = await getExercises(search, page);
        setExercises(data.results);
        setPageInfo({ count: data.count, next: Boolean(data.next), previous: Boolean(data.previous) });
      }
    } catch (requestError) {
      console.error(requestError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, review, search, tab]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 300);
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
    } finally {
      setSaving(false);
    }
  }

  async function saveTemplate(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      const template = await createWorkoutTemplate({
        name: templateForm.name,
        objective: templateForm.objective,
        description: templateForm.description,
      });
      if (templateForm.exercise)
        await addTemplateExercise({
          template: template.id,
          exercise: templateForm.exercise,
          sets: 3,
          repetitions: "10",
          load: null,
          rest_seconds: 60,
          order: 1,
          notes: "",
        });
      setModalOpen(false);
      setTemplateForm({
        name: "",
        objective: "",
        description: "",
        exercise: "",
      });
      await load();
      toast.success("Modelo reutilizável criado.");
    } catch {
      toast.error("Não foi possível criar o modelo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Treinos"
        subtitle="Prescrições, modelos, biblioteca, execução e evolução dos alunos."
        eyebrow="Performance do aluno"
        context="Prescrição, aderência e evolução"
        actions={
          tab !== "plans" ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
            >
              <Plus size={16} />{" "}
              {tab === "templates" ? "Novo modelo" : "Novo exercício"}
            </button>
          ) : undefined
        }
      />
      <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {(
          [
            ["plans", "Treinos dos alunos", Dumbbell],
            ["templates", "Modelos reutilizáveis", Copy],
            ["exercises", "Biblioteca de exercícios", Library],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => { setTab(value); setPage(1); setReview(""); }}
            className={`flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold ${tab === value ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 p-5 sm:grid-cols-[1fr_auto]">
          <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder={
              tab === "plans"
                ? "Aluno, objetivo ou professor..."
                : "Exercício ou grupo muscular..."
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4"
          /></div>
          {tab === "plans" && <select aria-label="Filtrar revisão" value={review} onChange={(event) => { setReview(event.target.value as typeof review); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold"><option value="">Todas as revisões</option><option value="overdue">Revisão vencida</option><option value="upcoming">Próximos 14 dias</option></select>}
        </div>
        {loading ? (
          <div className="p-5"><SkeletonState rows={3}/></div>
        ) : error ? (
          <div className="p-5"><ErrorState onRetry={load} label="Não foi possível carregar os treinos"/></div>
        ) : tab === "plans" ? (
          <div className="cfit-record-list">
            {plans.length === 0 ? (
              <p className="p-10 text-center text-slate-500">
                Nenhum treino encontrado.
              </p>
            ) : (
              plans.map((plan) => (
                <article
                  key={plan.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-5"
                >
                  <div>
                    <Link
                      to={`/students/${plan.student}`}
                      className="font-black text-slate-950 hover:text-blue-600"
                    >
                      {plan.student_name} · {plan.name}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">
                      {plan.objective} · {plan.instructor_name} ·{" "}
                      {plan.exercises.length} exercícios · aderência{" "}
                      {plan.adherence_percentage ?? "sem dados"}
                      {plan.adherence_percentage !== null ? "%" : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {plan.review_date && plan.status === "active" && plan.review_date < new Date().toISOString().slice(0, 10) ? "Revisão vencida" : plan.status_label}
                  </span>
                </article>
              ))
            )}
          </div>
        ) : tab === "templates" ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <article
                key={template.id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <p className="font-black">{template.name}</p>
                <p className="mt-1 text-sm text-blue-600">
                  {template.objective || "Objetivo flexível"}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  {template.description || "Sem descrição"}
                </p>
                <p className="mt-4 text-xs font-bold text-slate-400">
                  {template.exercises.length} exercícios configurados
                </p>
                <select
                  defaultValue=""
                  onChange={async (event) => {
                    if (!event.target.value) return;
                    try {
                      await addTemplateExercise({
                        template: template.id,
                        exercise: event.target.value,
                        sets: 3,
                        repetitions: "10",
                        load: null,
                        rest_seconds: 60,
                        order: template.exercises.length + 1,
                        notes: "",
                      });
                      await load();
                      toast.success("Exercício incluído no modelo.");
                    } catch {
                      toast.error("O exercício já está no modelo.");
                    }
                    event.target.value = "";
                  }}
                  className="mt-4 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold"
                >
                  <option value="">Adicionar exercício...</option>
                  {exercises.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </option>
                  ))}
                </select>
              </article>
            ))}
            {templates.length === 0 && (
              <p className="text-sm text-slate-500">
                Nenhum modelo encontrado.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {exercises.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum exercício encontrado.
              </p>
            ) : (
              exercises.map((exercise) => (
                <article
                  key={exercise.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <p className="font-black text-slate-950">{exercise.name}</p>
                  <p className="mt-1 text-xs font-bold uppercase text-blue-600">
                    {exercise.muscle_group || "Grupo não informado"}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    {exercise.instructions || "Sem instruções."}
                  </p>
                </article>
              ))
            )}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm"><span>{pageInfo.count} registro(s)</span><div className="flex gap-2"><button type="button" disabled={!pageInfo.previous} onClick={() => setPage((value) => Math.max(1, value - 1))} className="cfit-secondary-button">Anterior</button><button type="button" disabled={!pageInfo.next} onClick={() => setPage((value) => value + 1)} className="cfit-secondary-button">Próxima</button></div></div>
      </section>
      <Modal
        open={modalOpen}
        title={tab === "templates" ? "Novo modelo" : "Novo exercício"}
        onClose={() => !saving && setModalOpen(false)}
      >
        {tab === "templates" ? (
          <form onSubmit={saveTemplate} className="space-y-4">
            <input
              required
              value={templateForm.name}
              onChange={(e) =>
                setTemplateForm({ ...templateForm, name: e.target.value })
              }
              placeholder="Nome do modelo"
              className="h-11 w-full rounded-xl border px-3"
            />
            <input
              value={templateForm.objective}
              onChange={(e) =>
                setTemplateForm({ ...templateForm, objective: e.target.value })
              }
              placeholder="Objetivo"
              className="h-11 w-full rounded-xl border px-3"
            />
            <textarea
              value={templateForm.description}
              onChange={(e) =>
                setTemplateForm({
                  ...templateForm,
                  description: e.target.value,
                })
              }
              placeholder="Descrição"
              className="min-h-24 w-full rounded-xl border p-3"
            />
            <select
              value={templateForm.exercise}
              onChange={(e) =>
                setTemplateForm({ ...templateForm, exercise: e.target.value })
              }
              className="h-11 w-full rounded-xl border px-3"
            >
              <option value="">Exercício inicial opcional</option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
            <button
              disabled={saving}
              className="h-11 w-full rounded-xl bg-blue-600 font-bold text-white"
            >
              Salvar modelo
            </button>
          </form>
        ) : (
          <form onSubmit={saveExercise} className="space-y-4">
            <label className="block text-sm font-semibold">
              Nome
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                className="mt-2 h-11 w-full rounded-xl border px-3"
              />
            </label>
            <label className="block text-sm font-semibold">
              Grupo muscular
              <input
                value={form.muscle_group}
                onChange={(event) =>
                  setForm({ ...form, muscle_group: event.target.value })
                }
                className="mt-2 h-11 w-full rounded-xl border px-3"
              />
            </label>
            <label className="block text-sm font-semibold">
              Instruções
              <textarea
                value={form.instructions}
                onChange={(event) =>
                  setForm({ ...form, instructions: event.target.value })
                }
                className="mt-2 min-h-28 w-full rounded-xl border p-3"
              />
            </label>
            <button
              disabled={saving}
              className="h-11 w-full rounded-xl bg-blue-600 font-bold text-white"
            >
              Salvar exercício
            </button>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
}
