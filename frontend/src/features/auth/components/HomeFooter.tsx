import { ArrowUpRight } from "lucide-react";

import Logo from "@/components/branding/Logo";


export default function HomeFooter() {
    function scrollToLogin() {
        const element = document.getElementById("login");

        if (!element) {
            return;
        }

        const startPosition = window.scrollY;
        const targetPosition =
            element.getBoundingClientRect().top +
            window.scrollY;

        const distance = targetPosition - startPosition;
        const duration = 700;

        let startTime: number | null = null;

        function animation(currentTime: number) {
            if (startTime === null) {
                startTime = currentTime;
            }

            const elapsed = currentTime - startTime;

            const progress = Math.min(
                elapsed / duration,
                1,
            );

            const ease =
                progress < 0.5
                    ? 2 * progress * progress
                    : 1 -
                    Math.pow(
                        -2 * progress + 2,
                        2,
                    ) /
                    2;

            window.scrollTo(
                0,
                startPosition + distance * ease,
            );

            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }

        requestAnimationFrame(animation);
    }


    return (
        <>
            {/* CHAMADA FINAL */}
            <section className="bg-white py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="relative overflow-hidden rounded-3xl bg-blue-600 px-8 py-16 text-center shadow-2xl md:px-16">
                        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

                        <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

                        <div className="relative z-10 mx-auto max-w-3xl">
                            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                                Simplifique a gestão da sua academia.
                            </h2>

                            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100">
                                Tenha alunos, planos, matrículas,
                                financeiro e informações importantes
                                organizados em um só lugar.
                            </p>

                            <button
                                type="button"
                                onClick={scrollToLogin}
                                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-600 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                Acessar o Cfit

                                <ArrowUpRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* RODAPÉ */}
            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
                    <div>
                        <Logo width={110} />

                        <p className="mt-3 text-sm text-slate-500">
                            Gestão inteligente para academias.
                        </p>
                    </div>

                    <p className="text-sm text-slate-500">
                        © 2026 Cfit Gestão. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </>
    );
}