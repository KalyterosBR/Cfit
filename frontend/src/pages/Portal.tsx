import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CalendarDays, ClipboardCheck, CreditCard, Dumbbell, FileText, Footprints, LogOut, RefreshCw, UserRound } from "lucide-react";
import toast from "react-hot-toast";

import { ErrorState, ModuleSkeleton } from "@/components/AsyncState";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { clearTokens } from "@/features/auth/services/token.service";
import { Api } from "@/services/http";

type PortalData = {
  student: { name: string; email?: string; phone?: string };
  enrollments: Array<{ id: string; plan: string; status: string }>;
  charges: Array<{ id: string; description: string; due_date: string; status: string }>;
  checkins: Array<{ id: string; checked_in_at: string }>;
  assessments: Array<{ id: string; assessed_at: string; notes?: string }>;
  documents: Array<{ id: string; title: string; accepted_at: string | null; expires_at: string | null }>;
  classes: Array<{ id: string; title: string; starts_at: string; location: string; capacity: number; confirmed_count: number; my_booking: { id: string; status: string } | null }>;
  workouts: Array<{ id: string; name: string; objective: string; review_date: string | null; adherence_percentage: number | null; exercises: Array<{ name: string; sets: number; repetitions: string; load: string | null }> }>;
};

const formatDate = (value: string) => new Date(value).toLocaleString("pt-BR");

export default function Portal() {
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState(false);
  const [operating, setOperating] = useState("");
  const load = useCallback(async () => {
    setError(false);
    try { setData((await Api.get<PortalData>("/users/portal/me/")).data); }
    catch { setError(true); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function operate(key: string, body: Record<string, string>) {
    setOperating(key);
    try { await Api.post("/users/portal/me/", body); toast.success("Operação concluída."); await load(); }
    catch { toast.error("Não foi possível concluir a operação."); }
    finally { setOperating(""); }
  }
  async function updatePhone() {
    const phone = window.prompt("Novo telefone:", data?.student.phone || "");
    if (phone === null) return;
    await Api.patch("/users/portal/me/", { phone });
    toast.success("Telefone atualizado.");
    await load();
  }
  if (error) return <main className="cfit-internal min-h-screen bg-[var(--cfit-canvas)] p-5 md:p-10"><div className="mx-auto max-w-3xl"><ErrorState onRetry={load} label="Não foi possível carregar seu portal." /></div></main>;
  if (!data) return <main className="cfit-internal min-h-screen bg-[var(--cfit-canvas)] p-5 md:p-10"><div className="mx-auto max-w-6xl"><ModuleSkeleton variant="details" label="Carregando portal do aluno" /></div></main>;

  return <main className="cfit-internal min-h-screen bg-[var(--cfit-canvas)] p-5 transition-colors md:p-10">
    <ThemeToggle className="fixed right-5 top-5 z-20" />
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 pr-14">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Portal do aluno</p><h1 className="mt-2 text-3xl font-black text-slate-950">Olá, {data.student.name}</h1><p className="mt-2 text-sm text-slate-500">Seus dados acadêmicos e operacionais em um ambiente privado.</p></div>
        <div className="flex gap-2"><button type="button" onClick={updatePhone} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold text-blue-700"><UserRound size={16}/> Meus dados</button><button type="button" onClick={() => { clearTokens(); location.href = "/"; }} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold"><LogOut size={16}/> Sair</button></div>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        <Card title="Meus planos" icon={<ClipboardCheck size={18}/>} count={data.enrollments.length}>{data.enrollments.map((item) => <Row key={item.id}>{item.plan} · {item.status}</Row>)}</Card>
        <Card title="Próximas turmas" icon={<CalendarDays size={18}/>} count={data.classes.length}>{data.classes.map((item) => <Row key={item.id}><div><strong>{item.title}</strong><p className="mt-1 text-xs">{formatDate(item.starts_at)} · {item.location || "Local a definir"} · {item.confirmed_count}/{item.capacity}</p></div>{item.my_booking ? <button disabled={operating === item.id} onClick={() => operate(item.id, { operation: "cancel_booking", booking_id: item.my_booking!.id })} className="font-bold text-red-600 disabled:opacity-50">Cancelar ({item.my_booking.status})</button> : <button disabled={operating === item.id} onClick={() => operate(item.id, { operation: "book_class", class_id: item.id })} className="font-bold text-blue-600 disabled:opacity-50">Reservar</button>}</Row>)}</Card>
        <Card title="Meu treino" icon={<Dumbbell size={18}/>} count={data.workouts.length}>{data.workouts.map((item) => <Row key={item.id}><div><strong>{item.name}</strong><p className="mt-1 text-xs">{item.objective} · aderência {item.adherence_percentage ?? "—"}%{item.review_date ? ` · revisão ${item.review_date}` : ""}</p><ul className="mt-2 text-xs">{item.exercises.map((exercise) => <li key={exercise.name}>{exercise.name}: {exercise.sets} × {exercise.repetitions}{exercise.load ? ` · ${exercise.load} kg` : ""}</li>)}</ul></div></Row>)}</Card>
        <Card title="Financeiro" icon={<CreditCard size={18}/>} count={data.charges.length}>{data.charges.map((item) => <Row key={item.id}>{item.description} · {new Date(`${item.due_date}T12:00:00`).toLocaleDateString("pt-BR")} · {item.status}</Row>)}</Card>
        <Card title="Check-ins recentes" icon={<Footprints size={18}/>} count={data.checkins.length}>{data.checkins.map((item) => <Row key={item.id}>{formatDate(item.checked_in_at)}</Row>)}</Card>
        <Card title="Avaliações" icon={<RefreshCw size={18}/>} count={data.assessments.length}>{data.assessments.map((item) => <Row key={item.id}>{formatDate(item.assessed_at)}{item.notes ? ` · ${item.notes}` : ""}</Row>)}</Card>
        <Card title="Documentos" icon={<FileText size={18}/>} count={data.documents.length}>{data.documents.map((item) => <Row key={item.id}><span>{item.title} · {item.accepted_at ? "aceito" : "aguardando aceite"}{item.expires_at ? ` · vence ${new Date(`${item.expires_at}T12:00:00`).toLocaleDateString("pt-BR")}` : ""}</span>{!item.accepted_at && <button disabled={operating === item.id} onClick={() => operate(item.id, { operation: "accept_document", document_id: item.id })} className="font-bold text-blue-600 disabled:opacity-50">Aceitar</button>}</Row>)}</Card>
      </div>
    </div>
  </main>;
}

function Card({ title, icon, count, children }: { title: string; icon: ReactNode; count: number; children: ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-black text-slate-900"><span className="text-blue-600">{icon}</span>{title}</h2><div className="mt-4 space-y-2">{count ? children : <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">Nenhum registro disponível.</p>}</div></section>;
}
function Row({ children }: { children: ReactNode }) { return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{children}</div>; }
