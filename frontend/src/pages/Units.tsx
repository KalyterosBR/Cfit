import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Building2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Api } from "@/services/http";

type Unit = { id: string; name: string; code: string; address: string; phone: string; active: boolean };
type Me = { active_unit: Unit | null };
type Page<T> = { results: T[] };
export default function Units() {
    const [units, setUnits] = useState<Unit[]>([]); const [active, setActive] = useState<string | null>(null); const [name, setName] = useState(""); const [code, setCode] = useState("");
    async function load() { const [u, me] = await Promise.all([Api.get<Page<Unit>>("/academies/units/"), Api.get<Me>("/users/me/")]); setUnits(u.data.results); setActive(me.data.active_unit?.id ?? null); }
    useEffect(() => { Promise.all([Api.get<Page<Unit>>("/academies/units/"), Api.get<Me>("/users/me/")]).then(([u, me]) => { setUnits(u.data.results); setActive(me.data.active_unit?.id ?? null); }).catch(() => toast.error("Sem permissão para consultar unidades.")); }, []);
    async function create(event: FormEvent) { event.preventDefault(); try { await Api.post("/academies/units/", { name, code }); setName(""); setCode(""); await load(); toast.success("Unidade criada."); } catch { toast.error("Não foi possível criar a unidade."); } }
    async function select(unit: Unit) { try { await Api.post("/users/me/active-unit/", { unit: unit.id }); setActive(unit.id); toast.success("Contexto da unidade atualizado."); } catch { toast.error("Não foi possível selecionar a unidade."); } }
    return <DashboardLayout><PageHeader title="Academia e unidades" subtitle="Base multiunidade com isolamento por academia e contexto operacional ativo." /><form onSubmit={create} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-[1fr_1fr_auto]"><input required value={name} onChange={e => setName(e.target.value)} placeholder="Nome da unidade" className="h-11 rounded-xl border border-slate-200 px-3" /><input required value={code} onChange={e => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="Código (ex.: centro)" className="h-11 rounded-xl border border-slate-200 px-3" /><button className="h-11 rounded-xl bg-blue-600 px-5 font-bold text-white">Adicionar unidade</button></form><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{units.map(unit => <article key={unit.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${active === unit.id ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"}`}><Building2 className="text-blue-600" /><h2 className="mt-4 font-black">{unit.name}</h2><p className="mt-1 text-sm text-slate-500">Código: {unit.code}</p><button onClick={() => select(unit)} className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-600"><CheckCircle2 size={16} /> {active === unit.id ? "Unidade ativa" : "Usar esta unidade"}</button></article>)}</div>{units.length === 0 && <p className="mt-5 rounded-2xl bg-white p-10 text-center text-slate-500">Cadastre a primeira unidade da academia.</p>}</DashboardLayout>;
}
