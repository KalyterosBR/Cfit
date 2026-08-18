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
                    <div className="absolute -left-56 top-10 h-[34rem] w-[34rem] rounded-full bg-blue-500/[0.055] blur-[120px]" />

                    <div className="absolute -right-52 top-6 h-[38rem] w-[38rem] rounded-full bg-cyan-400/[0.075] blur-[130px]" />

                    <div className="absolute left-[42%] top-[26%] h-[26rem] w-[26rem] rounded-full bg-blue-400/[0.025] blur-[100px]" />


                    {/* ÁREA VISUAL DO LOGIN */}
                    <div className="absolute -right-52 top-1/2 hidden h-[42rem] w-[48rem] -translate-y-1/2 rounded-[5rem] border border-blue-200/20 bg-gradient-to-br from-blue-50/20 via-white/10 to-cyan-50/20 lg:block" />


                    {/* LUZ ATRÁS DO LOGIN */}
                    <div className="absolute right-[5%] top-1/2 hidden h-[32rem] w-[32rem] -translate-y-1/2 rounded-full bg-blue-500/[0.055] blur-[110px] lg:block" />

                    <div className="absolute right-[-4%] top-[28%] hidden h-[26rem] w-[26rem] rounded-full bg-cyan-400/[0.06] blur-[110px] lg:block" />


                    {/* LINHAS */}
                    <div className="absolute right-[1%] top-[22%] hidden h-px w-[30rem] rotate-[-17deg] bg-gradient-to-r from-transparent via-blue-500/15 to-transparent lg:block" />

                    <div className="absolute -right-[5%] top-[30%] hidden h-px w-[36rem] rotate-[-17deg] bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent lg:block" />


                    {/* TRANSIÇÃO */}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-white" />
                </div>


                {/* CONTEÚDO PRINCIPAL */}
                <div
                    className="
                        relative z-10
                        mx-auto grid
                        w-full
                        max-w-[1440px]
                        items-center
                        gap-10
                        px-6
                        py-10
                        lg:min-h-[610px]
                        lg:grid-cols-[minmax(0,1.25fr)_minmax(410px,0.75fr)]
                        lg:gap-12
                        lg:py-10
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
                        className="relative flex min-w-0 justify-center lg:-translate-y-2 lg:justify-end"
                    >
                        {/* GLOW */}
                        <div className="pointer-events-none absolute right-2 top-1/2 h-[26rem] w-[26rem] -translate-y-1/2 rounded-full bg-blue-600/[0.09] blur-[115px]" />

                        <div className="pointer-events-none absolute -right-14 top-[15%] h-56 w-56 rounded-full bg-cyan-400/[0.065] blur-[95px]" />


                        {/* CARD LOGIN */}
                        <Card
                            className="
                                relative
                                w-full
                                max-w-[430px]
                                overflow-hidden
                                rounded-[2rem]
                                border
                                border-blue-400/[0.12]
                                bg-[#081426]
                                p-0
                                shadow-[0_35px_80px_-42px_rgba(15,23,42,0.45)]
                                ring-1
                                ring-white/[0.03]
                            "
                        >
                            {/* LINHA SUPERIOR */}
                            <div className="h-[2px] w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />


                            {/* LUZ INTERNA */}
                            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-600/[0.11] blur-3xl" />

                            <div className="pointer-events-none absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-cyan-400/[0.07] blur-3xl" />


                            {/* GRADE */}
                            <div
                                className="
                                    pointer-events-none
                                    absolute inset-0
                                    opacity-[0.02]
                                    [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)]
                                    [background-size:36px_36px]
                                "
                            />


                            {/* CONTEÚDO */}
                            <div className="relative z-10 px-8 py-8 sm:px-9 sm:py-9">
                                <LoginHeader />


                                {/* DIVISOR */}
                                <div className="my-7 h-px bg-gradient-to-r from-white/[0.10] via-white/[0.12] to-transparent" />


                                <LoginForm />
                            </div>
                        </Card>
                    </div>
                </div>
            </section>


            <HomeFeatures />

            <HomeBenefits />

            <HomeSystem />

            <HomeAccess />

            <HomeFooter />
        </main>
    );
}