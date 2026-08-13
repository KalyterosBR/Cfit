import { Card } from "@/components/ui/card";

import HomeFeatures from "@/features/auth/components/HomeFeatures";
import HomeHeader from "@/features/auth/components/HomeHeader";
import HomeHero from "@/features/auth/components/HomeHero";
import LoginHeader from "@/features/auth/components/LoginHeader";
import LoginForm from "@/features/auth/components/LoginForm";
import HomeSystem from "@/features/auth/components/HomeSystem";
import HomeFooter from "@/features/auth/components/HomeFooter";


export default function Login() {
    return (
        <main className="min-h-screen bg-white">
            <HomeHeader />

            {/* HERO + LOGIN */}
            <section className="relative overflow-hidden bg-[#f8fafc]">
                {/* IDENTIDADE VISUAL DO FUNDO */}
                <div className="absolute inset-0">
                    <div className="absolute -left-48 top-20 h-[32rem] w-[32rem] rounded-full bg-blue-500/[0.07] blur-3xl" />

                    <div className="absolute -right-40 top-20 h-[34rem] w-[34rem] rounded-full bg-cyan-400/[0.08] blur-3xl" />

                    {/* LINHAS DE PERFORMANCE */}
                    <div className="absolute right-[8%] top-[18%] h-px w-72 rotate-[-18deg] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

                    <div className="absolute right-[2%] top-[24%] h-px w-96 rotate-[-18deg] bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent" />
                </div>

                <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr]">
                    <HomeHero />

                    {/* LOGIN */}
                    <div
                        id="login"
                        className="relative flex justify-center lg:justify-end"
                    >
                        {/* GLOW ATRÁS DO CARD */}
                        <div className="absolute right-10 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[90px]" />

                        <Card className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#050b1c] p-0 shadow-[0_35px_80px_-25px_rgba(2,6,23,0.55)]">
                            {/* LINHA SUPERIOR CFIT */}
                            <div className="h-[3px] w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />

                            {/* EFEITOS INTERNOS */}
                            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />

                            <div className="pointer-events-none absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

                            <div className="relative z-10 p-8 sm:p-10">
                                <LoginHeader />

                                <div className="mt-8 border-t border-white/10 pt-8">
                                    <LoginForm />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* RECURSOS */}
            <HomeFeatures />

            <HomeSystem />

            <HomeFooter />
        </main>
    );
}