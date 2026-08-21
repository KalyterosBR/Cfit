import { useEffect, useMemo, useState } from "react";
import { Building2, CreditCard, Search, Settings2, Shield, Users } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Api } from "@/services/http";

type Academy = { name: string; trade_name: string; phone: string; email: string };
type Me = { role_label: string | null; capabilities: string[] };
type Member = { id: string; email: string; name: string; role: string; active: boolean };
type Audit = { id: string; actor_email: string; action: string; previous_state: object; new_state: object; reason: string; created_at: string };
type Page<T> = { results: T[] };
const roles = [["OWNER", "Proprietário"], ["ADMIN", "Administrador"], ["MANAGER", "Gerente"], ["RECEPTION", "Recepção"], ["TRAINER", "Professor"], ["FINANCIAL", "Financeiro"]];
const categories = [
    { title: "Academia e unidades", description: "Dados cadastrais e estrutura operacional.", icon: Building2, keywords: "academia unidade cnpj endereço" },
    { title: "Usuários e permissões", description: "Perfis, acessos e responsabilidades.", icon: Users, keywords: "usuário perfil permissão equipe" },
    { title: "Planos e contratos", description: "Regras comerciais, contratos e matrículas.", icon: Settings2, keywords: "plano contrato matrícula" },
    { title: "Financeiro", description: "Cobranças, tolerância, recorrência e conciliação.", icon: CreditCard, keywords: "financeiro cobrança pagamento" },
    { title: "Auditoria e segurança", description: "Histórico de alterações e proteção do ambiente.", icon: Shield, keywords: "auditoria segurança histórico" },
];

export default function Settings() {
    const [search, setSearch] = useState("");
    const [academies, setAcademies] = useState<Academy[]>([]);
    const [me, setMe] = useState<Me | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [audits, setAudits] = useState<Audit[]>([]);
    const canAdmin = Boolean(me?.capabilities.includes("*"));
    useEffect(() => { Promise.all([Api.get<Academy[]>("/academies/"), Api.get<Me>("/users/me/")]).then(([a, m]) => { setAcademies(a.data); setMe(m.data); }).catch(() => toast.error("Não foi possível carregar as configurações.")); }, []);
    useEffect(() => { if (!canAdmin) return; Promise.all([Api.get<Page<Member>>("/users/members/"), Api.get<Page<Audit>>("/users/audits/")]).then(([m, a]) => { setMembers(m.data.results); setAudits(a.data.results); }).catch(() => toast.error("Não foi possível carregar permissões e auditoria.")); }, [canAdmin]);
    const filtered = useMemo(() => categories.filter(item => `${item.title} ${item.description} ${item.keywords}`.toLowerCase().includes(search.toLowerCase().trim())), [search]);
    async function updateMember(member: Member, changes: Partial<Member>) {
        try {
            const response = await Api.patch<Member>(`/users/members/${member.id}/`, { ...changes, reason: "Ajuste administrativo de acesso" });
            setMembers(current => current.map(item => item.id === member.id ? response.data : item));
            setAudits((await Api.get<Page<Audit>>("/users/audits/")).data.results);
            toast.success("Permissão atualizada e auditada.");
        } catch { toast.error("Não foi possível atualizar a permissão."); }
    }
    return <DashboardLayout>
        <PageHeader title="Configurações" subtitle={`Parâmetros organizados por área e impacto operacional${me?.role_label ? ` · ${me.role_label}` : ""}.`} />
        <div className="relative mb-5"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar configuração..." className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 shadow-sm" /></div>
        {academies[0] && <section className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5"><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Academia atual</p><p className="mt-2 font-black text-slate-950">{academies[0].trade_name || academies[0].name}</p><p className="mt-1 text-sm text-slate-600">{academies[0].email || "E-mail não informado"} · {academies[0].phone || "Telefone não informado"}</p></section>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(({ icon: Icon, ...item }) => <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon size={20} /></div><h2 className="mt-5 font-black text-slate-950">{item.title}</h2><p className="mt-2 text-sm text-slate-500">{item.description}</p></article>)}</div>
        {filtered.length === 0 && <p className="rounded-2xl bg-white p-10 text-center text-slate-500">Nenhuma configuração corresponde à busca.</p>}
        {canAdmin && <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-black text-slate-950">Usuários e permissões</h2><p className="mt-1 text-sm text-slate-500">As capacidades são validadas no backend, inclusive nas operações financeiras.</p><div className="mt-5 divide-y divide-slate-100">{members.map(member => <div key={member.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center"><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{member.name}</p><p className="truncate text-sm text-slate-500">{member.email}</p></div><select value={member.role} onChange={e => updateMember(member, { role: e.target.value })} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">{roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" onClick={() => updateMember(member, { active: !member.active })} className={`h-10 rounded-xl px-4 text-sm font-bold ${member.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{member.active ? "Ativo" : "Inativo"}</button></div>)}</div>{members.length === 0 && <p className="mt-5 text-sm text-slate-500">Nenhum usuário vinculado à academia.</p>}</section>}
        {canAdmin && <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-black text-slate-950">Auditoria administrativa</h2><p className="mt-1 text-sm text-slate-500">Quem alterou, quando e os valores anterior e posterior.</p><div className="mt-5 space-y-3">{audits.map(audit => <article key={audit.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-bold text-slate-800">{audit.actor_email} · {audit.action}</p><time className="text-xs text-slate-500">{new Date(audit.created_at).toLocaleString("pt-BR")}</time></div><p className="mt-2 text-xs text-slate-500">Antes: {JSON.stringify(audit.previous_state)} → Depois: {JSON.stringify(audit.new_state)}</p>{audit.reason && <p className="mt-1 text-xs text-slate-500">Motivo: {audit.reason}</p>}</article>)}</div>{audits.length === 0 && <p className="mt-5 text-sm text-slate-500">Nenhuma alteração administrativa registrada.</p>}</section>}
    </DashboardLayout>;
}
