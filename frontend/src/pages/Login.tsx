import { Card } from "@/components/ui/card";

import LoginHeader from "@/features/auth/components/LoginHeader";
import LoginForm from "@/features/auth/components/LoginForm";

export default function Login() {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100 p-6">
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-cyan-400/20 blur-3xl" />

            <Card className="relative z-10 w-full max-w-md rounded-3xl border border-white/40 bg-white/90 p-10 shadow-2xl backdrop-blur-xl">
                <LoginHeader />

                <LoginForm />
            </Card>
        </main>
    );
}