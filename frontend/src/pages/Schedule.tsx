import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  Users,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { EmptyState, ErrorState, SkeletonState } from "@/components/AsyncState";
import Modal from "@/components/Modal";
import { useAppDialog } from "@/components/AppDialog";
import PageHeader from "@/components/PageHeader";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Api } from "@/services/http";
import { useSession } from "@/features/auth/access-control";
import { hasCapability } from "@/features/auth/access-policy";

type EventType = "class" | "assessment" | "task" | "contact" | "visit";
type ViewMode = "day" | "week" | "month";
type ScheduleEvent = {
  id: string;
  title: string;
  event_type: EventType;
  event_type_label: string;
  status: string;
  status_label: string;
  starts_at: string;
  ends_at: string;
  student_name: string | null;
  professional: string;
  professional_name: string;
  location: string;
  notes: string;
  confirmed_at: string | null;
  group_class_id: string | null;
  group_class_modality: string | null;
  capacity: number | null;
  confirmed_count: number | null;
  waitlist_count: number | null;
  available_spots: number | null;
};
type Page<T> = { results: T[] };
type Options = {
  professionals: Array<{ id: string; name: string }>;
  locations: string[];
};
const emptyForm = {
  title: "",
  event_type: "class" as EventType,
  starts_at: "",
  ends_at: "",
  professional: "",
  location: "",
  notes: "",
  recurrence: "none",
  recurrence_count: 1,
  reminder_at: "",
};
const field =
  "mt-2 h-11 w-full rounded-xl border border-[var(--cfit-border-default)] bg-[var(--cfit-surface-elevated)] px-3 text-[var(--cfit-text-primary)]";
