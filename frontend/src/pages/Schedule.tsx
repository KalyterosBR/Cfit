import { useCallback, useEffect, useState } from "react";
import { Clock, Plus } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";
import PageHeader from "@/components/PageHeader";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Api } from "@/services/http";
import { EmptyState, ErrorState, SkeletonState } from "@/components/AsyncState";

type EventType = "class" | "assessment" | "task" | "contact" | "visit";
type ScheduleEvent = {
  id: string;
  title: string;
  event_type: EventType;
  event_type_label: string;
  status_label: string;
  starts_at: string;
  ends_at: string;
  student_name: string | null;
  professional_name: string;
  location: string;
  confirmed_at: string | null;
};
type Page = { results: ScheduleEvent[] };

function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export default function Schedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [from, setFrom] = useState(localDate);
  const [to, setTo] = useState(() => localDate(7));
  const [eventType, setEventType] = useState<"all" | EventType>("all");
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    event_type: "class" as EventType,
    starts_at: "",
    ends_at: "",
    location: "",
    notes: "",
    recurrence: "none",
    recurrence_count: 1,
    reminder_at: "",
  });
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await Api.get<Page>("/schedule/events/", {
        params: {
          from,
          to,
          event_type: eventType === "all" ? undefined : eventType,
        },
      });
      setEvents(response.data.results);
    } catch (error) {
      console.error(error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [eventType, from, to]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      await Api.post("/schedule/events/", { ...form, reminder_at: form.reminder_at || null });
      setModalOpen(false);
      setForm({
        title: "",
        event_type: "class",
        starts_at: "",
        ends_at: "",
        location: "",
        notes: "",
        recurrence: "none",
        recurrence_count: 1,
        reminder_at: "",
      });
      toast.success(form.recurrence === "none" ? "Evento agendado!" : "Série recorrente criada!");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível agendar. Verifique conflitos de profissional ou sala.");
    } finally {
      setSaving(false);
    }
  }
  function changeView(next: "day" | "week" | "month") {
    setView(next);
    const days = next === "day" ? 0 : next === "week" ? 7 : 30;
    setFrom(localDate());
    setTo(localDate(days));
  }
  async function confirmEvent(id: string) {
    await Api.post(`/schedule/events/${id}/confirm/`);
    toast.success("Evento confirmado.");
    await load();
  }
  return (
    <DashboardLayout>
      <PageHeader
        title="Agenda"
        subtitle="Aulas, avaliações, tarefas, contatos e visitas em um único lugar."
        eyebrow="Ritmo da operação"
        context="Tempo, capacidade e compromisso"
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
          >
            <Plus size={16} /> Novo evento
          </button>
        }
      />
      <div className="mb-4 flex gap-2">
        {(["day", "week", "month"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => changeView(item)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${view === item ? "bg-blue-600 text-white" : "border bg-white"}`}
          >
            {item === "day" ? "Dia" : item === "week" ? "Semana" : "Mês"}
          </button>
        ))}
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b p-5 sm:grid-cols-3">
          <label className="text-xs font-bold text-slate-600">
            De
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border px-3"
            />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Até
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border px-3"
            />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Tipo
            <select
              value={eventType}
              onChange={(e) =>
                setEventType(e.target.value as "all" | EventType)
              }
              className="mt-2 h-11 w-full rounded-xl border px-3"
            >
              <option value="all">Todos</option>
              <option value="class">Aulas</option>
              <option value="assessment">Avaliações</option>
              <option value="task">Tarefas</option>
              <option value="contact">Contatos</option>
              <option value="visit">Visitas</option>
            </select>
          </label>
        </div>
        {loading ? (
          <div className="p-5"><SkeletonState rows={3}/></div>
        ) : error ? (
          <div className="p-5"><ErrorState onRetry={load} label="Não foi possível carregar a agenda"/></div>
        ) : events.length === 0 ? (
          <div className="p-5"><EmptyState label="Nenhum evento no período" detail="Crie um evento ou amplie as datas da consulta."/></div>
        ) : (
          <div className="divide-y">
            {events.map((item) => (
              <article
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-blue-600">
                    {item.event_type_label}
                  </span>
                  <p className="mt-1 font-black">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.location || "Local não informado"} ·{" "}
                    {item.professional_name}
                  </p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p className="flex items-center gap-2">
                    <Clock size={15} />
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(item.starts_at))}
                  </p>
                  <p className="mt-1 text-xs font-bold text-emerald-700">
                    {item.confirmed_at ? "Confirmado" : item.status_label}
                  </p>
                  {!item.confirmed_at && (
                    <button
                      type="button"
                      onClick={() => confirmEvent(item.id)}
                      className="mt-1 text-xs font-bold text-blue-600"
                    >
                      Confirmar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <Modal
        open={modalOpen}
        title="Novo evento"
        onClose={() => !saving && setModalOpen(false)}
      >
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-semibold">
            Título
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-2 h-11 w-full rounded-xl border px-3"
            />
          </label>
          <label className="block text-sm font-semibold">
            Tipo
            <select
              value={form.event_type}
              onChange={(e) =>
                setForm({ ...form, event_type: e.target.value as EventType })
              }
              className="mt-2 h-11 w-full rounded-xl border px-3"
            >
              <option value="class">Aula</option>
              <option value="assessment">Avaliação</option>
              <option value="task">Tarefa</option>
              <option value="contact">Contato</option>
              <option value="visit">Visita</option>
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Início
              <input
                required
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) =>
                  setForm({ ...form, starts_at: e.target.value })
                }
                className="mt-2 h-11 w-full rounded-xl border px-3"
              />
            </label>
            <label className="text-sm font-semibold">
              Fim
              <input
                required
                type="datetime-local"
                min={form.starts_at}
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                className="mt-2 h-11 w-full rounded-xl border px-3"
              />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Sala ou local
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-2 h-11 w-full rounded-xl border px-3"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">Recorrência<select value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value, recurrence_count: e.target.value === "none" ? 1 : form.recurrence_count })} className="mt-2 h-11 w-full rounded-xl border px-3"><option value="none">Não repetir</option><option value="daily">Diariamente</option><option value="weekly">Semanalmente</option></select></label>
            <label className="text-sm font-semibold">Ocorrências<input type="number" min={1} max={52} disabled={form.recurrence === "none"} value={form.recurrence_count} onChange={(e) => setForm({ ...form, recurrence_count: Number(e.target.value) })} className="mt-2 h-11 w-full rounded-xl border px-3"/></label>
          </div>
          <label className="block text-sm font-semibold">Lembrete<input type="datetime-local" value={form.reminder_at} onChange={(e) => setForm({ ...form, reminder_at: e.target.value })} className="mt-2 h-11 w-full rounded-xl border px-3"/></label>
          <button
            disabled={saving}
            className="h-11 w-full rounded-xl bg-blue-600 font-bold text-white"
          >
            {saving ? "Salvando..." : "Agendar evento"}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
