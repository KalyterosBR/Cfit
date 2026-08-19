import {
    useCallback,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
    ArrowRight,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import TurnstileWidget from "./TurnstileWidget";

import { login } from "../services/auth.service";
import { saveTokens } from "../services/token.service";


export default function LoginForm() {
    const navigate = useNavigate();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        turnstileToken,
        setTurnstileToken,
    ] = useState("");

    const [loading, setLoading] =
        useState(false);

    const [keepConnected, setKeepConnected] =
        useState(false);

    const [error, setError] =
        useState("");

    const [turnstileResetKey, setTurnstileResetKey] =
        useState(0);


    const handleTurnstileVerify =
        useCallback(
            (token: string) => {
                setTurnstileToken(
                    token,
                );

                setError("");
            },
            [],
        );


    const handleTurnstileExpire =
        useCallback(() => {
            setTurnstileToken("");
        }, []);


    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();


        if (
            !email.trim() ||
            !password
        ) {
            setError(
                "Informe seu e-mail e senha.",
            );

            return;
        }


        if (!turnstileToken) {
            setError(
                "Conclua a verificação de segurança.",
            );

            return;
        }


        try {
            setLoading(true);
            setError("");

            const data =
                await login({
                    email:
                        email.trim(),
                    password,
                    turnstile_token:
                        turnstileToken,
                });


            saveTokens(
                data.access,
                data.refresh,
                keepConnected,
            );


            navigate(
                "/dashboard",
                {
                    replace: true,
                },
            );
        } catch (error) {
            console.error(
                error,
            );


            setTurnstileToken("");
            setTurnstileResetKey(
                (current) =>
                    current + 1,
            );


            if (
                axios.isAxiosError(
                    error,
                ) &&
                error.response
                    ?.status === 401
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
        <form onSubmit={handleSubmit}>
            {/* E-MAIL */}
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">
                    E-mail
                </label>

                <div className="relative mt-1.5">
                    <Mail
                        size={16}
                        strokeWidth={2}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-300"
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
                        className="
                            h-[46px]
                            rounded-xl
                            border-white/[0.16]
                            bg-white/[0.085]
                            pl-11
                            pr-4
                            text-[13px]
                            font-medium
                            text-white
                            shadow-none
                            placeholder:text-slate-400
                            hover:border-white/[0.23]
                            hover:bg-white/[0.10]
                            focus-visible:border-cyan-400/70
                            focus-visible:bg-white/[0.11]
                            focus-visible:ring-2
                            focus-visible:ring-cyan-400/15

                            autofill:shadow-[inset_0_0_0_1000px_#223047]
                            autofill:[-webkit-text-fill-color:white]
                            autofill:caret-white
                        "
                    />
                </div>
            </div>


            {/* SENHA */}
            <div className="mt-3.5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">
                    Senha
                </label>

                <div className="relative mt-1.5">
                    <LockKeyhole
                        size={16}
                        strokeWidth={2}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-300"
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
                        className="
                            h-[46px]
                            rounded-xl
                            border-white/[0.16]
                            bg-white/[0.085]
                            px-11
                            text-[13px]
                            font-medium
                            text-white
                            shadow-none
                            placeholder:text-slate-400
                            hover:border-white/[0.23]
                            hover:bg-white/[0.10]
                            focus-visible:border-cyan-400/70
                            focus-visible:bg-white/[0.11]
                            focus-visible:ring-2
                            focus-visible:ring-cyan-400/15

                            autofill:shadow-[inset_0_0_0_1000px_#223047]
                            autofill:[-webkit-text-fill-color:white]
                            autofill:caret-white
                        "
                    />

                    <button
                        type="button"
                        onClick={() =>
                            setShowPassword(
                                (current) =>
                                    !current,
                            )
                        }
                        aria-label={
                            showPassword
                                ? "Ocultar senha"
                                : "Mostrar senha"
                        }
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/[0.06] hover:text-cyan-300"
                    >
                        {showPassword ? (
                            <EyeOff size={16} />
                        ) : (
                            <Eye size={16} />
                        )}
                    </button>
                </div>
            </div>


            {/* OPÇÕES */}
            <div className="mt-3.5 flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-slate-300">
                    <input
                        type="checkbox"
                        checked={keepConnected}
                        onChange={(event) =>
                            setKeepConnected(
                                event.target.checked,
                            )
                        }
                        disabled={loading}
                        className="h-3.5 w-3.5 cursor-pointer accent-blue-600"
                    />

                    Manter conectado
                </label>

                <button
                    type="button"
                    className="text-[11px] font-semibold text-blue-300 transition hover:text-cyan-300"
                >
                    Esqueci minha senha
                </button>
            </div>


            {/* TURNSTILE */}
            <div
                className="
                    mt-4
                    overflow-hidden
                    rounded-xl
                    border
                    border-white/[0.10]
                    bg-white/[0.04]
                    px-2
                    py-2
                "
            >
                <div className="flex items-center gap-2 px-1">
                    <ShieldCheck
                        size={13}
                        className="text-cyan-300"
                    />

                    <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Verificação de segurança
                    </span>
                </div>

                <div className="-my-1 mt-1">
                    <TurnstileWidget
                        onVerify={
                            handleTurnstileVerify
                        }
                        onExpire={
                            handleTurnstileExpire
                        }
                        resetKey={
                            turnstileResetKey
                        }
                    />
                </div>
            </div>


            {/* ERRO */}
            {error && (
                <div className="mt-3 rounded-xl border border-red-400/25 bg-red-400/[0.12] px-4 py-2.5 text-xs font-medium text-red-200">
                    {error}
                </div>
            )}


            {/* BOTÃO */}
            <Button
                type="submit"
                disabled={
                    loading ||
                    !turnstileToken
                }
                className="
                    group
                    mt-4
                    h-[46px]
                    w-full
                    rounded-xl
                    border-0
                    bg-gradient-to-r
                    from-blue-600
                    to-cyan-500
                    text-[13px]
                    font-bold
                    text-white
                    shadow-[0_14px_35px_-14px_rgba(37,99,235,0.8)]
                    transition-all
                    duration-300
                    hover:-translate-y-px
                    hover:from-blue-500
                    hover:to-cyan-400
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                "
            >
                {loading ? (
                    "Entrando..."
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        Acessar o Cfit

                        <ArrowRight
                            size={16}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </span>
                )}
            </Button>


            {/* RODAPÉ */}
            <p className="mt-3 text-center text-[9px] font-medium leading-4 text-slate-500">
                Gestão, performance e controle em um único ambiente.
            </p>
        </form>
    );
}
