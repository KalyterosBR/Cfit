import { Card } from "@/components/ui/card";

import HomeHeader from "@/features/auth/components/HomeHeader";
import HomeHero from "@/features/auth/components/HomeHero";
import LoginForm from "@/features/auth/components/LoginForm";
import LoginHeader from "@/features/auth/components/LoginHeader";


export default function Login() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            <HomeHeader />

            <section className="relative overflow-hidden">
                <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="absolute -right-40 top-40 h-[32rem] w-[32rem] rounded-full bg-cyan-400/10 blur-3xl" />

                <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-16 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr]">
                    <HomeHero />

                    <div
                        id="login"
                        className="flex justify-center lg:justify-end"
                    >
                        <Card className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white/90 p-10 shadow-2xl backdrop-blur-xl">
                            <LoginHeader />

                            <LoginForm />
                        </Card>
                    </div>
                </div>
            </section>
        </main>
    );
}