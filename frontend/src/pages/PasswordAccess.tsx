import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { Check, Circle, KeyRound } from "lucide-react";
import { Api } from "@/services/http";
import { clearTokens } from "@/features/auth/services/token.service";

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <main className="flex min-h-screen items-center justify-center bg-[#050b1c] p-5"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-7 text-white shadow-2xl"><KeyRound className="text-cyan-400" /><h1 className="mt-5 text-2xl font-black">{title}</h1><p className="mt-2 text-sm text-slate-400">{subtitle}</p>{children}</section></main>; }
const field = "h-11 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white outline-none focus:border-cyan-400";

export function ForgotPassword() {
    const [email, setEmail] = useState(""); const [sent, setSent] = useState(false);
    async function submit(e: React.FormEvent) { e.preventDefault(); await Api.post("/users/password/reset/", { email }); setSent(true); }
    return <Shell title="Recuperar senha" subtitle="Enviaremos um link se o e-mail estiver cadastrado.">{sent ? <div className="mt-6 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-300">Solicitação recebida. Verifique o e-mail e a caixa de spam.</div> : <form onSubmit={submit} className="mt-6 space-y-4"><label htmlFor="recovery-email" className="sr-only">E-mail</label><input id="recovery-email" required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" className={field}/><button className="h-11 w-full rounded-xl bg-blue-600 font-bold">Enviar instruções</button></form>}<Link to="/login" className="mt-5 block text-center text-sm text-cyan-300">Voltar ao login</Link></Shell>;
}

export function ResetPassword() {
    const [params] = useSearchParams(); const navigate = useNavigate(); const [password, setPassword] = useState("");
    async function submit(e: React.FormEvent) { e.preventDefault(); try { await Api.post("/users/password/reset/confirm/", { uid: params.get("uid"), token: params.get("token"), new_password: password }); toast.success("Senha redefinida."); navigate("/login"); } catch { toast.error("Link inválido ou expirado."); } }
    return <Shell title="Definir nova senha" subtitle="O link é individual e deixa de funcionar após o uso."><form onSubmit={submit} className="mt-6 space-y-4"><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nova senha (8+ caracteres)" className={field}/><button className="h-11 w-full rounded-xl bg-blue-600 font-bold">Redefinir senha</button></form></Shell>;
}

export function ChangePassword() {
    const navigate = useNavigate(); const [current, setCurrent] = useState(""); const [next, setNext] = useState("");
    const requirements = [
        { label: "Pelo menos 8 caracteres", met: next.length >= 8 },
        { label: "Uma letra maiúscula", met: /[A-Z]/.test(next) },
        { label: "Uma letra minúscula", met: /[a-z]/.test(next) },
        { label: "Um número", met: /\d/.test(next) },
        { label: "Um símbolo", met: /[^A-Za-z0-9]/.test(next) },
        { label: "Diferente da senha atual", met: Boolean(current && next && current !== next) },
    ];
    const passwordIsValid = requirements.every((requirement) => requirement.met);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!passwordIsValid) return;
        try {
            await Api.post("/users/password/change/", { current_password: current, new_password: next });
            clearTokens();
            toast.success("Senha alterada. Entre novamente.");
            navigate("/login", { replace: true });
        } catch (error) {
            const data = axios.isAxiosError<{ current_password?: string[]; new_password?: string[]; detail?: string }>(error)
                ? error.response?.data
                : undefined;
            toast.error(data?.current_password?.[0] || data?.new_password?.[0] || data?.detail || "Confira a senha atual e os requisitos da nova senha.");
        }
    }

    return <Shell title="Troque sua senha inicial" subtitle="Por segurança, defina uma senha pessoal antes de acessar o Cfit.">
        <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-xs font-bold text-slate-300">
                Senha atual
                <input required autoComplete="current-password" type="password" value={current} onChange={e=>setCurrent(e.target.value)} placeholder="Digite a senha recebida" className={`${field} mt-2`}/>
            </label>
            <label className="block text-xs font-bold text-slate-300">
                Nova senha
                <input required minLength={8} autoComplete="new-password" type="password" value={next} onChange={e=>setNext(e.target.value)} placeholder="Crie uma senha pessoal" className={`${field} mt-2`}/>
            </label>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4" aria-live="polite">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Sua nova senha precisa ter</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {requirements.map((requirement) => (
                        <li key={requirement.label} className={`flex items-center gap-2 text-xs font-semibold transition ${requirement.met ? "text-emerald-300" : "text-slate-400"}`}>
                            {requirement.met ? <Check size={15} aria-hidden="true" /> : <Circle size={12} aria-hidden="true" />}
                            {requirement.label}
                        </li>
                    ))}
                </ul>
            </div>
            <button disabled={!passwordIsValid} className="h-11 w-full rounded-xl bg-blue-600 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">Alterar e entrar novamente</button>
        </form>
    </Shell>;
}
