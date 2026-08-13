import {
    BarChart3,
    CalendarDays,
    CreditCard,
    Dumbbell,
    GraduationCap,
    Users,
} from "lucide-react";


const features = [
    {
        icon: Users,
        title: "Gestão de alunos",
        description:
            "Cadastros, informações e acompanhamento dos seus alunos em um só lugar.",
    },
    {
        icon: CreditCard,
        title: "Financeiro",
        description:
            "Acompanhe pagamentos, pendências e a movimentação financeira da academia.",
    },
    {
        icon: Dumbbell,
        title: "Planos e matrículas",
        description:
            "Organize planos, matrículas e o vínculo de cada aluno com a academia.",
    },
    {
        icon: GraduationCap,
        title: "Treinos",
        description:
            "Estruture o acompanhamento dos treinos e a evolução dos seus alunos.",
    },
    {
        icon: CalendarDays,
        title: "Agenda",
        description:
            "Centralize compromissos, atividades e a rotina da sua academia.",
    },
    {
        icon: BarChart3,
        title: "Relatórios",
        description:
            "Visualize indicadores importantes e tome decisões com mais clareza.",
    },
];


export default function HomeFeatures() {
    return (
        <section
            id="recursos"
            className="border-t border-slate-200 bg-white py-24"
        >
            <div className="mx-auto max-w-7xl px-6">
                <div className="mx-auto max-w-2xl text-center">
                    <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                        Recursos
                    </span>

                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                        Tudo para gerenciar sua academia
                    </h2>

                    <p className="mt-4 text-lg leading-8 text-slate-600">
                        Centralize sua operação e tenha uma visão mais
                        organizada do seu negócio.
                    </p>
                </div>

                <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => {
                        const Icon = feature.icon;

                        return (
                            <div
                                key={feature.title}
                                className="group rounded-2xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                                    <Icon className="h-6 w-6" />
                                </div>

                                <h3 className="mt-5 text-lg font-semibold text-slate-950">
                                    {feature.title}
                                </h3>

                                <p className="mt-2 leading-7 text-slate-600">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}