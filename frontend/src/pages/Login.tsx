import { Card } from "@/components/ui/card";

import HomeAccess from "@/features/auth/components/HomeAccess";
import HomeBenefits from "@/features/auth/components/HomeBenefits";
import HomeFeatures from "@/features/auth/components/HomeFeatures";
import HomeFooter from "@/features/auth/components/HomeFooter";
import HomeHeader from "@/features/auth/components/HomeHeader";
import HomeHero from "@/features/auth/components/HomeHero";
import HomeSystem from "@/features/auth/components/HomeSystem";
import LoginForm from "@/features/auth/components/LoginForm";
import LoginHeader from "@/features/auth/components/LoginHeader";


export default function Login() {
    return (
        <main className="min-h-screen bg-white">
            <HomeHeader />


            {/* HERO + LOGIN */}
            <section className="relative isolate overflow-hidden bg-[#f8fafc]">
                {/* FUNDO */}
                <div className="pointer-events-none absolute inset-0">
                    {/* LUZ SUAVE ESQUERDA */}
                    <div className="absolute -left-56 top-16 h-[36rem] w-[36rem] rounded-full bg-blue-500/[0.06] blur-[120px]" />


                    {/* LUZ CIANO DIREITA */}
                    <div className="absolute -right-52 top-10 h-[40rem] w-[40rem] rounded-full bg-cyan-400/[0.08] blur-[130px]" />


                    {/* ATMOSFERA CENTRAL */}
                    <div className="absolute left-[42%] top-[30%] h-[28rem] w-[28rem] rounded-full bg-blue-400/[0.025] blur-[100px]" />


                    {/* ÁREA VISUAL DO LOGIN */}
                    <div className="absolute -right-48 top-1/2 hidden h-[44rem] w-[46rem] -translate-y-1/2 rounded-[4rem] border border-blue-200/30 bg-white/20 backdrop-blur-[2px] lg:block" />


                    {/* LINHAS DE MOVIMENTO */}
                    <div className="absolute right-[1%] top-[24%] hidden h-px w-[32rem] rotate-[-17deg] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent lg:block" />

                    <div className="absolute -right-[5%] top-[31%] hidden h-px w-[38rem] rotate-[-17deg] bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent lg:block" />


                    {/* FADE INFERIOR */}
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white/75" />
                </div>


                {/* CONTEÚDO PRINCIPAL */}
                <div
                    className="
                        relative z-10 mx-auto grid
                        min-h-[calc(100vh-76px)]
                        w-full max-w-[1440px]
                        items-center
                        gap-12
                        px-6
                        py-14
                        lg:grid-cols-[minmax(0,1.25fr)_minmax(390px,0.75fr)]
                        lg:gap-12
                        xl:px-10
                    "
                >
                    {/* HERO */}
                    <div className="relative z-10 min-w-0">
                        <HomeHero />
                    </div>


                    {/* LOGIN */}
                    <div
                        id="login"
                        className="relative flex min-w-0 justify-center lg:justify-end"
                    >
                        {/* GLOW EXTERNO */}
                        <div className="pointer-events-none absolute right-4 top-1/2 h-[24rem] w-[24rem] -translate-y-1/2 rounded-full bg-blue-600/14 blur-[110px]" />

                        <div className="pointer-events-none absolute -right-12 top-[18%] h-56 w-56 rounded-full bg-cyan-400/[0.08] blur-[90px]" />


                        {/* CARD LOGIN */}
                        <Card
                            className="
                                relative
                                w-full
                                max-w-[410px]
                                overflow-hidden
                                rounded-[2rem]
                                border border-white/10
                                bg-[#050b1c]
                                p-0
                                shadow-[0_28px_70px_-35px_rgba(15,23,42,0.35)]
                                ring-1 ring-slate-950/5
                            "
                        >
                            {/* LINHA SUPERIOR */}
                            <div className="h-[3px] w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />


                            {/* EFEITO AZUL INTERNO */}
                            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />


                            {/* EFEITO CIANO INTERNO */}
                            <div className="pointer-events-none absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />


                            {/* GRADE TECNOLÓGICA */}
                            <div
                                className="
                                    pointer-events-none
                                    absolute inset-0
                                    opacity-[0.03]
                                    [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)]
                                    [background-size:34px_34px]
                                "
                            />


                            {/* CONTEÚDO */}
                            <div className="relative z-10 p-8 sm:p-9">
                                <LoginHeader />

                                <div className="mt-8 border-t border-white/10 pt-8">
                                    <LoginForm />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>


            {/* GESTÃO CONECTADA */}
            <HomeFeatures />


            {/* BENEFÍCIOS */}
            <HomeBenefits />


            {/* SISTEMA */}
            <HomeSystem />


            {/* CONTROLE DE ACESSO */}
            <HomeAccess />


            {/* FOOTER */}
            <HomeFooter />
        </main>
    );
}