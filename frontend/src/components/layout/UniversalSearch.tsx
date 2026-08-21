import { useEffect, useMemo, useRef, useState } from "react";

import { CreditCard, Search, UserPlus, Users, WalletCards, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getPlansPage } from "@/features/students/services/plan.service";
import { getStudents } from "@/features/students/services/student.service";
import { Api } from "@/services/http";

type SearchResult = { id: string; title: string; detail: string; href: string; kind: "Aluno" | "Plano" | "Cobrança" };

const actions = [
    { title: "Cadastrar aluno", detail: "Abrir o cadastro de um novo aluno", href: "/students?action=new", icon: UserPlus },
    { title: "Consultar financeiro", detail: "Abrir cobranças e recebimentos", href: "/finance", icon: WalletCards },
    { title: "Monitorar acessos", detail: "Abrir check-ins da academia", href: "/checkins", icon: CreditCard },
];

export default function UniversalSearch() {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setOpen(true);
            }
            if (event.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", handleShortcut);
        return () => window.removeEventListener("keydown", handleShortcut);
    }, []);

    useEffect(() => {
        if (open) window.setTimeout(() => inputRef.current?.focus(), 0);
    }, [open]);

    useEffect(() => {
        const normalized = query.trim();
        let current = true;
        const timer = window.setTimeout(async () => {
            if (normalized.length < 2) {
                setResults([]);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const [students, plans, charges] = await Promise.all([
                    getStudents(normalized),
                    getPlansPage({ page: 1, search: normalized, status: "all" }),
                    Api.get("/financial/charges/", { params: { search: normalized, page: 1 } }),
                ]);
                if (!current) return;
                setResults([
                    ...students.results.slice(0, 5).map((student: { id: string; name: string; cpf: string }) => ({ id: student.id, title: student.name, detail: student.cpf, href: `/students/${student.id}`, kind: "Aluno" as const })),
                    ...plans.results.slice(0, 4).map((plan) => ({ id: plan.id, title: plan.name, detail: `Plano · ${Number(plan.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, href: `/plans?search=${encodeURIComponent(plan.name)}`, kind: "Plano" as const })),
                    ...charges.data.results.slice(0, 4).map((charge: { id: string; student_name: string; description: string }) => ({ id: charge.id, title: charge.student_name, detail: charge.description, href: `/finance?charge=${charge.id}#charges`, kind: "Cobrança" as const })),
                ]);
            } catch (error) {
                console.error(error);
                if (current) setResults([]);
            } finally { if (current) setLoading(false); }
        }, normalized.length < 2 ? 0 : 300);
        return () => { current = false; window.clearTimeout(timer); };
    }, [query]);

    const visibleActions = useMemo(() => actions.filter((action) => !query.trim() || `${action.title} ${action.detail}`.toLowerCase().includes(query.toLowerCase())), [query]);
    const go = (href: string) => { setOpen(false); setQuery(""); navigate(href); };

    return <>
        <button type="button" onClick={() => setOpen(true)} className="hidden h-10 w-[min(24vw,320px)] items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 text-xs font-medium text-slate-400 transition hover:bg-white md:flex">
            <Search size={16} /><span className="flex-1 text-left">Buscar no Cfit...</span><kbd className="rounded border bg-white px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
        </button>
        <button type="button" onClick={() => setOpen(true)} aria-label="Buscar no Cfit" className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-600 md:hidden"><Search size={18} /></button>
        {open && <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/55 px-4 pt-[10vh] backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
            <div role="dialog" aria-modal="true" aria-label="Busca e comandos do Cfit" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center gap-3 border-b px-4"><Search size={19} className="text-blue-600" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque alunos, planos, cobranças ou ações..." className="h-14 flex-1 outline-none" /><button type="button" onClick={() => setOpen(false)} aria-label="Fechar"><X size={19} /></button></div>
                <div className="max-h-[60vh] overflow-y-auto p-3">
                    {visibleActions.length > 0 && <><p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ações rápidas</p>{visibleActions.map(({ icon: Icon, ...action }) => <button key={action.href} type="button" onClick={() => go(action.href)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-blue-50"><span className="rounded-lg bg-blue-100 p-2 text-blue-700"><Icon size={16} /></span><span><strong className="block text-sm text-slate-900">{action.title}</strong><small className="text-slate-500">{action.detail}</small></span></button>)}</>}
                    {query.trim().length >= 2 && <><p className="px-2 pb-2 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Resultados</p>{loading ? <p className="p-4 text-sm text-slate-500">Buscando...</p> : results.length === 0 ? <p className="p-4 text-sm text-slate-500">Nenhum resultado encontrado.</p> : results.map((result) => <button key={`${result.kind}-${result.id}`} type="button" onClick={() => go(result.href)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50"><Users size={17} className="text-slate-400" /><span className="flex-1"><strong className="block text-sm text-slate-900">{result.title}</strong><small className="text-slate-500">{result.detail}</small></span><span className="text-[10px] font-bold uppercase text-blue-600">{result.kind}</span></button>)}</>}
                </div>
            </div>
        </div>}
    </>;
}
