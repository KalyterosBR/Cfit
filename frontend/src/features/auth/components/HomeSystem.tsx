import {
    useEffect,
    useState,
    type ReactNode,
} from "react";

import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    DollarSign,
    DoorOpen,
    Dumbbell,
    Plus,
    ScanFace,
    Search,
    TrendingUp,
    UserPlus,
    Users,
    WalletCards,
} from "lucide-react";

import RecentPayments from "@/components/dashboard/RecentPayments";
import RevenueChart from "@/components/dashboard/RevenueChart";
import StatCard from "@/components/dashboard/StatCard";


const students = [
    {
        name: "Carlos Henrique",
        cpf: "123.456.789-00",
        plan: "Plano Mensal",
        status: "Ativo",
        checkin: "Hoje, 08:42",
    },
    {
        name: "Mariana Souza",
        cpf: "987.654.321-00",
        plan: "Plano Trimestral",
        status: "Ativo",
        checkin: "Hoje, 07:15",
    },
    {
        name: "Lucas Almeida",
        cpf: "456.789.123-00",
        plan: "Plano Mensal",
        status: "Ativo",
        checkin: "Ontem, 18:36",
    },
    {
        name: "Fernanda Lima",
        cpf: "789.123.456-00",
        plan: "Plano Semestral",
        status: "Inativo",
        checkin: "12/08/2026",
    },
];


const charges = [
    {
        student: "Carlos Henrique",
        plan: "Plano Mensal",
        dueDate: "10/08/2026",
        value: "R$ 119,90",
        status: "Pago",
    },
    {
        student: "Mariana Souza",
        plan: "Plano Trimestral",
        dueDate: "12/08/2026",
        value: "R$ 299,90",
        status: "Pago",
    },
    {
        student: "Lucas Almeida",
        plan: "Plano Mensal",
        dueDate: "18/08/2026",
        value: "R$ 119,90",
        status: "Pendente",
    },
    {
        student: "Fernanda Lima",
        plan: "Plano Semestral",
        dueDate: "05/08/2026",
        value: "R$ 549,90",
        status: "Atrasado",
    },
];


const appointments = [
    {
        time: "07:00",
        title: "Avaliação física",
        student: "Carlos Henrique",
        responsible: "Rafael Martins",
        type: "Avaliação",
        status: "Concluído",
    },
    {
        time: "09:30",
        title: "Treino acompanhado",
        student: "Mariana Souza",
        responsible: "Juliana Costa",
        type: "Treino",
        status: "Em andamento",
    },
    {
        time: "14:00",
        title: "Avaliação física",
        student: "Lucas Almeida",
        responsible: "Rafael Martins",
        type: "Avaliação",
        status: "Agendado",
    },
    {
        time: "18:30",
        title: "Treino experimental",
        student: "Fernanda Lima",
        responsible: "Juliana Costa",
        type: "Experimental",
        status: "Agendado",
    },
];


const plans = [
    {
        name: "Plano Mensal",
        duration: "1 mês",
        value: "R$ 119,90",
        students: 486,
        status: "Ativo",
    },
    {
        name: "Plano Trimestral",
        duration: "3 meses",
        value: "R$ 299,90",
        students: 328,
        status: "Ativo",
    },
    {
        name: "Plano Semestral",
        duration: "6 meses",
        value: "R$ 549,90",
        students: 274,
        status: "Ativo",
    },
    {
        name: "Plano Anual",
        duration: "12 meses",
        value: "R$ 999,90",
        students: 160,
        status: "Ativo",
    },
];


const accessLogs = [
    {
        time: "09:18",
        student: "Carlos Henrique",
        method: "Reconhecimento facial",
        access: "Liberado",
    },
    {
        time: "09:14",
        student: "Mariana Souza",
        method: "Identificador",
        access: "Liberado",
    },
    {
        time: "09:07",
        student: "Lucas Almeida",
        method: "Reconhecimento facial",
        access: "Liberado",
    },
    {
        time: "08:56",
        student: "Fernanda Lima",
        method: "Identificador",
        access: "Bloqueado",
    },
];


const slides = [
    {
        id: "dashboard",
        label: "Dashboard",
    },
    {
        id: "students",
        label: "Alunos",
    },
    {
        id: "financial",
        label: "Financeiro",
    },
    {
        id: "agenda",
        label: "Agenda",
    },
    {
        id: "plans",
        label: "Planos e Matrículas",
    },
    {
        id: "access",
        label: "Controle de Acesso",
    },
];


type SlideDirection = 1 | -1;


function SlideContent({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="h-full w-full overflow-hidden">
            <div
                className="
                    h-full
                    w-full
                    origin-top-left
                    md:h-auto
                    md:w-[111.111%]
                    md:scale-90
                "
            >
                {children}
            </div>
        </div>
    );
}


