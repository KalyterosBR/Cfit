import axios from "axios";
import { ArrowLeft, ArrowRight, BarChart3, Building2, Check, DoorOpen, MapPin, Sparkles, Users, WalletCards } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";

import { useSession } from "@/features/auth/access-control";
import { Api } from "@/services/http";
import { phoneMask } from "@/utils/masks";

type Form = {
    name: string; trade_name: string; establishment_type: string; size_range: string;
    primary_goal: string; phone: string; email: string; unit_name: string;
    unit_address: string; unit_phone: string; payment_grace_days: number;
};

const establishmentTypes = [
    ["gym", "Academia"], ["studio", "Estúdio"], ["crossfit", "Cross training"],
    ["functional", "Treinamento funcional"], ["martial_arts", "Artes marciais"],
    ["swimming", "Natação"], ["club", "Clube ou centro esportivo"], ["other", "Outro"],
];
const sizes = [["up_to_100", "Até 100 alunos"], ["101_300", "101 a 300"], ["301_700", "301 a 700"], ["701_1500", "701 a 1.500"], ["above_1500", "Mais de 1.500"]];
const goals = [["organize", "Organizar a operação"], ["grow", "Atrair e converter mais alunos"], ["retain", "Aumentar retenção"], ["finance", "Melhorar o controle financeiro"], ["access", "Automatizar controle de acesso"]];

