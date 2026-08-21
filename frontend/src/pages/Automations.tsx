import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Play, Zap } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Api } from "@/services/http";

type Rule = { id: string; name: string; event_type: string; event_label: string; action_description: string; active: boolean };
type Execution = { id: string; rule_name: string; explanation: string; created_at: string };
type Page<T> = { results: T[] };
const events = [["overdue_charge", "Cobrança vencida"], ["recurring_rejected", "Recorrência rejeitada"], ["prolonged_absence", "Ausência prolongada"], ["plan_ending", "Plano próximo do fim"], ["birthday", "Aniversário"], ["visit_without_return", "Visita sem retorno"]];

export default function Automations() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [executions, setExecutions] = useState<Execution[]>([]);
    const [name, setName] = useState("");
    const [eventType, setEventType] = useState(events[0][0]);
    const [action, setAction] = useState("");
    async function load() { const [r, e] = await Promise.all([Api.get<Page<Rule>>("/automations/rules/"), Api.get<Page<Execution>>("/automations/executions/")]); setRules(r.data.results); setExecutions(e.data.results); }
    useEffect(() => { Promise.all([Api.get<Page<Rule>>("/automations/rules/"), Api.get<Page<Execution>>("/automations/executions/")]).then(([r, e]) => { setRules(r.data.results); setExecutions(e.data.results); }).catch(() => toast.error("Sem permissão para consultar automações.")); }, []);
    async function create(event: FormEvent) { event.preventDefault(); try { await Api.post("/automations/rules/", { name, event_type: eventType, action_description: action }); setName(""); setAction(""); await load(); toast.success("Automação criada e auditada."); } catch { toast.error("Não foi possível criar a automação."); } }
    async function trigger(rule: Rule) { try { await Api.post(`/automations/rules/${rule.id}/trigger/`, {}); await load(); toast.success("Evento processado."); } catch { toast.error("Não foi possível executar a automação."); } }
    return <DashboardLayout><PageHeader title="Automações" subtitle="Regras transparentes, controladas e com histórico de execução." />
        <form onSubmit={create} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3"><input required value={name} onChange={e => setName(e.target.value)} placeholder="Nome da automação" className="h-11 rounded-xl border border-slate-200 px-3" /><select value={eventType} onChange={e => setEventType(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3">{events.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input required value={action} onChange={e => setAction(e.target.value)} placeholder="Ação ou próxima orientação" className="h-11 rounded-xl border border-slate-200 px-3" /><button className="h-11 rounded-xl bg-blue-600 font-bold text-white md:col-span-3">Criar automação</button></form>
        <div className="mt-5 grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-black"><Zap size={18} /> Regras ativas</h2><div className="mt-4 space-y-3">{rules.map(rule => <article key={rule.id} className="rounded-xl border border-slate-100 p-4"><p className="font-bold">{rule.name}</p><p className="text-sm text-slate-500">Quando: {rule.event_label}</p><p className="mt-1 text-sm text-slate-600">Então: {rule.action_description}</p><button onClick={() => trigger(rule)} className="mt-3 flex items-center gap-2 text-sm font-bold text-blue-600"><Play size={15} /> Testar evento</button></article>)}{rules.length === 0 && <p className="text-sm text-slate-500">Nenhuma regra configurada.</p>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">Histórico de execução</h2><div className="mt-4 space-y-3">{executions.map(item => <article key={item.id} className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-bold">{item.rule_name}</p><p className="mt-1 text-sm text-slate-500">{item.explanation}</p><time className="mt-2 block text-xs text-slate-400">{new Date(item.created_at).toLocaleString("pt-BR")}</time></article>)}{executions.length === 0 && <p className="text-sm text-slate-500">Nenhuma execução registrada.</p>}</div></section></div>
    </DashboardLayout>;
}