export default function HomeSystem() {
    const [activeSlide, setActiveSlide] =
        useState(0);

    const [
        incomingSlide,
        setIncomingSlide,
    ] = useState<number | null>(null);

    const [direction, setDirection] =
        useState<SlideDirection>(1);


    const isTransitioning =
        incomingSlide !== null;


    /*
     * AUTOPLAY
     */
    useEffect(() => {
        if (isTransitioning) {
            return;
        }

        const timer =
            window.setTimeout(() => {
                const next =
                    activeSlide ===
                        slides.length - 1
                        ? 0
                        : activeSlide + 1;

                startTransition(
                    next,
                    1,
                );
            }, 6000);

        return () => {
            window.clearTimeout(
                timer,
            );
        };
    }, [
        activeSlide,
        isTransitioning,
    ]);


    /*
     * FINALIZA A TRANSIÇÃO
     *
     * Não dependemos mais do onAnimationEnd.
     * Após os mesmos 700ms da animação CSS,
     * a nova tela passa a ser a tela ativa.
     */
    useEffect(() => {
        if (
            incomingSlide === null
        ) {
            return;
        }

        const transitionTimer =
            window.setTimeout(() => {
                setActiveSlide(
                    incomingSlide,
                );

                setIncomingSlide(
                    null,
                );
            }, 700);

        return () => {
            window.clearTimeout(
                transitionTimer,
            );
        };
    }, [incomingSlide]);


    function startTransition(
        targetIndex: number,
        requestedDirection?: SlideDirection,
    ) {
        if (
            targetIndex ===
            activeSlide ||
            isTransitioning
        ) {
            return;
        }

        const resolvedDirection =
            requestedDirection ??
            (targetIndex >
                activeSlide
                ? 1
                : -1);

        setDirection(
            resolvedDirection,
        );

        setIncomingSlide(
            targetIndex,
        );
    }


    function previousSlide() {
        const previous =
            activeSlide === 0
                ? slides.length - 1
                : activeSlide - 1;

        startTransition(
            previous,
            -1,
        );
    }


    function nextSlide() {
        const next =
            activeSlide ===
                slides.length - 1
                ? 0
                : activeSlide + 1;

        startTransition(
            next,
            1,
        );
    }


    function goToSlide(
        index: number,
    ) {
        if (
            index === activeSlide
        ) {
            return;
        }

        const forwardDistance =
            (
                index -
                activeSlide +
                slides.length
            ) %
            slides.length;

        const backwardDistance =
            (
                activeSlide -
                index +
                slides.length
            ) %
            slides.length;

        startTransition(
            index,
            forwardDistance <=
                backwardDistance
                ? 1
                : -1,
        );
    }


    function getFinancialStatusStyle(
        status: string,
    ) {
        if (status === "Pago") {
            return {
                className:
                    "bg-emerald-50 text-emerald-600",
                icon: (
                    <CheckCircle2
                        size={13}
                    />
                ),
            };
        }

        if (
            status === "Pendente"
        ) {
            return {
                className:
                    "bg-amber-50 text-amber-600",
                icon: (
                    <WalletCards
                        size={13}
                    />
                ),
            };
        }

        return {
            className:
                "bg-red-50 text-red-600",
            icon: (
                <AlertCircle
                    size={13}
                />
            ),
        };
    }


    function getAgendaStatusStyle(
        status: string,
    ) {
        if (
            status === "Concluído"
        ) {
            return "bg-emerald-50 text-emerald-600";
        }

        if (
            status ===
            "Em andamento"
        ) {
            return "bg-blue-50 text-blue-600";
        }

        return "bg-slate-100 text-slate-600";
    }


    const commonSlide =
        "h-[560px] overflow-hidden rounded-2xl bg-slate-100 p-4 sm:h-[580px] sm:p-5 md:h-[540px] md:p-6";


    function renderSlide(
        index: number,
    ) {
        /*
         * DASHBOARD
         */
        if (index === 0) {
            return (
                <div
                    className={
                        commonSlide
                    }
                >
                    <SlideContent>
                        {/* MOBILE */}
                        <div className="h-full md:hidden">
                            <div>
                                <p className="text-xs text-slate-500">
                                    Visão geral da sua academia.
                                </p>

                                <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                                    Dashboard
                                </h3>
                            </div>


                            <div className="mt-5 grid grid-cols-2 gap-3">
                                {[
                                    {
                                        title:
                                            "Alunos ativos",
                                        value:
                                            "1.248",
                                        icon: Users,
                                    },
                                    {
                                        title:
                                            "Receita",
                                        value:
                                            "R$ 89 mil",
                                        icon: DollarSign,
                                    },
                                    {
                                        title:
                                            "Check-ins",
                                        value:
                                            "352",
                                        icon: Dumbbell,
                                    },
                                    {
                                        title:
                                            "Crescimento",
                                        value:
                                            "+12%",
                                        icon: TrendingUp,
                                    },
                                ].map(
                                    (
                                        item,
                                    ) => {
                                        const Icon =
                                            item.icon;

                                        return (
                                            <div
                                                key={
                                                    item.title
                                                }
                                                className="rounded-2xl border border-slate-200 bg-white p-4"
                                            >
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                    <Icon
                                                        size={
                                                            18
                                                        }
                                                    />
                                                </div>

                                                <p className="mt-4 text-[11px] text-slate-500">
                                                    {
                                                        item.title
                                                    }
                                                </p>

                                                <p className="mt-1 text-lg font-bold text-slate-950">
                                                    {
                                                        item.value
                                                    }
                                                </p>
                                            </div>
                                        );
                                    },
                                )}
                            </div>


                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-950">
                                            Receita mensal
                                        </p>

                                        <p className="mt-1 text-[11px] text-slate-500">
                                            Evolução dos últimos meses
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                                        +8%
                                    </span>
                                </div>

                                <div className="relative mt-6 h-24 overflow-hidden">
                                    <svg
                                        viewBox="0 0 300 90"
                                        className="h-full w-full"
                                        preserveAspectRatio="none"
                                    >
                                        <defs>
                                            <linearGradient
                                                id="mobileRevenue"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#3b82f6"
                                                    stopOpacity="0.25"
                                                />

                                                <stop
                                                    offset="100%"
                                                    stopColor="#3b82f6"
                                                    stopOpacity="0"
                                                />
                                            </linearGradient>
                                        </defs>

                                        <path
                                            d="M0 72 C35 58, 55 66, 88 48 S145 54, 176 36 S240 36, 300 15"
                                            fill="none"
                                            stroke="#2563eb"
                                            strokeWidth="3"
                                        />

                                        <path
                                            d="M0 72 C35 58, 55 66, 88 48 S145 54, 176 36 S240 36, 300 15 L300 90 L0 90 Z"
                                            fill="url(#mobileRevenue)"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>


                        {/* DESKTOP */}
                        <div className="hidden md:block">
                            <div className="mb-5">
                                <p className="text-sm text-slate-500">
                                    Visão geral da sua academia.
                                </p>

                                <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                                    Dashboard
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <StatCard
                                    title="Alunos ativos"
                                    value="1.248"
                                    icon={
                                        <Users
                                            size={
                                                28
                                            }
                                        />
                                    }
                                    description="+12 este mês"
                                />

                                <StatCard
                                    title="Receita mensal"
                                    value="R$ 89.250"
                                    icon={
                                        <DollarSign
                                            size={
                                                28
                                            }
                                        />
                                    }
                                    description="+8% em relação ao mês anterior"
                                />

                                <StatCard
                                    title="Check-ins hoje"
                                    value="352"
                                    icon={
                                        <Dumbbell
                                            size={
                                                28
                                            }
                                        />
                                    }
                                    description="Até o momento"
                                />

                                <StatCard
                                    title="Crescimento"
                                    value="+12%"
                                    icon={
                                        <TrendingUp
                                            size={
                                                28
                                            }
                                        />
                                    }
                                    description="Últimos 30 dias"
                                />
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
                                <div className="xl:col-span-2">
                                    <RevenueChart />
                                </div>

                                <RecentPayments />
                            </div>
                        </div>
                    </SlideContent>
                </div>
            );
        }


        /*
         * ALUNOS
         */
        if (index === 1) {
            return (
                <div
                    className={
                        commonSlide
                    }
                >
                    <SlideContent>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs text-slate-500 sm:text-sm">
                                    Gestão de alunos
                                </p>

                                <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                                    Alunos
                                </h3>

                                <p className="mt-1.5 text-xs text-slate-500 md:mt-2 md:text-sm">
                                    Cadastros, planos
                                    e situação em uma
                                    única visão.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="hidden h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm sm:inline-flex"
                            >
                                <UserPlus
                                    size={17}
                                />

                                Novo aluno
                            </button>

                            <button
                                type="button"
                                aria-label="Novo aluno"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white sm:hidden"
                            >
                                <UserPlus
                                    size={17}
                                />
                            </button>
                        </div>


                        <div className="mt-4 grid grid-cols-3 gap-2.5 md:mt-5 md:gap-4">
                            {[
                                [
                                    "Total",
                                    "1.384",
                                ],
                                [
                                    "Ativos",
                                    "1.248",
                                ],
                                [
                                    "Novos",
                                    "+32",
                                ],
                            ].map(
                                ([
                                    title,
                                    value,
                                ]) => (
                                    <div
                                        key={
                                            title
                                        }
                                        className="rounded-xl border border-slate-200 bg-white p-3 md:rounded-2xl md:p-5"
                                    >
                                        <p className="text-[10px] text-slate-500 md:text-sm">
                                            {
                                                title
                                            }
                                        </p>

                                        <p className="mt-1 text-lg font-bold text-slate-950 md:mt-2 md:text-2xl">
                                            {
                                                value
                                            }
                                        </p>
                                    </div>
                                ),
                            )}
                        </div>


                        {/* MOBILE */}
                        <div className="mt-4 md:hidden">
                            <div className="relative">
                                <Search
                                    size={15}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    placeholder="Buscar aluno..."
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none"
                                />
                            </div>


                            <div className="mt-3 space-y-2">
                                {students
                                    .slice(
                                        0,
                                        3,
                                    )
                                    .map(
                                        (
                                            student,
                                        ) => (
                                            <div
                                                key={
                                                    student.cpf
                                                }
                                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                                                        {student.name.charAt(
                                                            0,
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-semibold text-slate-950">
                                                            {
                                                                student.name
                                                            }
                                                        </p>

                                                        <p className="mt-1 truncate text-[10px] text-slate-500">
                                                            {
                                                                student.plan
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-600">
                                                    {
                                                        student.status
                                                    }
                                                </span>
                                            </div>
                                        ),
                                    )}
                            </div>
                        </div>


                        {/* DESKTOP */}
                        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
                            <div className="border-b border-slate-200 p-4">
                                <div className="relative max-w-md">
                                    <Search
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Buscar por nome ou CPF..."
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                            {[
                                                "Aluno",
                                                "CPF",
                                                "Plano",
                                                "Status",
                                                "Último check-in",
                                            ].map(
                                                (
                                                    heading,
                                                ) => (
                                                    <th
                                                        key={
                                                            heading
                                                        }
                                                        className="px-5 py-3 font-semibold"
                                                    >
                                                        {
                                                            heading
                                                        }
                                                    </th>
                                                ),
                                            )}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {students.map(
                                            (
                                                student,
                                            ) => (
                                                <tr
                                                    key={
                                                        student.cpf
                                                    }
                                                    className="border-b border-slate-100 last:border-b-0"
                                                >
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                                                                {student.name.charAt(
                                                                    0,
                                                                )}
                                                            </div>

                                                            <span className="font-semibold text-slate-950">
                                                                {
                                                                    student.name
                                                                }
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-3 text-sm text-slate-500">
                                                        {
                                                            student.cpf
                                                        }
                                                    </td>

                                                    <td className="px-5 py-3 text-sm text-slate-600">
                                                        {
                                                            student.plan
                                                        }
                                                    </td>

                                                    <td className="px-5 py-3">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${student.status ===
                                                                    "Ativo"
                                                                    ? "bg-emerald-50 text-emerald-600"
                                                                    : "bg-slate-100 text-slate-500"
                                                                }`}
                                                        >
                                                            {
                                                                student.status
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-3 text-sm text-slate-500">
                                                        {
                                                            student.checkin
                                                        }
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </SlideContent>
                </div>
            );
        }


        /*
         * FINANCEIRO
         */
        if (index === 2) {
            return (
                <div
                    className={
                        commonSlide
                    }
                >
                    <SlideContent>
                        <div>
                            <p className="text-xs text-slate-500 md:text-sm">
                                Controle financeiro
                            </p>

                            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                                Financeiro
                            </h3>

                            <p className="mt-1.5 text-xs text-slate-500 md:mt-2 md:text-sm">
                                Recebimentos,
                                pendências e
                                inadimplência.
                            </p>
                        </div>


                        <div className="mt-4 grid grid-cols-2 gap-2.5 md:mt-5 md:grid-cols-4 md:gap-4">
                            {[
                                [
                                    "Receita",
                                    "R$ 89.250",
                                ],
                                [
                                    "Recebido",
                                    "R$ 82.430",
                                ],
                                [
                                    "Pendente",
                                    "R$ 4.380",
                                ],
                                [
                                    "Em atraso",
                                    "R$ 2.440",
                                ],
                            ].map(
                                ([
                                    title,
                                    value,
                                ]) => (
                                    <div
                                        key={
                                            title
                                        }
                                        className="rounded-xl border border-slate-200 bg-white p-3 md:rounded-2xl md:p-5"
                                    >
                                        <p className="text-[10px] text-slate-500 md:text-sm">
                                            {
                                                title
                                            }
                                        </p>

                                        <p className="mt-1 text-base font-bold text-slate-950 md:mt-2 md:text-2xl">
                                            {
                                                value
                                            }
                                        </p>
                                    </div>
                                ),
                            )}
                        </div>


                        {/* MOBILE */}
                        <div className="mt-4 space-y-2 md:hidden">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                Cobranças recentes
                            </p>

                            {charges
                                .slice(
                                    0,
                                    3,
                                )
                                .map(
                                    (
                                        charge,
                                    ) => {
                                        const status =
                                            getFinancialStatusStyle(
                                                charge.status,
                                            );

                                        return (
                                            <div
                                                key={`${charge.student}-${charge.dueDate}`}
                                                className="rounded-xl border border-slate-200 bg-white p-3"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-semibold text-slate-950">
                                                            {
                                                                charge.student
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-[10px] text-slate-500">
                                                            {
                                                                charge.plan
                                                            }
                                                        </p>
                                                    </div>

                                                    <p className="shrink-0 text-xs font-bold text-slate-950">
                                                        {
                                                            charge.value
                                                        }
                                                    </p>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-[10px] text-slate-400">
                                                        Venc.{" "}
                                                        {
                                                            charge.dueDate
                                                        }
                                                    </span>

                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${status.className}`}
                                                    >
                                                        {
                                                            status.icon
                                                        }

                                                        {
                                                            charge.status
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                        </div>


                        {/* DESKTOP */}
                        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
                            <div className="flex items-center justify-between border-b border-slate-200 p-4">
                                <div className="relative w-full max-w-md">
                                    <Search
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Buscar aluno ou plano..."
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none"
                                    />
                                </div>

                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Cobranças recentes
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                            {[
                                                "Aluno",
                                                "Plano",
                                                "Vencimento",
                                                "Valor",
                                                "Status",
                                            ].map(
                                                (
                                                    heading,
                                                ) => (
                                                    <th
                                                        key={
                                                            heading
                                                        }
                                                        className="px-5 py-3 font-semibold"
                                                    >
                                                        {
                                                            heading
                                                        }
                                                    </th>
                                                ),
                                            )}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {charges.map(
                                            (
                                                charge,
                                            ) => {
                                                const status =
                                                    getFinancialStatusStyle(
                                                        charge.status,
                                                    );

                                                return (
                                                    <tr
                                                        key={`${charge.student}-${charge.dueDate}`}
                                                        className="border-b border-slate-100 last:border-b-0"
                                                    >
                                                        <td className="px-5 py-3 font-semibold text-slate-950">
                                                            {
                                                                charge.student
                                                            }
                                                        </td>

                                                        <td className="px-5 py-3 text-sm text-slate-600">
                                                            {
                                                                charge.plan
                                                            }
                                                        </td>

                                                        <td className="px-5 py-3 text-sm text-slate-500">
                                                            {
                                                                charge.dueDate
                                                            }
                                                        </td>

                                                        <td className="px-5 py-3 font-semibold text-slate-950">
                                                            {
                                                                charge.value
                                                            }
                                                        </td>

                                                        <td className="px-5 py-3">
                                                            <span
                                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                                                            >
                                                                {
                                                                    status.icon
                                                                }

                                                                {
                                                                    charge.status
                                                                }
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </SlideContent>
                </div>
            );
        }


        /*
         * AGENDA
         */
        if (index === 3) {
            return (
                <div
                    className={
                        commonSlide
                    }
                >
                    <SlideContent>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs text-slate-500 md:text-sm">
                                    Rotina da academia
                                </p>

                                <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                                    Agenda
                                </h3>

                                <p className="mt-1.5 text-xs text-slate-500 md:mt-2 md:text-sm">
                                    Avaliações, treinos e compromissos.
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Novo agendamento"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white md:hidden"
                            >
                                <Plus
                                    size={17}
                                />
                            </button>

                            <button
                                type="button"
                                className="hidden h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm md:inline-flex"
                            >
                                <Plus
                                    size={17}
                                />

                                Novo agendamento
                            </button>
                        </div>


                        <div className="mt-4 grid grid-cols-3 gap-2.5 md:mt-5 md:gap-4">
                            {[
                                [
                                    "Hoje",
                                    "12",
                                ],
                                [
                                    "Concluídos",
                                    "5",
                                ],
                                [
                                    "Próximo",
                                    "14:00",
                                ],
                            ].map(
                                ([
                                    title,
                                    value,
                                ]) => (
                                    <div
                                        key={
                                            title
                                        }
                                        className="rounded-xl border border-slate-200 bg-white p-3 md:rounded-2xl md:p-5"
                                    >
                                        <p className="text-[10px] text-slate-500 md:text-sm">
                                            {
                                                title
                                            }
                                        </p>

                                        <p className="mt-1 text-lg font-bold text-slate-950 md:mt-2 md:text-2xl">
                                            {
                                                value
                                            }
                                        </p>
                                    </div>
                                ),
                            )}
                        </div>


                        {/* MOBILE */}
                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white md:hidden">
                            <div className="border-b border-slate-200 px-3 py-3">
                                <p className="text-xs font-semibold text-slate-950">
                                    Agenda de hoje
                                </p>

                                <p className="mt-1 text-[10px] text-slate-500">
                                    Segunda-feira,
                                    17 de agosto
                                </p>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {appointments
                                    .slice(
                                        0,
                                        3,
                                    )
                                    .map(
                                        (
                                            appointment,
                                        ) => (
                                            <div
                                                key={`${appointment.time}-${appointment.student}`}
                                                className="flex items-center gap-3 px-3 py-3"
                                            >
                                                <div className="w-11 shrink-0">
                                                    <p className="text-xs font-bold text-blue-600">
                                                        {
                                                            appointment.time
                                                        }
                                                    </p>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-slate-950">
                                                        {
                                                            appointment.title
                                                        }
                                                    </p>

                                                    <p className="mt-1 truncate text-[10px] text-slate-500">
                                                        {
                                                            appointment.student
                                                        }
                                                    </p>
                                                </div>

                                                <span
                                                    className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-semibold ${getAgendaStatusStyle(
                                                        appointment.status,
                                                    )}`}
                                                >
                                                    {
                                                        appointment.status
                                                    }
                                                </span>
                                            </div>
                                        ),
                                    )}
                            </div>
                        </div>


                        {/* DESKTOP */}
                        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                                <div>
                                    <p className="font-semibold text-slate-950">
                                        Agenda de hoje
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Segunda-feira, 17 de agosto
                                    </p>
                                </div>

                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    4 próximos
                                </span>
                            </div>

                            <div className="hidden border-b border-slate-200 bg-slate-50 px-5 py-3 md:grid md:grid-cols-[100px_2fr_1.35fr_1fr_140px] md:items-center md:gap-5">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Horário
                                </span>

                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Atividade / Aluno
                                </span>

                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Responsável
                                </span>

                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Tipo
                                </span>

                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Status
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {appointments.map(
                                    (
                                        appointment,
                                    ) => (
                                        <div
                                            key={`${appointment.time}-${appointment.student}`}
                                            className="grid gap-4 px-5 py-3 md:grid-cols-[100px_2fr_1.35fr_1fr_140px] md:items-center md:gap-5"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Clock3
                                                    size={
                                                        15
                                                    }
                                                    className="shrink-0 text-blue-600"
                                                />

                                                <span className="font-bold text-slate-950">
                                                    {
                                                        appointment.time
                                                    }
                                                </span>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-slate-950">
                                                    {
                                                        appointment.title
                                                    }
                                                </p>

                                                <p className="mt-1 truncate text-xs text-slate-500">
                                                    {
                                                        appointment.student
                                                    }
                                                </p>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-slate-700">
                                                    {
                                                        appointment.responsible
                                                    }
                                                </p>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm text-slate-600">
                                                    {
                                                        appointment.type
                                                    }
                                                </p>
                                            </div>

                                            <div>
                                                <span
                                                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getAgendaStatusStyle(
                                                        appointment.status,
                                                    )}`}
                                                >
                                                    {
                                                        appointment.status
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </SlideContent>
                </div>
            );
        }


        /*
         * PLANOS
         */
        if (index === 4) {
            return (
                <div
                    className={
                        commonSlide
                    }
                >
                    <SlideContent>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs text-slate-500 md:text-sm">
                                    Gestão comercial
                                </p>

                                <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                                    Planos e Matrículas
                                </h3>

                                <p className="mt-1.5 text-xs text-slate-500 md:mt-2 md:text-sm">
                                    Planos, matrículas e distribuição dos alunos.
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Novo plano"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white md:hidden"
                            >
                                <Plus
                                    size={17}
                                />
                            </button>

                            <button
                                type="button"
                                className="hidden h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm md:inline-flex"
                            >
                                <Plus
                                    size={17}
                                />

                                Novo plano
                            </button>
                        </div>


                        <div className="mt-4 grid grid-cols-3 gap-2.5 md:mt-5 md:gap-4">
                            {[
                                [
                                    "Planos",
                                    "4",
                                ],
                                [
                                    "Matrículas",
                                    "1.248",
                                ],
                                [
                                    "Ticket",
                                    "R$ 142",
                                ],
                            ].map(
                                ([
                                    title,
                                    value,
                                ]) => (
                                    <div
                                        key={
                                            title
                                        }
                                        className="rounded-xl border border-slate-200 bg-white p-3 md:rounded-2xl md:p-5"
                                    >
                                        <p className="text-[10px] text-slate-500 md:text-sm">
                                            {
                                                title
                                            }
                                        </p>

                                        <p className="mt-1 text-lg font-bold text-slate-950 md:mt-2 md:text-2xl">
                                            {
                                                value
                                            }
                                        </p>
                                    </div>
                                ),
                            )}
                        </div>


                        {/* MOBILE */}
                        <div className="mt-4 space-y-2 md:hidden">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                Planos disponíveis
                            </p>

                            {plans
                                .slice(
                                    0,
                                    3,
                                )
                                .map(
                                    (
                                        plan,
                                    ) => (
                                        <div
                                            key={
                                                plan.name
                                            }
                                            className="rounded-xl border border-slate-200 bg-white p-3"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-semibold text-slate-950">
                                                        {
                                                            plan.name
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                        {
                                                            plan.duration
                                                        }{" "}
                                                        •{" "}
                                                        {
                                                            plan.students
                                                        }{" "}
                                                        alunos
                                                    </p>
                                                </div>

                                                <p className="shrink-0 text-xs font-bold text-slate-950">
                                                    {
                                                        plan.value
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    ),
                                )}
                        </div>


                        {/* DESKTOP */}
                        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
                            <div className="flex items-center justify-between border-b border-slate-200 p-4">
                                <div className="relative w-full max-w-md">
                                    <Search
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Buscar plano..."
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none"
                                    />
                                </div>

                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Planos disponíveis
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed text-left">
                                    <colgroup>
                                        <col className="w-[28%]" />
                                        <col className="w-[17%]" />
                                        <col className="w-[20%]" />
                                        <col className="w-[15%]" />
                                        <col className="w-[20%]" />
                                    </colgroup>

                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                            {[
                                                "Plano",
                                                "Duração",
                                                "Valor",
                                                "Alunos",
                                                "Status",
                                            ].map(
                                                (
                                                    heading,
                                                ) => (
                                                    <th
                                                        key={
                                                            heading
                                                        }
                                                        className="px-5 py-3 font-semibold"
                                                    >
                                                        {
                                                            heading
                                                        }
                                                    </th>
                                                ),
                                            )}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {plans.map(
                                            (
                                                plan,
                                            ) => (
                                                <tr
                                                    key={
                                                        plan.name
                                                    }
                                                    className="border-b border-slate-100 last:border-b-0"
                                                >
                                                    <td className="px-5 py-3 font-semibold text-slate-950">
                                                        {
                                                            plan.name
                                                        }
                                                    </td>

                                                    <td className="px-5 py-3 text-sm text-slate-500">
                                                        {
                                                            plan.duration
                                                        }
                                                    </td>

                                                    <td className="px-5 py-3 font-semibold text-slate-950">
                                                        {
                                                            plan.value
                                                        }
                                                    </td>

                                                    <td className="px-5 py-3 text-slate-700">
                                                        {
                                                            plan.students
                                                        }
                                                    </td>

                                                    <td className="px-5 py-3">
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                                                            <CheckCircle2
                                                                size={
                                                                    13
                                                                }
                                                            />

                                                            {
                                                                plan.status
                                                            }
                                                        </span>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </SlideContent>
                </div>
            );
        }


        /*
         * CONTROLE DE ACESSO
         */
        return (
            <div
                className={
                    commonSlide
                }
            >
                <SlideContent>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs text-slate-500 md:text-sm">
                                Entrada e check-in
                            </p>

                            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                                Controle de Acesso
                            </h3>

                            <p className="mt-1.5 text-xs text-slate-500 md:mt-2 md:text-sm">
                                Entradas,
                                liberações e
                                bloqueios.
                            </p>
                        </div>

                        <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-2 text-[10px] font-semibold text-emerald-600 md:px-4 md:py-3 md:text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 md:h-2 md:w-2" />

                            Online
                        </div>
                    </div>


                    <div className="mt-4 grid grid-cols-3 gap-2.5 md:mt-5 md:gap-4">
                        {[
                            [
                                "Check-ins",
                                "352",
                            ],
                            [
                                "Liberados",
                                "347",
                            ],
                            [
                                "Bloqueados",
                                "5",
                            ],
                        ].map(
                            ([
                                title,
                                value,
                            ]) => (
                                <div
                                    key={
                                        title
                                    }
                                    className="rounded-xl border border-slate-200 bg-white p-3 md:rounded-2xl md:p-5"
                                >
                                    <p className="text-[9px] text-slate-500 md:text-sm">
                                        {
                                            title
                                        }
                                    </p>

                                    <p className="mt-1 text-lg font-bold text-slate-950 md:mt-2 md:text-2xl">
                                        {
                                            value
                                        }
                                    </p>
                                </div>
                            ),
                        )}
                    </div>


                    {/* MOBILE */}
                    <div className="mt-4 grid grid-cols-[0.9fr_1.1fr] gap-3 md:hidden">
                        <div className="relative overflow-hidden rounded-xl bg-slate-950 p-3 text-white">
                            <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-cyan-400">
                                Identificação
                            </p>

                            <div className="flex h-[190px] flex-col items-center justify-center text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400">
                                    <ScanFace
                                        size={27}
                                    />
                                </div>

                                <p className="mt-4 text-[11px] font-semibold">
                                    Aguardando identificação
                                </p>

                                <p className="mt-1 text-[9px] text-slate-500">
                                    Facial ou identificador
                                </p>
                            </div>
                        </div>


                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <div className="border-b border-slate-200 px-3 py-3">
                                <p className="text-[11px] font-semibold text-slate-950">
                                    Últimos acessos
                                </p>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {accessLogs
                                    .slice(
                                        0,
                                        3,
                                    )
                                    .map(
                                        (
                                            access,
                                        ) => (
                                            <div
                                                key={`${access.time}-${access.student}`}
                                                className="px-3 py-3"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-[10px] font-semibold text-slate-950">
                                                        {
                                                            access.student
                                                        }
                                                    </p>

                                                    <span
                                                        className={`h-2 w-2 shrink-0 rounded-full ${access.access ===
                                                                "Liberado"
                                                                ? "bg-emerald-500"
                                                                : "bg-red-500"
                                                            }`}
                                                    />
                                                </div>

                                                <p className="mt-1 text-[9px] text-slate-500">
                                                    {
                                                        access.time
                                                    }{" "}
                                                    •{" "}
                                                    {
                                                        access.access
                                                    }
                                                </p>
                                            </div>
                                        ),
                                    )}
                            </div>
                        </div>
                    </div>


                    {/* DESKTOP */}
                    <div className="mt-5 hidden grid-cols-[0.75fr_1.25fr] gap-5 md:grid">
                        <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white">
                            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl" />

                            <div className="relative">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
                                    Identificação
                                </p>

                                <h4 className="mt-2 text-xl font-bold">
                                    Acesso inteligente
                                </h4>

                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    Identifique o aluno e valide a situação antes da entrada.
                                </p>

                                <div className="mt-4 flex h-[200px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                                    <div className="text-center">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-xl">
                                            <ScanFace
                                                size={
                                                    30
                                                }
                                            />
                                        </div>

                                        <p className="mt-4 font-semibold">
                                            Aguardando identificação
                                        </p>

                                        <p className="mt-2 text-xs text-slate-500">
                                            Facial ou identificador único
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                                <div>
                                    <p className="font-semibold text-slate-950">
                                        Últimos acessos
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Movimentação recente da entrada
                                    </p>
                                </div>

                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Ao vivo
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {accessLogs.map(
                                    (
                                        access,
                                    ) => (
                                        <div
                                            key={`${access.time}-${access.student}`}
                                            className="grid gap-4 px-5 py-3 sm:grid-cols-[70px_1.2fr_1fr_auto] sm:items-center"
                                        >
                                            <div className="font-bold text-slate-950">
                                                {
                                                    access.time
                                                }
                                            </div>

                                            <div>
                                                <p className="font-semibold text-slate-950">
                                                    {
                                                        access.student
                                                    }
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {
                                                        access.method
                                                    }
                                                </p>
                                            </div>

                                            <div className="text-sm text-slate-500">
                                                Entrada principal
                                            </div>

                                            <span
                                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${access.access ===
                                                        "Liberado"
                                                        ? "bg-emerald-50 text-emerald-600"
                                                        : "bg-red-50 text-red-600"
                                                    }`}
                                            >
                                                {access.access ===
                                                    "Liberado" ? (
                                                    <CheckCircle2
                                                        size={
                                                            13
                                                        }
                                                    />
                                                ) : (
                                                    <AlertCircle
                                                        size={
                                                            13
                                                        }
                                                    />
                                                )}

                                                {
                                                    access.access
                                                }
                                            </span>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                </SlideContent>
            </div>
        );
    }


    return (
        <section
            id="sistema"
            className="relative overflow-hidden bg-[#050b1c] py-14 md:py-20"
        >
            {/* ATMOSFERA */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-16 h-[32rem] w-[56rem] -translate-x-1/2 rounded-full bg-blue-600/[0.12] blur-[120px]" />

                <div className="absolute -right-52 bottom-[-12rem] h-[30rem] w-[30rem] rounded-full bg-cyan-400/[0.07] blur-[120px]" />

                <div className="absolute -left-52 top-[40%] h-[26rem] w-[26rem] rounded-full bg-blue-500/[0.06] blur-[120px]" />

                <div className="absolute inset-0 opacity-[0.018] [background-image:linear-gradient(rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:46px_46px]" />

                <div className="absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
            </div>


            <div className="relative mx-auto max-w-[1400px] px-5 sm:px-6 lg:px-8">
                {/* CABEÇALHO */}
                <div className="mx-auto grid max-w-[1240px] gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-end lg:gap-7">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-px w-8 bg-gradient-to-r from-blue-500 to-cyan-400" />

                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400 md:text-[10px]">
                                Produto em ação
                            </span>
                        </div>

                        <h2 className="mt-4 max-w-xl text-3xl font-black leading-[1.03] tracking-[-0.045em] text-white sm:text-4xl md:text-5xl">
                            Veja a operação
                            <br />

                            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                acontecendo no Cfit.
                            </span>
                        </h2>
                    </div>


                    <div className="max-w-xl lg:justify-self-end">
                        <p className="text-sm leading-7 text-slate-400 md:text-base md:leading-7">
                            Alunos, financeiro,
                            matrículas, agenda e
                            acesso reunidos em uma
                            única visão para
                            acompanhar a rotina da
                            academia.
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 md:mt-4">
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                                <span className="text-[11px] font-medium text-slate-500 md:text-xs">
                                    Informação conectada
                                </span>
                            </div>

                            <div className="hidden h-3 w-px bg-white/10 sm:block" />

                            <span className="text-[11px] font-medium text-slate-500 md:text-xs">
                                Uma visão para toda a operação
                            </span>
                        </div>
                    </div>
                </div>


                {/* SHOWCASE */}
                <div className="relative mx-auto mt-7 max-w-[1240px] md:mt-9">
                    <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-blue-600/[0.12] blur-[80px]" />

                    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.10] bg-[#0a1122] p-2 shadow-[0_40px_100px_-45px_rgba(0,0,0,0.85)] md:rounded-[1.75rem] md:p-2.5">
                        {/* BARRA SUPERIOR */}
                        <div className="flex min-h-[46px] items-center justify-between gap-3 px-2 sm:px-3 md:min-h-[50px] md:px-4">
                            <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
                                <div className="flex shrink-0 items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-red-400/80 md:h-2.5 md:w-2.5" />
                                    <span className="h-2 w-2 rounded-full bg-amber-400/80 md:h-2.5 md:w-2.5" />
                                    <span className="h-2 w-2 rounded-full bg-emerald-400/80 md:h-2.5 md:w-2.5" />
                                </div>

                                <div className="hidden h-4 w-px bg-white/10 sm:block" />

                                <div className="min-w-0">
                                    <p className="truncate text-[8px] font-bold uppercase tracking-[0.15em] text-slate-600 md:text-[10px]">
                                        Cfit
                                    </p>

                                    <p className="max-w-[130px] truncate text-[10px] font-semibold text-slate-300 sm:max-w-none md:text-xs">
                                        {
                                            slides[
                                                incomingSlide ??
                                                activeSlide
                                            ].label
                                        }
                                    </p>
                                </div>
                            </div>


                            <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
                                <button
                                    type="button"
                                    onClick={
                                        previousSlide
                                    }
                                    disabled={
                                        isTransitioning
                                    }
                                    aria-label="Tela anterior"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-500 transition-all duration-300 hover:border-cyan-400/30 hover:text-cyan-400 disabled:opacity-30"
                                >
                                    <ArrowLeft
                                        size={
                                            14
                                        }
                                    />
                                </button>

                                <div className="hidden items-center gap-1.5 px-1 sm:flex">
                                    {slides.map(
                                        (
                                            slide,
                                            index,
                                        ) => (
                                            <button
                                                key={
                                                    slide.id
                                                }
                                                type="button"
                                                disabled={
                                                    isTransitioning
                                                }
                                                onClick={() =>
                                                    goToSlide(
                                                        index,
                                                    )
                                                }
                                                aria-label={`Abrir ${slide.label}`}
                                                className={`h-1.5 rounded-full transition-all duration-500 ${(
                                                        incomingSlide ??
                                                        activeSlide
                                                    ) ===
                                                        index
                                                        ? "w-6 bg-cyan-400"
                                                        : "w-1.5 bg-white/15"
                                                    }`}
                                            />
                                        ),
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        nextSlide
                                    }
                                    disabled={
                                        isTransitioning
                                    }
                                    aria-label="Próxima tela"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-500 transition-all duration-300 hover:border-cyan-400/30 hover:text-cyan-400 disabled:opacity-30"
                                >
                                    <ArrowRight
                                        size={
                                            14
                                        }
                                    />
                                </button>
                            </div>
                        </div>


                        {/* CARROSSEL */}
                        <div className="relative overflow-hidden rounded-[1.1rem] md:rounded-[1.25rem]">
                            <div
                                className={
                                    incomingSlide ===
                                        null
                                        ? "relative"
                                        : direction ===
                                            1
                                            ? "relative animate-cfit-slide-out-left"
                                            : "relative animate-cfit-slide-out-right"
                                }
                            >
                                {renderSlide(
                                    activeSlide,
                                )}
                            </div>


                            {incomingSlide !==
                                null && (
                                    <div
                                        className={
                                            direction ===
                                                1
                                                ? "absolute inset-0 animate-cfit-slide-in-right"
                                                : "absolute inset-0 animate-cfit-slide-in-left"
                                        }
                                    >
                                        {renderSlide(
                                            incomingSlide,
                                        )}
                                    </div>
                                )}
                        </div>


                        {/* DOTS MOBILE */}
                        <div className="flex items-center justify-center gap-1.5 py-2.5 sm:hidden">
                            {slides.map(
                                (
                                    slide,
                                    index,
                                ) => (
                                    <button
                                        key={
                                            slide.id
                                        }
                                        type="button"
                                        disabled={
                                            isTransitioning
                                        }
                                        onClick={() =>
                                            goToSlide(
                                                index,
                                            )
                                        }
                                        aria-label={`Abrir ${slide.label}`}
                                        className={`h-1.5 rounded-full transition-all duration-500 ${(
                                                incomingSlide ??
                                                activeSlide
                                            ) ===
                                                index
                                                ? "w-6 bg-cyan-400"
                                                : "w-1.5 bg-white/15"
                                            }`}
                                    />
                                ),
                            )}
                        </div>
                    </div>


                    {/* LEGENDA */}
                    <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between md:mt-4">
                        <p className="max-w-xl text-[10px] leading-5 text-slate-500 md:text-xs md:leading-5">
                            Navegue pelas principais
                            áreas do Cfit e veja como
                            cada módulo participa da
                            operação.
                        </p>

                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />

                            <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-600 md:text-[9px]">
                                Demonstração do produto
                            </span>
                        </div>
                    </div>
                </div>
            </div>


            <style>{`
                @keyframes cfitSlideOutLeft {
                    from {
                        transform: translate3d(0, 0, 0);
                    }

                    to {
                        transform: translate3d(-100%, 0, 0);
                    }
                }

                @keyframes cfitSlideInRight {
                    from {
                        transform: translate3d(100%, 0, 0);
                    }

                    to {
                        transform: translate3d(0, 0, 0);
                    }
                }

                @keyframes cfitSlideOutRight {
                    from {
                        transform: translate3d(0, 0, 0);
                    }

                    to {
                        transform: translate3d(100%, 0, 0);
                    }
                }

                @keyframes cfitSlideInLeft {
                    from {
                        transform: translate3d(-100%, 0, 0);
                    }

                    to {
                        transform: translate3d(0, 0, 0);
                    }
                }

                .animate-cfit-slide-out-left {
                    animation:
                        cfitSlideOutLeft
                        700ms
                        cubic-bezier(
                            0.22,
                            1,
                            0.36,
                            1
                        )
                        both;

                    will-change:
                        transform;
                }

                .animate-cfit-slide-in-right {
                    animation:
                        cfitSlideInRight
                        700ms
                        cubic-bezier(
                            0.22,
                            1,
                            0.36,
                            1
                        )
                        both;

                    will-change:
                        transform;
                }

                .animate-cfit-slide-out-right {
                    animation:
                        cfitSlideOutRight
                        700ms
                        cubic-bezier(
                            0.22,
                            1,
                            0.36,
                            1
                        )
                        both;

                    will-change:
                        transform;
                }

                .animate-cfit-slide-in-left {
                    animation:
                        cfitSlideInLeft
                        700ms
                        cubic-bezier(
                            0.22,
                            1,
                            0.36,
                            1
                        )
                        both;

                    will-change:
                        transform;
                }

                @media (
                    prefers-reduced-motion:
                        reduce
                ) {
                    .animate-cfit-slide-out-left,
                    .animate-cfit-slide-in-right,
                    .animate-cfit-slide-out-right,
                    .animate-cfit-slide-in-left {
                        animation-duration:
                            1ms;
                    }
                }
            `}</style>
        </section>
    );
}