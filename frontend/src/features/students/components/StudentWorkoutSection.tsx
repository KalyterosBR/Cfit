import { useCallback, useEffect, useState } from "react";
import {
  Dumbbell,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import {
  addWorkoutExercise,
  addWorkoutProgress,
  applyWorkoutTemplate,
  createWorkoutPlan,
  createWorkoutSession,
  deleteWorkoutExercise,
  getExercises,
  getWorkoutPlans,
  getWorkoutTemplates,
  updateWorkoutExercise,
  updateWorkoutPlan,
  type Exercise,
  type WorkoutExercise,
  type WorkoutPlan,
  type WorkoutTemplate,
} from "@/features/students/services/workout.service";

const today = () => new Date().toISOString().slice(0, 10);
const emptyPlan = {
  name: "",
  objective: "",
  start_date: today(),
  review_date: "",
  notes: "",
};
const emptyItem = {
  exercise: "",
  sets: 3,
  repetitions: "10",
  load: "",
  rest_seconds: 60,
  notes: "",
};

export default function StudentWorkoutSection({
  studentId,
}: {
  studentId: string;
}) {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [itemModal, setItemModal] = useState(false);
  const [sessionModal, setSessionModal] = useState(false);
  const [progressModal, setProgressModal] = useState(false);
  const [editing, setEditing] = useState<WorkoutPlan | null>(null);
  const [selected, setSelected] = useState<WorkoutPlan | null>(null);
  const [editingItem, setEditingItem] = useState<WorkoutExercise | null>(null);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [session, setSession] = useState({
    scheduled_for: today(),
    status: "completed" as "planned" | "completed" | "skipped",
    duration_minutes: 60,
    notes: "",
  });
  const [progress, setProgress] = useState({
    recorded_at: today(),
    adherence_percentage: 100,
    notes: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [p, e, t] = await Promise.all([
        getWorkoutPlans({ student: studentId }),
        getExercises(),
        getWorkoutTemplates(),
      ]);
      setPlans(p.results);
      setExercises(e.results);
      setTemplates(t.results);
      setSelected((current) =>
        current
          ? (p.results.find((item) => item.id === current.id) ?? null)
          : (p.results.find((item) => item.status === "active") ??
            p.results[0] ??
            null),
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [studentId]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function openPlan(plan?: WorkoutPlan) {
    setEditing(plan ?? null);
    setPlanForm(
      plan
        ? {
            name: plan.name,
            objective: plan.objective,
            start_date: plan.start_date,
            review_date: plan.review_date ?? "",
            notes: plan.notes,
          }
        : emptyPlan,
    );
    setPlanModal(true);
  }
  async function savePlan(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...planForm,
        review_date: planForm.review_date || null,
      };
      if (editing) await updateWorkoutPlan(editing.id, payload);
      else await createWorkoutPlan({ student: studentId, ...payload });
      setPlanModal(false);
      await load();
      toast.success(editing ? "Treino atualizado." : "Treino criado.");
    } catch {
      toast.error("Não foi possível salvar o treino.");
    } finally {
      setSaving(false);
    }
  }
  async function saveItem(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    try {
      setSaving(true);
      const values = { ...itemForm, load: itemForm.load || null };
      if (editingItem) await updateWorkoutExercise(editingItem.id, values);
      else
        await addWorkoutExercise({
          workout: selected.id,
          ...values,
          order: selected.exercises.length + 1,
        });
      setItemForm(emptyItem);
      setEditingItem(null);
      setItemModal(false);
      await load();
      toast.success(
        editingItem ? "Exercício atualizado." : "Exercício adicionado.",
      );
    } catch {
      toast.error("Não foi possível salvar o exercício.");
    } finally {
      setSaving(false);
    }
  }
  async function saveSession(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    try {
      setSaving(true);
      await createWorkoutSession({
        workout: selected.id,
        ...session,
        duration_minutes:
          session.status === "completed" ? session.duration_minutes : null,
      });
      setSessionModal(false);
      await load();
      toast.success("Sessão registrada.");
    } catch {
      toast.error("Já existe uma sessão nessa data ou os dados são inválidos.");
    } finally {
      setSaving(false);
    }
  }
  async function saveProgress(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    try {
      setSaving(true);
      await addWorkoutProgress({ workout: selected.id, ...progress });
      setProgressModal(false);
      await load();
      toast.success("Evolução registrada.");
    } catch {
      toast.error("Não foi possível registrar a evolução.");
    } finally {
      setSaving(false);
    }
  }
  const activePlan = plans.find((plan) => plan.status === "active");

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
              Treino do aluno
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-950">
              Prescrição, execução e evolução
            </h2>
          </div>
          {!activePlan && (
            <button
              onClick={() => openPlan()}
              className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
            >
              <Plus size={16} /> Criar treino
            </button>
          )}
        </div>
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-700">
            Não foi possível carregar.
            <button
              onClick={load}
              className="mx-auto mt-3 flex items-center gap-2 font-bold"
            >
              <RefreshCw size={15} /> Tentar novamente
            </button>
          </div>
        ) : plans.length === 0 ? (
          <div className="p-10 text-center">
            <Dumbbell className="mx-auto text-slate-300" />
            <p className="mt-3 font-bold">Nenhum treino prescrito</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[300px_1fr]">
            <aside className="border-r border-slate-100 p-4 print:hidden">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelected(plan)}
                  className={`mb-2 w-full rounded-xl p-4 text-left ${selected?.id === plan.id ? "bg-blue-50 ring-1 ring-blue-200" : "bg-slate-50"}`}
                >
                  <p className="font-bold">{plan.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {plan.status_label} · {plan.exercises.length} exercícios
                  </p>
                </button>
              ))}
            </aside>
            <div className="p-5">
              {selected ? (
                <>
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black">{selected.name}</h3>
                      <p className="text-sm text-slate-500">
                        {selected.objective} · {selected.instructor_name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Revisão:{" "}
                        {selected.review_date
                          ? new Date(
                              `${selected.review_date}T00:00:00`,
                            ).toLocaleDateString("pt-BR")
                          : "não definida"}{" "}
                        · Aderência:{" "}
                        {selected.adherence_percentage ?? "sem dados"}
                        {selected.adherence_percentage !== null ? "%" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 print:hidden">
                      <button
                        onClick={() => openPlan(selected)}
                        className="rounded-xl border p-2"
                        title="Editar"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="rounded-xl border p-2"
                        title="Imprimir"
                      >
                        <Printer size={17} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 print:hidden">
                    <button
                      onClick={() => setItemModal(true)}
                      className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                    >
                      Adicionar exercício
                    </button>
                    <button
                      onClick={() => setSessionModal(true)}
                      className="rounded-xl border px-3 py-2 text-xs font-bold"
                    >
                      Registrar sessão
                    </button>
                    <button
                      onClick={() => setProgressModal(true)}
                      className="rounded-xl border px-3 py-2 text-xs font-bold"
                    >
                      Registrar evolução
                    </button>
                    {templates.length > 0 && (
                      <select
                        defaultValue=""
                        onChange={async (e) => {
                          if (e.target.value) {
                            await applyWorkoutTemplate(
                              selected.id,
                              e.target.value,
                            );
                            await load();
                            toast.success("Modelo aplicado.");
                            e.target.value = "";
                          }
                        }}
                        className="rounded-xl border px-3 text-xs font-bold"
                      >
                        <option value="">Aplicar modelo...</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {selected.status === "active" && (
                      <button
                        onClick={async () => {
                          await updateWorkoutPlan(selected.id, {
                            status: "completed",
                          });
                          await load();
                        }}
                        className="rounded-xl border px-3 py-2 text-xs font-bold"
                      >
                        Concluir ciclo
                      </button>
                    )}
                  </div>
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs uppercase text-slate-400">
                          <th className="py-2">Exercício</th>
                          <th>Séries</th>
                          <th>Repetições</th>
                          <th>Carga</th>
                          <th>Descanso</th>
                          <th className="print:hidden"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.exercises.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100"
                          >
                            <td className="py-3 font-bold">
                              {item.exercise_name}
                              <span className="block text-xs font-normal text-slate-400">
                                {item.notes}
                              </span>
                            </td>
                            <td>{item.sets}</td>
                            <td>{item.repetitions}</td>
                            <td>{item.load ? `${item.load} kg` : "Livre"}</td>
                            <td>{item.rest_seconds}s</td>
                            <td className="print:hidden">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setItemForm({
                                      exercise: item.exercise,
                                      sets: item.sets,
                                      repetitions: item.repetitions,
                                      load: item.load ?? "",
                                      rest_seconds: item.rest_seconds,
                                      notes: item.notes,
                                    });
                                    setItemModal(true);
                                  }}
                                  className="text-blue-600"
                                  title="Editar exercício"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={async () => {
                                    await deleteWorkoutExercise(item.id);
                                    await load();
                                  }}
                                  className="text-red-500"
                                  title="Remover exercício"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selected.exercises.length === 0 && (
                      <p className="py-8 text-center text-sm text-slate-500">
                        Adicione exercícios ou aplique um modelo.
                      </p>
                    )}
                  </div>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-black">Sessões recentes</h4>
                      {selected.sessions.slice(0, 5).map((item) => (
                        <p
                          key={item.id}
                          className="mt-2 rounded-lg bg-slate-50 p-3 text-sm"
                        >
                          {new Date(
                            `${item.scheduled_for}T00:00:00`,
                          ).toLocaleDateString("pt-BR")}{" "}
                          · {item.status_label}
                          {item.duration_minutes
                            ? ` · ${item.duration_minutes} min`
                            : ""}
                        </p>
                      ))}
                    </div>
                    <div>
                      <h4 className="font-black">Evolução</h4>
                      {selected.progress.slice(0, 5).map((item) => (
                        <p
                          key={item.id}
                          className="mt-2 rounded-lg bg-slate-50 p-3 text-sm"
                        >
                          {item.recorded_at} · {item.adherence_percentage}% ·{" "}
                          {item.notes || "Sem observação"}
                        </p>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="py-10 text-center text-slate-500">
                  Selecione um treino.
                </p>
              )}
            </div>
          </div>
        )}
      </section>
      <Modal
        open={planModal}
        title={editing ? "Editar treino" : "Novo treino"}
        onClose={() => !saving && setPlanModal(false)}
      >
        <form onSubmit={savePlan} className="space-y-4">
          <label className="block text-sm font-semibold">
            Nome
            <input
              required
              value={planForm.name}
              onChange={(e) =>
                setPlanForm({ ...planForm, name: e.target.value })
              }
              className="mt-2 h-11 w-full rounded-xl border px-3"
            />
          </label>
          <label className="block text-sm font-semibold">
            Objetivo
            <input
              required
              value={planForm.objective}
              onChange={(e) =>
                setPlanForm({ ...planForm, objective: e.target.value })
              }
              className="mt-2 h-11 w-full rounded-xl border px-3"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              required
              value={planForm.start_date}
              onChange={(e) =>
                setPlanForm({ ...planForm, start_date: e.target.value })
              }
              className="h-11 rounded-xl border px-3"
            />
            <input
              type="date"
              min={planForm.start_date}
              value={planForm.review_date}
              onChange={(e) =>
                setPlanForm({ ...planForm, review_date: e.target.value })
              }
              className="h-11 rounded-xl border px-3"
            />
          </div>
          <textarea
            value={planForm.notes}
            onChange={(e) =>
              setPlanForm({ ...planForm, notes: e.target.value })
            }
            placeholder="Orientações"
            className="min-h-24 w-full rounded-xl border p-3"
          />
          <button
            disabled={saving}
            className="h-11 w-full rounded-xl bg-blue-600 font-bold text-white"
          >
            Salvar treino
          </button>
        </form>
      </Modal>
      <Modal
        open={itemModal}
        title={editingItem ? "Editar exercício" : "Adicionar exercício"}
        onClose={() => {
          setItemModal(false);
          setEditingItem(null);
          setItemForm(emptyItem);
        }}
      >
        <form onSubmit={saveItem} className="space-y-4">
          <select
            required
            disabled={Boolean(editingItem)}
            value={itemForm.exercise}
            onChange={(e) =>
              setItemForm({ ...itemForm, exercise: e.target.value })
            }
            className="h-11 w-full rounded-xl border px-3"
          >
            <option value="">Selecione...</option>
            {exercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} · {e.muscle_group}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="1"
              value={itemForm.sets}
              onChange={(e) =>
                setItemForm({ ...itemForm, sets: Number(e.target.value) })
              }
              className="h-11 rounded-xl border px-3"
              placeholder="Séries"
            />
            <input
              value={itemForm.repetitions}
              onChange={(e) =>
                setItemForm({ ...itemForm, repetitions: e.target.value })
              }
              className="h-11 rounded-xl border px-3"
              placeholder="Repetições"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={itemForm.load}
              onChange={(e) =>
                setItemForm({ ...itemForm, load: e.target.value })
              }
              className="h-11 rounded-xl border px-3"
              placeholder="Carga kg"
            />
            <input
              type="number"
              min="0"
              value={itemForm.rest_seconds}
              onChange={(e) =>
                setItemForm({
                  ...itemForm,
                  rest_seconds: Number(e.target.value),
                })
              }
              className="h-11 rounded-xl border px-3"
              placeholder="Descanso"
            />
          </div>
          <input
            value={itemForm.notes}
            onChange={(e) =>
              setItemForm({ ...itemForm, notes: e.target.value })
            }
            className="h-11 w-full rounded-xl border px-3"
            placeholder="Observações"
          />
          <button className="h-11 w-full rounded-xl bg-blue-600 font-bold text-white">
            {editingItem ? "Salvar alterações" : "Adicionar"}
          </button>
        </form>
      </Modal>
      <Modal
        open={sessionModal}
        title="Registrar sessão"
        onClose={() => setSessionModal(false)}
      >
        <form onSubmit={saveSession} className="space-y-4">
          <input
            type="date"
            required
            value={session.scheduled_for}
            onChange={(e) =>
              setSession({ ...session, scheduled_for: e.target.value })
            }
            className="h-11 w-full rounded-xl border px-3"
          />
          <select
            value={session.status}
            onChange={(e) =>
              setSession({
                ...session,
                status: e.target.value as typeof session.status,
              })
            }
            className="h-11 w-full rounded-xl border px-3"
          >
            <option value="planned">Planejada</option>
            <option value="completed">Realizada</option>
            <option value="skipped">Não realizada</option>
          </select>
          {session.status === "completed" && (
            <input
              type="number"
              min="1"
              value={session.duration_minutes}
              onChange={(e) =>
                setSession({
                  ...session,
                  duration_minutes: Number(e.target.value),
                })
              }
              className="h-11 w-full rounded-xl border px-3"
              placeholder="Duração em minutos"
            />
          )}
          <textarea
            value={session.notes}
            onChange={(e) => setSession({ ...session, notes: e.target.value })}
            className="min-h-20 w-full rounded-xl border p-3"
            placeholder="Observações"
          />
          <button className="h-11 w-full rounded-xl bg-blue-600 font-bold text-white">
            Registrar
          </button>
        </form>
      </Modal>
      <Modal
        open={progressModal}
        title="Registrar evolução"
        onClose={() => setProgressModal(false)}
      >
        <form onSubmit={saveProgress} className="space-y-4">
          <input
            type="date"
            required
            value={progress.recorded_at}
            onChange={(e) =>
              setProgress({ ...progress, recorded_at: e.target.value })
            }
            className="h-11 w-full rounded-xl border px-3"
          />
          <input
            type="number"
            min="0"
            max="100"
            value={progress.adherence_percentage}
            onChange={(e) =>
              setProgress({
                ...progress,
                adherence_percentage: Number(e.target.value),
              })
            }
            className="h-11 w-full rounded-xl border px-3"
            placeholder="Aderência %"
          />
          <textarea
            value={progress.notes}
            onChange={(e) =>
              setProgress({ ...progress, notes: e.target.value })
            }
            className="min-h-20 w-full rounded-xl border p-3"
            placeholder="Evolução de carga, técnica ou observações"
          />
          <button className="h-11 w-full rounded-xl bg-blue-600 font-bold text-white">
            Registrar evolução
          </button>
        </form>
      </Modal>
    </>
  );
}
