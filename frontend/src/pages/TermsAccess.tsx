import { useEffect, useState } from "react";
import { FileCheck2, LogOut, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Api } from "@/services/http";
import { clearTokens } from "@/features/auth/services/token.service";
import { AppBootSkeleton } from "@/components/AsyncState";

type CurrentTerm = { pending: boolean; term: { id: string; version: number; title: string; content: string } | null };

export default function TermsAccess() {
  const [data, setData] = useState<CurrentTerm | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { Api.get<CurrentTerm>("/users/terms/current/").then((response) => setData(response.data)).catch(() => toast.error("Não foi possível carregar o termo.")); }, []);

  async function confirm() {
    if (!accepted) return;
    try {
      setSaving(true);
      await Api.post("/users/terms/current/");
      toast.success("Aceite registrado.");
      window.location.assign("/dashboard");
    } catch {
      toast.error("Não foi possível registrar o aceite.");
      setSaving(false);
    }
  }

  function leave() {
    clearTokens();
    window.location.assign("/login");
  }

  return <main className="relative h-screen overflow-hidden bg-[var(--cfit-canvas)] text-white">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none blur-[3px]">
      <AppBootSkeleton />
    </div>
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
    <section role="dialog" aria-modal="true" aria-labelledby="legal-term-title" className="my-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0d1d32]/95 p-5 shadow-[0_30px_100px_-28px_rgba(2,8,23,0.9)] sm:p-8">
      <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-cyan-300"><FileCheck2 /></div><div><p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Privacidade e responsabilidade</p><h1 id="legal-term-title" className="mt-1 text-2xl font-black">{data?.term?.title || "Termos de uso"}</h1></div></div>
      {!data ? <p className="mt-8 text-slate-400">Carregando documento...</p> : data.term ? <>
        <p className="mt-5 text-xs font-bold text-slate-400">Versão {data.term.version}</p>
        <article className="mt-4 max-h-[38vh] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-[#081426] p-4 text-sm leading-7 text-slate-200 sm:max-h-[44vh] sm:p-5">{data.term.content}</article>
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-4 text-sm leading-6 text-slate-200"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-blue-500" /><span>Li e aceito este documento, comprometendo-me a usar contas individuais e proteger os dados pessoais acessados no Cfit.</span></label>
        <button type="button" disabled={!accepted || saving} onClick={() => void confirm()} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"><ShieldCheck size={18} />{saving ? "Registrando..." : "Aceitar e continuar"}</button>
        <button type="button" onClick={leave} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-slate-400 transition hover:bg-white/5 hover:text-white"><LogOut size={17} />Sair sem aceitar</button>
      </> : <p className="mt-8 text-slate-300">Nenhum termo está publicado para esta academia.</p>}
    </section>
    </div>
  </main>;
}
