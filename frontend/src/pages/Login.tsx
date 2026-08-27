import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import Logo from "@/components/branding/Logo";
import LoginForm from "@/features/auth/components/LoginForm";
import LoginHeader from "@/features/auth/components/LoginHeader";
import { getAccessToken } from "@/features/auth/services/token.service";

export default function Login() {
    if (getAccessToken()) return <Navigate to="/dashboard" replace />;

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#f4f7fb] px-3 py-4 max-[339px]:items-start max-[339px]:px-2 max-[339px]:py-2 sm:px-5 sm:py-7 lg:py-10">
            <div className="pointer-events-none absolute inset-0" aria-hidden="true"><div className="absolute -right-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-cyan-300/15 blur-[120px]" /><div className="absolute -left-48 bottom-0 h-[30rem] w-[30rem] rounded-full bg-blue-400/10 blur-[120px]" /></div>
            <div className="relative grid w-full max-w-[1040px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_32px_90px_-48px_rgba(15,23,42,0.55)] max-[339px]:rounded-[1.25rem] lg:grid-cols-[0.8fr_1.2fr]">
                <aside className="hidden flex-col justify-between bg-[#edf4ff] p-10 lg:flex">
                    <div><Link to="/" aria-label="Voltar à homepage"><Logo width={132} /></Link><p className="mt-10 text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">Acesso do cliente</p><h1 className="mt-4 text-4xl font-black leading-[1] tracking-[-0.055em] text-slate-950">Sua operação continua aqui.</h1><p className="mt-5 text-sm leading-7 text-slate-600">Entre com segurança para acessar o ambiente de gestão da sua academia.</p></div>
                    <p className="flex items-center gap-2 text-xs font-semibold text-slate-500"><CheckCircle2 size={15} className="text-emerald-600" /> Ambiente protegido pelo Cfit</p>
                </aside>
                <section className="bg-[#081426] p-4 max-[339px]:p-3 sm:p-7 lg:p-10" aria-label="Autenticação">
                    <div className="mb-4 flex min-w-0 items-center justify-between gap-3 max-[339px]:mb-2 lg:hidden"><Link to="/" aria-label="Voltar à homepage" className="shrink-0 rounded-md bg-white px-2 py-1.5"><Logo width={76} /></Link><Link to="/" className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-slate-200 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300"><ArrowLeft size={15} aria-hidden="true" /> Voltar</Link></div>
                    <Card className="border-0 bg-transparent p-0 shadow-none">
                        <LoginHeader />
                        <div className="my-4 h-px bg-gradient-to-r from-white/10 via-white/10 to-transparent max-[339px]:my-3 sm:my-5" />
                        <LoginForm />
                    </Card>
                </section>
            </div>
        </main>
    );
}