export default function Onboarding() {
    const profile = useSession();
    const [welcome, setWelcome] = useState(true);
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Form>({
        name: profile.academy?.name ?? "", trade_name: "", establishment_type: "", size_range: "",
        primary_goal: "", phone: "", email: "", unit_name: profile.active_unit?.name ?? "",
        unit_address: "", unit_phone: "", payment_grace_days: 7,
    });

    useEffect(() => {
        Api.get("/academies/onboarding/").then(({ data }) => setForm(current => ({
            ...current,
            name: data.academy?.name ?? current.name,
            trade_name: data.academy?.trade_name ?? "",
            phone: data.academy?.phone ?? "",
            email: data.academy?.email ?? "",
            unit_name: data.unit?.name ?? current.unit_name,
            unit_address: data.unit?.address ?? "",
            unit_phone: data.unit?.phone ?? "",
            payment_grace_days: data.payment_grace_days ?? 7,
        }))).catch(() => toast.error("Não foi possível carregar os dados iniciais."));
    }, []);

    function update<K extends keyof Form>(field: K, value: Form[K]) { setForm(current => ({ ...current, [field]: value })); }
    function next() {
        if (step === 1 && (!form.name.trim() || !form.trade_name.trim() || !form.establishment_type || form.phone.replace(/\D/g, "").length < 10 || !form.email.trim())) return toast.error("Preencha todos os campos obrigatórios desta etapa.");
        if (step === 2 && (!form.unit_name.trim() || form.unit_address.trim().length < 8 || form.unit_phone.replace(/\D/g, "").length < 10 || !form.size_range)) return toast.error("Preencha todos os campos obrigatórios da unidade.");
        setStep(current => Math.min(3, current + 1));
    }
    async function submit(event: FormEvent) {
        event.preventDefault();
        if (!form.primary_goal) return toast.error("Selecione a prioridade atual da academia.");
        setSaving(true);
        try {
            await Api.post("/academies/onboarding/", form);
            toast.success("Configuração inicial concluída.");
            window.location.assign("/dashboard");
        } catch (error) {
            const detail = axios.isAxiosError<{ detail?: string }>(error) ? error.response?.data?.detail : null;
            toast.error(detail || "Não foi possível concluir a configuração."); setSaving(false);
        }
    }

    const inputClass = "mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";
    const steps = [[Building2, "Seu negócio"], [MapPin, "Unidade principal"], [Sparkles, "Objetivo e operação"]] as const;
    const title = step === 1 ? "Conte sobre seu estabelecimento" : step === 2 ? "Configure sua primeira unidade" : "Ajustes para começar";
    const subtitle = step === 1 ? "Use as informações comerciais que sua equipe reconhece." : step === 2 ? "Essa será a unidade selecionada inicialmente no sistema." : "Personalize o início da operação. Tudo poderá ser alterado depois.";

    if (welcome) return <main className="relative min-h-screen overflow-hidden bg-[#f5f7fb] px-4 py-6 sm:px-6 sm:py-10">
        <div className="pointer-events-none absolute -right-52 -top-52 h-[34rem] w-[34rem] rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-60 -left-52 h-[36rem] w-[36rem] rounded-full bg-blue-400/15 blur-3xl" />
        <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center sm:min-h-[calc(100vh-5rem)]">
            <section className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
                    <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#07152d] text-lg font-black text-white">C</span><div><p className="text-lg font-black tracking-tight text-[#07152d]">Cfit</p><p className="text-xs font-semibold text-slate-400">Performance para sua gestão</p></div></div>
                    <div className="mt-10 max-w-xl"><span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-blue-700"><Sparkles size={14} /> Seu ambiente está pronto</span><h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl">Bem-vindo ao novo ritmo da sua academia.</h1><p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">O Cfit conecta alunos, planos, financeiro, acesso e operação para transformar a rotina da sua equipe em decisões mais simples.</p></div>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><button type="button" onClick={() => setWelcome(false)} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700">Configurar minha academia <ArrowRight size={18} /></button><p className="text-xs leading-5 text-slate-400 sm:max-w-48">São apenas 3 etapas rápidas. Você poderá alterar tudo depois.</p></div>
                </div>

                <div className="relative overflow-hidden bg-[#07152d] px-6 py-9 text-white sm:px-10 lg:px-12 lg:py-14">
                    <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
                    <div className="relative"><p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Tudo conectado</p><h2 className="mt-3 text-2xl font-black">Uma visão completa da operação.</h2><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{[
                        [Users, "Alunos", "Cadastro, matrículas e relacionamento."],
                        [WalletCards, "Financeiro", "Cobranças, caixa e previsibilidade."],
                        [DoorOpen, "Acesso", "Check-ins e integração com catracas."],
                        [BarChart3, "Performance", "Indicadores para decisões melhores."],
                    ].map(([Icon, label, description]) => { const FeatureIcon = Icon as typeof Users; return <article key={label as string} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/20 text-cyan-300"><FeatureIcon size={18} /></span><h3 className="mt-4 text-sm font-black">{label as string}</h3><p className="mt-1 text-xs leading-5 text-slate-400">{description as string}</p></article>; })}</div><div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-400 text-[#07152d]"><Check size={17} /></span><p className="text-xs font-semibold leading-5 text-emerald-100">Comece com o essencial e evolua sua operação no seu próprio ritmo.</p></div></div>
                </div>
            </section>
        </div>
    </main>;

    return <main className="relative min-h-screen overflow-hidden bg-[#f5f7fb] px-4 py-6 sm:px-6 sm:py-10">
        <div className="pointer-events-none absolute -right-52 -top-52 h-[32rem] w-[32rem] rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-56 -left-56 h-[34rem] w-[34rem] rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative mx-auto w-full max-w-5xl">
            <header className="mb-6 flex items-center justify-between px-1 sm:mb-8">
                <div><p className="text-xl font-black tracking-tight text-[#07152d]">Cfit</p><p className="mt-1 text-xs font-semibold text-slate-500">Configuração inicial da sua academia</p></div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm">Etapa {step} de 3</span>
            </header>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-8 lg:px-10">
                    <ol className="grid grid-cols-3 gap-2 sm:gap-6">{steps.map(([Icon, label], index) => { const number = index + 1; const complete = step > number; const active = step === number; return <li key={label} className="relative flex min-w-0 items-center gap-2 sm:gap-3">
                        {index > 0 && <span className={`absolute right-full top-5 hidden h-px w-6 sm:block ${step >= number ? "bg-blue-500" : "bg-slate-200"}`} />}
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${complete ? "bg-emerald-500 text-white" : active ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-400"}`}>{complete ? <Check size={18} /> : <Icon size={18} />}</span>
                        <span className="min-w-0"><span className={`hidden text-[10px] font-black uppercase tracking-[0.12em] sm:block ${active ? "text-blue-600" : "text-slate-400"}`}>Etapa {number}</span><span className={`block truncate text-xs font-bold sm:text-sm ${active || complete ? "text-slate-900" : "text-slate-400"}`}>{label}</span></span>
                    </li>; })}</ol>
                    <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300" style={{ width: `${step / 3 * 100}%` }} /></div>
                </div>

                <form onSubmit={submit}>
                    <div className="min-h-[420px] px-5 py-7 sm:px-8 sm:py-9 lg:px-14 lg:py-10">
                        <div className="mb-8 max-w-2xl"><h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">{subtitle}</p></div>
                {step === 1 && <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-bold text-slate-700 sm:col-span-2">Nome da academia ou empresa *<input required minLength={2} value={form.name} onChange={e => update("name", e.target.value)} className={inputClass} /></label><label className="text-sm font-bold text-slate-700">Nome que seus alunos conhecem *<input required minLength={2} value={form.trade_name} onChange={e => update("trade_name", e.target.value)} className={inputClass} placeholder="Nome fantasia" /></label><label className="text-sm font-bold text-slate-700">Tipo de estabelecimento *<select required value={form.establishment_type} onChange={e => update("establishment_type", e.target.value)} className={inputClass}><option value="" disabled>Selecione uma opção</option>{establishmentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-bold text-slate-700">Telefone *<input required inputMode="tel" autoComplete="tel" maxLength={15} value={form.phone} onChange={e => update("phone", phoneMask(e.target.value))} className={inputClass} placeholder="(00) 00000-0000" /></label><label className="text-sm font-bold text-slate-700">E-mail comercial *<input required type="email" value={form.email} onChange={e => update("email", e.target.value)} className={inputClass} /></label></div>}
                {step === 2 && <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-bold text-slate-700 sm:col-span-2">Nome da unidade *<input required minLength={2} value={form.unit_name} onChange={e => update("unit_name", e.target.value)} className={inputClass} placeholder="Matriz, Centro, Unidade principal..." /></label><label className="text-sm font-bold text-slate-700 sm:col-span-2">Endereço completo *<input required minLength={8} value={form.unit_address} onChange={e => update("unit_address", e.target.value)} className={inputClass} placeholder="Rua, número, bairro e cidade" /></label><label className="text-sm font-bold text-slate-700">Telefone da unidade *<input required inputMode="tel" autoComplete="tel" maxLength={15} value={form.unit_phone} onChange={e => update("unit_phone", phoneMask(e.target.value))} className={inputClass} placeholder="(00) 00000-0000" /></label><label className="text-sm font-bold text-slate-700">Tamanho atual *<select required value={form.size_range} onChange={e => update("size_range", e.target.value)} className={inputClass}><option value="" disabled>Selecione uma faixa</option>{sizes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>}
                {step === 3 && <div className="space-y-7"><fieldset><legend className="text-sm font-bold text-slate-700">Qual é sua prioridade neste momento? *</legend><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{goals.map(([value, label]) => <label key={value} className={`flex min-h-16 cursor-pointer items-center rounded-xl border px-4 py-3 text-sm font-bold transition ${form.primary_goal === value ? "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-100" : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white"}`}><input required type="radio" className="sr-only" checked={form.primary_goal === value} onChange={() => update("primary_goal", value)} />{label}</label>)}</div></fieldset><div className="grid items-end gap-5 sm:grid-cols-[180px_1fr]"><label className="block text-sm font-bold text-slate-700">Tolerância financeira *<input required type="number" min={0} max={90} value={form.payment_grace_days} onChange={e => update("payment_grace_days", Number(e.target.value))} className={inputClass} /></label><p className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">Quantidade de dias após o vencimento antes de considerar o bloqueio financeiro.</p></div><div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-6 text-cyan-900">Os campos marcados com * são obrigatórios. Você poderá alterar tudo depois em Configurações.</div></div>}
                    </div>
                    <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-8 lg:px-10"><button type="button" disabled={step === 1} onClick={() => setStep(current => Math.max(1, current - 1))} className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 transition hover:bg-white disabled:invisible"><ArrowLeft size={17} /> Voltar</button>{step < 3 ? <button type="button" onClick={next} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">Continuar <ArrowRight size={17} /></button> : <button disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60">{saving ? "Salvando..." : "Concluir configuração"} <Check size={17} /></button>}</footer>
                </form>
            </section>
            <p className="mt-4 text-center text-xs text-slate-400">Seus dados ficam protegidos e podem ser atualizados a qualquer momento.</p>
        </div>
    </main>;
}
