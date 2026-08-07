import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginForm() {
    return (
        <form className="mt-8 space-y-5">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                    E-mail
                </label>

                <Input
                    type="email"
                    placeholder="Digite seu e-mail"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                    Senha
                </label>

                <Input
                    type="password"
                    placeholder="Digite sua senha"
                />
            </div>

            <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                    <input
                        type="checkbox"
                        className="rounded"
                    />

                    Lembrar-me
                </label>

                <button
                    type="button"
                    className="font-medium text-blue-600 hover:text-blue-700"
                >
                    Esqueci minha senha
                </button>
            </div>

            <Button
                className="h-11 w-full"
            >
                Entrar
            </Button>
        </form>
    );
}