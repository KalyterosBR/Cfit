import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { KeyRound } from "lucide-react";
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
    async function submit(e: React.FormEvent) { e.preventDefault(); try { await Api.post("/users/password/change/", { current_password: current, new_password: next }); clearTokens(); toast.success("Senha alterada. Entre novamente."); navigate("/login", { replace: true }); } catch { toast.error("Confira a senha atual e os requisitos da nova senha."); } }
    return <Shell title="Troque sua senha inicial" subtitle="Por segurança, defina uma senha pessoal antes de acessar o Cfit."><form onSubmit={submit} className="mt-6 space-y-4"><input required type="password" value={current} onChange={e=>setCurrent(e.target.value)} placeholder="Senha atual" className={field}/><input required minLength={8} type="password" value={next} onChange={e=>setNext(e.target.value)} placeholder="Nova senha (8+ caracteres)" className={field}/><button className="h-11 w-full rounded-xl bg-blue-600 font-bold">Alterar e entrar novamente</button></form></Shell>;
}