const typeColors: Record<EventType, string> = {
  class: "bg-blue-600",
  assessment: "bg-violet-600",
  task: "bg-amber-600",
  contact: "bg-cyan-600",
  visit: "bg-emerald-600",
};
function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
function startOfWeek(date: Date) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function rangeFor(view: ViewMode, anchor: Date) {
  if (view === "day") return { from: isoDate(anchor), to: isoDate(anchor) };
  if (view === "week") {
    const from = startOfWeek(anchor);
    const to = new Date(from);
    to.setDate(to.getDate() + 6);
    return { from: isoDate(from), to: isoDate(to) };
  }
  const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return { from: isoDate(from), to: isoDate(to) };
}
function localInput(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function Schedule() {
  const dialog = useAppDialog();
  const session = useSession();
  const canManage = hasCapability(session.capabilities, "schedule.manage");
  const [events, setEvents] = useState<ScheduleEvent[]>([]),
    [view, setView] = useState<ViewMode>("week"),
    [anchor, setAnchor] = useState(() => new Date()),
    [eventType, setEventType] = useState<"all" | EventType>("all"),
    [professional, setProfessional] = useState(""),
    [location, setLocation] = useState(""),
    [groupClass, setGroupClass] = useState("");
  const [options, setOptions] = useState<Options>({
      professionals: [],
      locations: [],
    }),
    [classes, setClasses] = useState<Array<{ id: string; title: string }>>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [modalOpen, setModalOpen] = useState(false),
    [selected, setSelected] = useState<ScheduleEvent | null>(null),
    [editing, setEditing] = useState(false),
    [saving, setSaving] = useState(false),
    [form, setForm] = useState(emptyForm);
  const period = useMemo(() => rangeFor(view, anchor), [view, anchor]);
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [a, b, c] = await Promise.all([
        Api.get<Page<ScheduleEvent>>("/schedule/events/", {
          params: {
            ...period,
            event_type: eventType === "all" ? undefined : eventType,
            professional: professional || undefined,
            location: location || undefined,
            group_class: groupClass || undefined,
          },
        }),
        Api.get<Options>("/schedule/events/options/"),
        Api.get<Page<{ id: string; title: string }>>("/operations/classes/", {
          params: period,
        }),
      ]);
      setEvents(a.data.results);
      setOptions(b.data);
      setClasses(c.data.results);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [eventType, groupClass, location, period, professional]);
  useEffect(() => {
    void load();
  }, [load]);
  function move(direction: number) {
    const next = new Date(anchor);
    if (view === "day") next.setDate(next.getDate() + direction);
    else if (view === "week") next.setDate(next.getDate() + direction * 7);
    else next.setMonth(next.getMonth() + direction);
    setAnchor(next);
  }
  function openCreate() {
    setSelected(null);
    setEditing(true);
    setForm(emptyForm);
    setModalOpen(true);
  }
  function openDetail(item: ScheduleEvent) {
    setSelected(item);
    setEditing(false);
    setForm({
      title: item.title,
      event_type: item.event_type,
      starts_at: localInput(item.starts_at),
      ends_at: localInput(item.ends_at),
      professional: item.professional,
      location: item.location,
      notes: item.notes || "",
      recurrence: "none",
      recurrence_count: 1,
      reminder_at: "",
    });
    setModalOpen(true);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        professional: form.professional || undefined,
        reminder_at: form.reminder_at || null,
      };
      if (selected)
        await Api.patch(`/schedule/events/${selected.id}/`, payload);
      else await Api.post("/schedule/events/", payload);
      toast.success(
        selected
          ? "Evento atualizado."
          : form.recurrence === "none"
            ? "Evento agendado."
            : "Série criada.",
      );
      setModalOpen(false);
      await load();
    } catch {
      toast.error(
        "Não foi possível salvar. Revise horários, profissional e sala.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function confirmEvent() {
    if (!selected) return;
    await Api.post(`/schedule/events/${selected.id}/confirm/`);
    toast.success("Evento confirmado.");
    setModalOpen(false);
    await load();
  }
  async function cancelEvent() {
    if (!selected) return;
    const reason = await dialog.prompt({ title: "Cancelar evento", description: `O evento “${selected.title}” será cancelado e permanecerá no histórico.`, label: "Motivo do cancelamento", tone: "danger", confirmLabel: "Cancelar evento" });
    if (!reason) return;
    await Api.post(`/schedule/events/${selected.id}/cancel/`, { reason });
    toast.success("Evento cancelado.");
    setModalOpen(false);
    await load();
  }
  const days = useMemo(() => {
    const start = new Date(`${period.from}T12:00:00`),
      end = new Date(`${period.to}T12:00:00`),
      result: Date[] = [];
    for (
      const cursor = new Date(start);
      cursor <= end;
      cursor.setDate(cursor.getDate() + 1)
    )
      result.push(new Date(cursor));
    return result;
  }, [period]);
  const byDay = useMemo(
    () =>
      new Map(
        days.map((day) => [
          isoDate(day),
          events.filter(
            (item) => isoDate(new Date(item.starts_at)) === isoDate(day),
          ),
        ]),
      ),
    [days, events],
  );
  const hours = useMemo(
    () => Array.from({ length: 17 }, (_, index) => index + 6),
    [],
  );
  const periodLabel =
    view === "month"
      ? anchor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      : `${new Date(`${period.from}T12:00:00`).toLocaleDateString("pt-BR")} – ${new Date(`${period.to}T12:00:00`).toLocaleDateString("pt-BR")}`;
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <PageHeader
          title="Agenda"
          subtitle="Aulas, avaliações, tarefas, contatos e visitas em uma grade operacional."
          eyebrow="Ritmo da operação"
          context="Tempo, capacidade e compromisso"
          actions={canManage ?
            <button
              type="button"
              onClick={openCreate}
              className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
            >
              <Plus size={16} />
              Novo evento
            </button>
          : undefined}
        />
        <section className="rounded-2xl border border-[var(--cfit-border-default)] bg-[var(--cfit-surface-primary)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cfit-border-default)] p-4">
            <div className="flex items-center gap-2">
              <button
                aria-label="Período anterior"
                title="Período anterior"
                onClick={() => move(-1)}
                className="cfit-icon-button"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setAnchor(new Date())}
                className="h-10 rounded-xl border border-[var(--cfit-border-default)] px-3 text-sm font-bold"
              >
                Hoje
              </button>
              <button
                aria-label="Próximo período"
                title="Próximo período"
                onClick={() => move(1)}
                className="cfit-icon-button"
              >
                <ChevronRight size={18} />
              </button>
              <strong className="ml-2 capitalize">{periodLabel}</strong>
            </div>
            <div className="flex rounded-xl border border-[var(--cfit-border-default)] p-1">
              {(["day", "week", "month"] as ViewMode[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setView(item)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold ${view === item ? "bg-blue-600 text-white" : "text-[var(--cfit-text-secondary)]"}`}
                >
                  {item === "day" ? "Dia" : item === "week" ? "Semana" : "Mês"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 border-b border-[var(--cfit-border-default)] p-4 sm:grid-cols-2 xl:grid-cols-5">
            <select
              aria-label="Filtrar por tipo"
              value={eventType}
              onChange={(e) =>
                setEventType(e.target.value as "all" | EventType)
              }
              className="cfit-filter-control"
            >
              <option value="all">Todos os tipos</option>
              <option value="class">Aulas</option>
              <option value="assessment">Avaliações</option>
              <option value="task">Tarefas</option>
              <option value="contact">Contatos</option>
              <option value="visit">Visitas</option>
            </select>
            <select
              aria-label="Filtrar por profissional"
              value={professional}
              onChange={(e) => setProfessional(e.target.value)}
              className="cfit-filter-control"
            >
              <option value="">Todos os profissionais</option>
              {options.professionals.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por turma"
              value={groupClass}
              onChange={(e) => setGroupClass(e.target.value)}
              className="cfit-filter-control"
            >
              <option value="">Todas as turmas</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por sala"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="cfit-filter-control"
            >
              <option value="">Todas as salas</option>
              {options.locations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <div className="flex items-center rounded-xl bg-[var(--cfit-surface-subtle)] px-3 text-xs text-[var(--cfit-text-secondary)]">
              <CalendarDays size={15} className="mr-2" />
              {events.length} evento(s)
            </div>
          </div>
          {loading ? (
            <div className="p-5">
              <SkeletonState rows={view === "month" ? 6 : 4} />
            </div>
          ) : error ? (
            <div className="p-5">
              <ErrorState
                onRetry={load}
                label="Não foi possível carregar a agenda"
              />
            </div>
          ) : events.length === 0 ? (
            <div className="p-8">
              <EmptyState
                label="Nenhum evento neste período"
                detail="Ajuste os filtros ou crie o primeiro compromisso."
              />
            </div>
          ) : view === "month" ? (
            <div className="grid min-w-0 grid-cols-2 sm:grid-cols-4 xl:grid-cols-7">
              {days.map((day) => (
                <div
                  key={isoDate(day)}
                  className="min-h-36 border-b border-r border-[var(--cfit-table-divider)] p-2"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-[var(--cfit-text-tertiary)]">
                      {day.toLocaleDateString("pt-BR", { weekday: "short" })}
                    </span>
                    <span
                      className={`grid size-7 place-items-center rounded-full text-sm font-black ${isoDate(day) === isoDate(new Date()) ? "bg-blue-600 text-white" : ""}`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(byDay.get(isoDate(day)) || []).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => openDetail(item)}
                        className="w-full rounded-lg border border-[var(--cfit-border-default)] bg-[var(--cfit-surface-elevated)] p-2 text-left hover:border-blue-400"
                      >
                        <span
                          className={`mb-1 block h-1 rounded-full ${typeColors[item.event_type]}`}
                        />
                        <strong className="block truncate text-xs">
                          {item.title}
                        </strong>
                        <span className="mt-1 block text-[11px] text-[var(--cfit-text-secondary)]">
                          {new Date(item.starts_at).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div
                className="min-w-[760px]"
                style={{
                  display: "grid",
                  gridTemplateColumns: `64px repeat(${days.length}, minmax(96px, 1fr))`,
                }}
              >
                <div className="border-b border-r border-[var(--cfit-table-divider)]" />
                {days.map((day) => (
                  <div
                    key={isoDate(day)}
                    className="border-b border-r border-[var(--cfit-table-divider)] p-2 text-center text-xs font-bold"
                  >
                    <span className="uppercase text-[var(--cfit-text-tertiary)]">
                      {day.toLocaleDateString("pt-BR", { weekday: "short" })}
                    </span>
                    <span className="ml-2">{day.getDate()}</span>
                  </div>
                ))}
                {hours.flatMap((hour) => [
                  <div
                    key={`hour-${hour}`}
                    className="border-b border-r border-[var(--cfit-table-divider)] p-2 text-right text-xs text-[var(--cfit-text-tertiary)]"
                  >
                    {String(hour).padStart(2, "0")}:00
                  </div>,
                  ...days.map((day) => (
                    <div
                      key={`${isoDate(day)}-${hour}`}
                      className="min-h-16 border-b border-r border-[var(--cfit-table-divider)] p-1"
                    >
                      {(byDay.get(isoDate(day)) || [])
                        .filter(
                          (item) =>
                            new Date(item.starts_at).getHours() === hour,
                        )
                        .map((item) => (
                          <button
                            key={item.id}
                            onClick={() => openDetail(item)}
                            className="w-full rounded-lg border border-[var(--cfit-border-default)] bg-[var(--cfit-surface-elevated)] p-1.5 text-left hover:border-blue-400"
                          >
                            <span
                              className={`mb-1 block h-1 rounded-full ${typeColors[item.event_type]}`}
                            />
                            <strong className="block truncate text-[11px]">
                              {item.title}
                            </strong>
                            <span className="block text-[10px] text-[var(--cfit-text-secondary)]">
                              {new Date(item.starts_at).toLocaleTimeString(
                                "pt-BR",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </button>
                        ))}
                    </div>
                  )),
                ])}
              </div>
            </div>
          )}
        </section>
        <Modal
          open={modalOpen}
          title={selected ? selected.title : "Novo evento"}
          onClose={() => !saving && setModalOpen(false)}
        >
          {selected && !editing ? (
            <div className="space-y-5">
              <div className="rounded-2xl bg-[var(--cfit-surface-subtle)] p-4">
                <p className="text-xs font-bold uppercase text-blue-600">
                  {selected.event_type_label} · {selected.status_label}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm">
                  <Clock size={16} />
                  {new Date(selected.starts_at).toLocaleString("pt-BR")} –{" "}
                  {new Date(selected.ends_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="mt-2 text-sm">
                  {selected.professional_name} ·{" "}
                  {selected.location || "Local não informado"}
                </p>
                {selected.capacity !== null && (
                  <p className="mt-2 flex items-center gap-2 text-sm">
                    <Users size={16} />
                    {selected.confirmed_count}/{selected.capacity} inscritos ·{" "}
                    {selected.waitlist_count} na espera
                  </p>
                )}
              </div>
              {canManage && <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="cfit-secondary-button"
                >
                  <Pencil size={16} />
                  Editar
                </button>
                {!selected.confirmed_at && (
                  <button
                    onClick={confirmEvent}
                    className="cfit-primary-button"
                  >
                    Confirmar
                  </button>
                )}
                <button onClick={cancelEvent} className="cfit-danger-button">
                  <XCircle size={16} />
                  Cancelar
                </button>
              </div>}
            </div>
          ) : (
            <form onSubmit={save} className="space-y-4">
              <label className="block text-sm font-semibold">
                Título
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={field}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Tipo
                  <select
                    value={form.event_type}
                    disabled={Boolean(selected?.group_class_id)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        event_type: e.target.value as EventType,
                      })
                    }
                    className={field}
                  >
                    <option value="class">Aula</option>
                    <option value="assessment">Avaliação</option>
                    <option value="task">Tarefa</option>
                    <option value="contact">Contato</option>
                    <option value="visit">Visita</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Profissional
                  <select
                    value={form.professional}
                    onChange={(e) =>
                      setForm({ ...form, professional: e.target.value })
                    }
                    className={field}
                  >
                    <option value="">Eu mesmo</option>
                    {options.professionals.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
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
                    className={field}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Fim
                  <input
                    required
                    type="datetime-local"
                    min={form.starts_at}
                    value={form.ends_at}
                    onChange={(e) =>
                      setForm({ ...form, ends_at: e.target.value })
                    }
                    className={field}
                  />
                </label>
              </div>
              <label className="block text-sm font-semibold">
                Sala ou local
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className={field}
                />
              </label>
              {!selected && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold">
                    Recorrência
                    <select
                      value={form.recurrence}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          recurrence: e.target.value,
                          recurrence_count:
                            e.target.value === "none"
                              ? 1
                              : form.recurrence_count,
                        })
                      }
                      className={field}
                    >
                      <option value="none">Não repetir</option>
                      <option value="daily">Diariamente</option>
                      <option value="weekly">Semanalmente</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    Ocorrências
                    <input
                      type="number"
                      min={1}
                      max={52}
                      disabled={form.recurrence === "none"}
                      value={form.recurrence_count}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          recurrence_count: Number(e.target.value),
                        })
                      }
                      className={field}
                    />
                  </label>
                </div>
              )}
              <label className="block text-sm font-semibold">
                Observações
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-2 min-h-24 w-full rounded-xl border border-[var(--cfit-border-default)] bg-[var(--cfit-surface-elevated)] p-3"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    selected ? setEditing(false) : setModalOpen(false)
                  }
                  className="cfit-secondary-button"
                >
                  Cancelar
                </button>
                <button disabled={saving} className="cfit-primary-button">
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
