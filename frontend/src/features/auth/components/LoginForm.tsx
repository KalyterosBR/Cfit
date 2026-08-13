import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    ArrowRight,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { login } from "../services/auth.service";
import { saveTokens } from "../services/token.service";


export default function LoginForm() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!email.trim() || !password) {
            setError("Informe seu e-mail e senha.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const data = await login({
                email: email.trim(),
                password,
            });

            saveTokens(
                data.access,
                data.refresh,
            );

            navigate("/dashboard", {
                replace: true,
            });
        } catch (error) {
            console.error(error);

            if (
                axios.isAxiosError(error) &&
                error.response?.status === 401
            ) {
                setError(
                    "E-mail ou senha incorretos.",
                );
            } else {
                setError(
                    "Não foi possível entrar. Tente novamente.",
                );
            }
        } finally {
            setLoading(false);
        }
    }


    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-5"
        >
            {/* E-MAIL */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    E-mail
                </label>

                <div className="relative">
                    <Mail
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500"
                    />

                    <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(event) =>
                            setEmail(
                                event.target.value,
                            )
                        }
                        autoComplete="email"
                        disabled={loading}
                        className="h-12 rounded-xl border-white/10 bg-white/[0.06] pl-11 text-white shadow-none placeholder:text-slate-600 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/20"
                    />
                </div>
            </div>


            {/* SENHA */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Senha
                </label>

                <div className="relative">
                    <LockKeyhole
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-500"
                    />

                    <Input
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value,
                            )
                        }
                        autoComplete="current-password"
                        disabled={loading}
                        className="h-12 rounded-xl border-white/10 bg-white/[0.06] px-11 text-white shadow-none placeholder:text-slate-600 focus-visible:border-cyan-400/60 focus-visible:ring-cyan-400/20"
                    />

                    <button
                        type="button"
                        onClick={() =>
                            setShowPassword(
                                (current) =>
                                    !current,
                            )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-cyan-400"
                        aria-label={
                            showPassword
                                ? "Ocultar senha"
                                : "Mostrar senha"
                        }
                    >
                        {showPassword ? (
                            <EyeOff size={17} />
                        ) : (
                            <Eye size={17} />
                        )}
                    </button>
                </div>
            </div>


            {/* ERRO */}
            {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-300">
                    {error}
                </div>
            )}


            {/* OPÇÕES */}
            <div className="flex items-center justify-between gap-4 text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-slate-400">
                    <input
                        type="checkbox"
                        disabled={loading}
                        className="h-4 w-4 accent-blue-600"
                    />

                    Lembrar-me
                </label>

                <button
                    type="button"
                    className="font-semibold text-blue-400 transition hover:text-cyan-400"
                >
                    Esqueci minha senha
                </button>
            </div>


            {/* BOTÃO */}
            <Button
                type="submit"
                disabled={loading}
                className="group h-12 w-full rounded-xl border-0 bg-gradient-to-r from-blue-600 to-cyan-500 font-bold text-white shadow-[0_12px_35px_-12px_rgba(37,99,235,0.8)] transition duration-300 hover:from-blue-500 hover:to-cyan-400"
            >
                {loading ? (
                    "Entrando..."
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        Acessar o Cfit

                        <ArrowRight
                            size={17}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </span>
                )}
            </Button>


            {/* RODAPÉ DO LOGIN */}
            <p className="pt-1 text-center text-[11px] leading-5 text-slate-600">
                Gestão, performance e controle em
                um único ambiente.
            </p>
        </form>
    );
}