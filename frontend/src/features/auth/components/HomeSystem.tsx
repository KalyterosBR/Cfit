import { useEffect, useState } from "react";

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
    { name: "Carlos Henrique", cpf: "123.456.789-00", plan: "Plano Mensal", status: "Ativo", checkin: "Hoje, 08:42" },
    { name: "Mariana Souza", cpf: "987.654.321-00", plan: "Plano Trimestral", status: "Ativo", checkin: "Hoje, 07:15" },
    { name: "Lucas Almeida", cpf: "456.789.123-00", plan: "Plano Mensal", status: "Ativo", checkin: "Ontem, 18:36" },
    { name: "Fernanda Lima", cpf: "789.123.456-00", plan: "Plano Semestral", status: "Inativo", checkin: "12/08/2026" },
];

const charges = [
    { student: "Carlos Henrique", plan: "Plano Mensal", dueDate: "10/08/2026", value: "R$ 119,90", status: "Pago" },
    { student: "Mariana Souza", plan: "Plano Trimestral", dueDate: "12/08/2026", value: "R$ 299,90", status: "Pago" },
    { student: "Lucas Almeida", plan: "Plano Mensal", dueDate: "18/08/2026", value: "R$ 119,90", status: "Pendente" },
    { student: "Fernanda Lima", plan: "Plano Semestral", dueDate: "05/08/2026", value: "R$ 549,90", status: "Atrasado" },
];

const appointments = [
    { time: "07:00", title: "Avaliação física", student: "Carlos Henrique", responsible: "Rafael Martins", type: "Avaliação", status: "Concluído" },
    { time: "09:30", title: "Treino acompanhado", student: "Mariana Souza", responsible: "Juliana Costa", type: "Treino", status: "Em andamento" },
    { time: "14:00", title: "Avaliação física", student: "Lucas Almeida", responsible: "Rafael Martins", type: "Avaliação", status: "Agendado" },
    { time: "18:30", title: "Treino experimental", student: "Fernanda Lima", responsible: "Juliana Costa", type: "Experimental", status: "Agendado" },
];

const plans = [
    { name: "Plano Mensal", duration: "1 mês", value: "R$ 119,90", students: 486, status: "Ativo" },
    { name: "Plano Trimestral", duration: "3 meses", value: "R$ 299,90", students: 328, status: "Ativo" },
    { name: "Plano Semestral", duration: "6 meses", value: "R$ 549,90", students: 274, status: "Ativo" },
    { name: "Plano Anual", duration: "12 meses", value: "R$ 999,90", students: 160, status: "Ativo" },
];

const accessLogs = [
    { time: "09:18", student: "Carlos Henrique", method: "Reconhecimento facial", access: "Liberado" },
    { time: "09:14", student: "Mariana Souza", method: "Identificador", access: "Liberado" },
    { time: "09:07", student: "Lucas Almeida", method: "Reconhecimento facial", access: "Liberado" },
    { time: "08:56", student: "Fernanda Lima", method: "Identificador", access: "Bloqueado" },
];

const slides = [
    { id: "dashboard", label: "Dashboard" },
    { id: "students", label: "Alunos" },
    { id: "financial", label: "Financeiro" },
    { id: "agenda", label: "Agenda" },
    { id: "plans", label: "Planos e Matrículas" },
    { id: "access", label: "Controle de Acesso" },
];

type SlideDirection = 1 | -1;


export default function HomeSystem() {
    const [activeSlide, setActiveSlide] = useState(0);
    const [incomingSlide, setIncomingSlide] = useState<number | null>(null);
    const [direction, setDirection] = useState<SlideDirection>(1);

    const isTransitioning = incomingSlide !== null;

    useEffect(() => {
        if (isTransitioning) {
            return;
        }

        const timer = window.setTimeout(() => {
            const next =
                activeSlide === slides.length - 1
                    ? 0
                    : activeSlide + 1;

            startTransition(next, 1);
        }, 6000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [activeSlide, isTransitioning]);

    function startTransition(
        targetIndex: number,
        requestedDirection?: SlideDirection,
    ) {
        if (
            targetIndex === activeSlide ||
            isTransitioning
        ) {
            return;
        }

        const resolvedDirection =
            requestedDirection ??
            (targetIndex > activeSlide ? 1 : -1);

        setDirection(resolvedDirection);
        setIncomingSlide(targetIndex);
    }

    function finishTransition() {
        if (incomingSlide === null) {
            return;
        }

        setActiveSlide(incomingSlide);
        setIncomingSlide(null);
    }

    function previousSlide() {
        const previous =
            activeSlide === 0
                ? slides.length - 1
                : activeSlide - 1;

        startTransition(previous, -1);
    }

    function nextSlide() {
        const next =
            activeSlide === slides.length - 1
                ? 0
                : activeSlide + 1;

        startTransition(next, 1);
    }

    function goToSlide(index: number) {
        if (index === activeSlide) {
            return;
        }

        const forwardDistance =
            (index - activeSlide + slides.length) %
            slides.length;

        const backwardDistance =
            (activeSlide - index + slides.length) %
            slides.length;

        startTransition(
            index,
            forwardDistance <= backwardDistance
                ? 1
                : -1,
        );
    }

    function getFinancialStatusStyle(status: string) {
        if (status === "Pago") {
            return {
                className:
                    "bg-emerald-50 text-emerald-600",
                icon: <CheckCircle2 size={13} />,
            };
        }

        if (status === "Pendente") {
            return {
                className:
                    "bg-amber-50 text-amber-600",
                icon: <WalletCards size={13} />,
            };
        }

        return {
            className:
                "bg-red-50 text-red-600",
            icon: <AlertCircle size={13} />,
        };
    }

    function getAgendaStatusStyle(status: string) {
        if (status === "Concluído") {
            return "bg-emerald-50 text-emerald-600";
        }

        if (status === "Em andamento") {
            return "bg-blue-50 text-blue-600";
        }

        return "bg-slate-100 text-slate-600";
    }

    const commonSlide =
        "min-h-[600px] rounded-2xl bg-slate-100 p-6 md:p-8";

    function renderSlide(index: number) {
        if (index === 0) {
            return (
                <div className={commonSlide}>
                    <div className="mb-7">
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
                            icon={<Users size={28} />}
                            description="+12 este mês"
                        />

                        <StatCard
                            title="Receita mensal"
                            value="R$ 89.250"
                            icon={<DollarSign size={28} />}
                            description="+8% em relação ao mês anterior"
                        />

                        <StatCard
                            title="Check-ins hoje"
                            value="352"
                            icon={<Dumbbell size={28} />}
                            description="Até o momento"
                        />

                        <StatCard
                            title="Crescimento"
                            value="+12%"
                            icon={<TrendingUp size={28} />}
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
            );
        }

        if (index === 1) {
            return (
                <div className={commonSlide}>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Gestão de alunos
                            </p>

                            <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                                Alunos
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Acompanhe cadastros, planos e situação dos alunos.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm"
                        >
                            <UserPlus size={17} />
                            Novo aluno
                        </button>
                    </div>

                    <div className="mt-7 grid gap-4 sm:grid-cols-3">
                        {[
                            ["Total de alunos", "1.384"],
                            ["Alunos ativos", "1.248"],
                            ["Novos este mês", "+32"],
                        ].map(([title, value]) => (
                            <div
                                key={title}
                                className="rounded-2xl border border-slate-200 bg-white p-5"
                            >
                                <p className="text-sm text-slate-500">
                                    {title}
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-950">
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
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
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className="px-5 py-4 font-semibold"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {students.map((student) => (
                                        <tr
                                            key={student.cpf}
                                            className="border-b border-slate-100 last:border-b-0"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                                                        {student.name.charAt(0)}
                                                    </div>

                                                    <span className="font-semibold text-slate-950">
                                                        {student.name}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-500">
                                                {student.cpf}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {student.plan}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${student.status === "Ativo"
                                                            ? "bg-emerald-50 text-emerald-600"
                                                            : "bg-slate-100 text-slate-500"
                                                        }`}
                                                >
                                                    {student.status}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-500">
                                                {student.checkin}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        if (index === 2) {
            return (
                <div className={commonSlide}>
                    <div>
                        <p className="text-sm text-slate-500">
                            Controle financeiro
                        </p>

                        <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                            Financeiro
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            Acompanhe recebimentos, pendências e inadimplência da academia.
                        </p>
                    </div>

                    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            ["Receita do mês", "R$ 89.250"],
                            ["Recebido", "R$ 82.430"],
                            ["Pendente", "R$ 4.380"],
                            ["Em atraso", "R$ 2.440"],
                        ].map(([title, value]) => (
                            <div
                                key={title}
                                className="rounded-2xl border border-slate-200 bg-white p-5"
                            >
                                <p className="text-sm text-slate-500">
                                    {title}
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-950">
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
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
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className="px-5 py-4 font-semibold"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {charges.map((charge) => {
                                        const status =
                                            getFinancialStatusStyle(
                                                charge.status,
                                            );

                                        return (
                                            <tr
                                                key={`${charge.student}-${charge.dueDate}`}
                                                className="border-b border-slate-100 last:border-b-0"
                                            >
                                                <td className="px-5 py-4 font-semibold text-slate-950">
                                                    {charge.student}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {charge.plan}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-500">
                                                    {charge.dueDate}
                                                </td>

                                                <td className="px-5 py-4 font-semibold text-slate-950">
                                                    {charge.value}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                                                    >
                                                        {status.icon}
                                                        {charge.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        if (index === 3) {
            return (
                <div className={commonSlide}>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Rotina da academia
                            </p>

                            <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                                Agenda
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Organize avaliações, treinos e compromissos da equipe.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm"
                        >
                            <Plus size={17} />
                            Novo agendamento
                        </button>
                    </div>

                    <div className="mt-7 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">
                                        Hoje
                                    </p>

                                    <p className="mt-2 text-2xl font-bold text-slate-950">
                                        12
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <CalendarDays size={21} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">
                                        Concluídos
                                    </p>

                                    <p className="mt-2 text-2xl font-bold text-slate-950">
                                        5
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <CheckCircle2 size={21} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">
                                        Próximo
                                    </p>

                                    <p className="mt-2 text-2xl font-bold text-slate-950">
                                        14:00
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Clock3 size={21} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
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

                        <div className="divide-y divide-slate-100">
                            {appointments.map((appointment) => (
                                <div
                                    key={`${appointment.time}-${appointment.student}`}
                                    className="grid gap-4 px-5 py-4 md:grid-cols-[90px_1.4fr_1fr_1fr_auto] md:items-center"
                                >
                                    <div className="flex items-center gap-2">
                                        <Clock3
                                            size={15}
                                            className="text-blue-600"
                                        />

                                        <span className="font-bold text-slate-950">
                                            {appointment.time}
                                        </span>
                                    </div>

                                    <div>
                                        <p className="font-semibold text-slate-950">
                                            {appointment.title}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {appointment.student}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Responsável
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                            {appointment.responsible}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Tipo
                                        </p>

                                        <p className="mt-1 text-sm text-slate-600">
                                            {appointment.type}
                                        </p>
                                    </div>

                                    <span
                                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getAgendaStatusStyle(
                                            appointment.status,
                                        )}`}
                                    >
                                        {appointment.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (index === 4) {
            return (
                <div className={commonSlide}>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Gestão comercial
                            </p>

                            <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                                Planos e Matrículas
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Acompanhe os planos, matrículas ativas e a distribuição dos alunos.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm"
                        >
                            <Plus size={17} />
                            Novo plano
                        </button>
                    </div>

                    <div className="mt-7 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">
                                        Planos ativos
                                    </p>

                                    <p className="mt-2 text-2xl font-bold text-slate-950">
                                        4
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <CreditCard size={21} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">
                                        Matrículas ativas
                                    </p>

                                    <p className="mt-2 text-2xl font-bold text-slate-950">
                                        1.248
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Users size={21} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">
                                        Ticket médio
                                    </p>

                                    <p className="mt-2 text-2xl font-bold text-slate-950">
                                        R$ 142,80
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <DollarSign size={21} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
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
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                        {[
                                            "Plano",
                                            "Duração",
                                            "Valor",
                                            "Alunos",
                                            "Status",
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className="px-5 py-4 font-semibold"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {plans.map((plan) => (
                                        <tr
                                            key={plan.name}
                                            className="border-b border-slate-100 last:border-b-0"
                                        >
                                            <td className="px-5 py-4 font-semibold text-slate-950">
                                                {plan.name}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-500">
                                                {plan.duration}
                                            </td>

                                            <td className="px-5 py-4 font-semibold text-slate-950">
                                                {plan.value}
                                            </td>

                                            <td className="px-5 py-4">
                                                {plan.students}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                                                    <CheckCircle2 size={13} />
                                                    {plan.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={commonSlide}>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm text-slate-500">
                            Entrada e check-in
                        </p>

                        <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                            Controle de Acesso
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            Acompanhe entradas, liberações e bloqueios em tempo real.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Sistema online
                    </div>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Check-ins hoje
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-950">
                                    352
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <DoorOpen size={21} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Acessos liberados
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-950">
                                    347
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <CheckCircle2 size={21} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Bloqueados
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-950">
                                    5
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <AlertCircle size={21} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
                    <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-white">
                        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl" />

                        <div className="relative">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
                                Identificação
                            </p>

                            <h4 className="mt-2 text-xl font-bold">
                                Acesso inteligente
                            </h4>

                            <p className="mt-3 text-sm leading-7 text-slate-400">
                                Identifique o aluno e valide a situação antes da entrada.
                            </p>

                            <div className="mt-7 flex aspect-[4/3] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                                <div className="text-center">
                                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-xl">
                                        <ScanFace size={36} />
                                    </div>

                                    <p className="mt-5 font-semibold">
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
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
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
                            {accessLogs.map((access) => (
                                <div
                                    key={`${access.time}-${access.student}`}
                                    className="grid gap-4 px-5 py-4 sm:grid-cols-[70px_1.2fr_1fr_auto] sm:items-center"
                                >
                                    <div className="font-bold text-slate-950">
                                        {access.time}
                                    </div>

                                    <div>
                                        <p className="font-semibold text-slate-950">
                                            {access.student}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {access.method}
                                        </p>
                                    </div>

                                    <div className="text-sm text-slate-500">
                                        Entrada principal
                                    </div>

                                    <span
                                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${access.access === "Liberado"
                                                ? "bg-emerald-50 text-emerald-600"
                                                : "bg-red-50 text-red-600"
                                            }`}
                                    >
                                        {access.access === "Liberado" ? (
                                            <CheckCircle2 size={13} />
                                        ) : (
                                            <AlertCircle size={13} />
                                        )}

                                        {access.access}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <section
            id="sistema"
            className="relative overflow-hidden bg-[#050b1c] py-24 md:py-28"
        >
            {/* ATMOSFERA */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-20 h-[34rem] w-[58rem] -translate-x-1/2 rounded-full bg-blue-600/[0.12] blur-[120px]" />

                <div className="absolute -right-52 bottom-[-12rem] h-[32rem] w-[32rem] rounded-full bg-cyan-400/[0.07] blur-[120px]" />

                <div className="absolute -left-52 top-[40%] h-[28rem] w-[28rem] rounded-full bg-blue-500/[0.06] blur-[120px]" />

                <div className="absolute inset-0 opacity-[0.018] [background-image:linear-gradient(rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:46px_46px]" />

                <div className="absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
            </div>

            <div className="relative mx-auto max-w-7xl px-6">
                {/* CABEÇALHO */}
                <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-px w-8 bg-gradient-to-r from-blue-500 to-cyan-400" />

                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                                Produto em ação
                            </span>
                        </div>

                        <h2 className="mt-5 max-w-xl text-4xl font-black leading-[1.03] tracking-[-0.045em] text-white md:text-5xl">
                            Veja a operação
                            <br />

                            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                acontecendo no Cfit.
                            </span>
                        </h2>
                    </div>

                    <div className="max-w-xl lg:justify-self-end">
                        <p className="text-base leading-8 text-slate-400">
                            Alunos, financeiro, matrículas, agenda
                            e acesso reunidos em uma única visão
                            para acompanhar a rotina da academia.
                        </p>

                        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                                <span className="text-xs font-medium text-slate-500">
                                    Informação conectada
                                </span>
                            </div>

                            <div className="hidden h-3 w-px bg-white/10 sm:block" />

                            <span className="text-xs font-medium text-slate-500">
                                Uma visão para toda a operação
                            </span>
                        </div>
                    </div>
                </div>

                {/* SHOWCASE */}
                <div className="relative mx-auto mt-12 max-w-6xl">
                    <div className="pointer-events-none absolute -inset-12 rounded-[3rem] bg-blue-600/[0.12] blur-[80px]" />

                    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.10] bg-[#0a1122] p-2.5 shadow-[0_40px_100px_-45px_rgba(0,0,0,0.85)]">
                        {/* BARRA SUPERIOR */}
                        <div className="flex min-h-[50px] items-center justify-between gap-4 px-3 sm:px-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex shrink-0 items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                                </div>

                                <div className="hidden h-4 w-px bg-white/10 sm:block" />

                                <div className="min-w-0">
                                    <p className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                                        Cfit
                                    </p>

                                    <p className="truncate text-xs font-semibold text-slate-300">
                                        {
                                            slides[
                                                incomingSlide ??
                                                activeSlide
                                            ].label
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    type="button"
                                    onClick={previousSlide}
                                    disabled={isTransitioning}
                                    aria-label="Tela anterior"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-500 transition-all duration-300 hover:border-cyan-400/30 hover:bg-white/[0.06] hover:text-cyan-400 disabled:cursor-default disabled:opacity-30"
                                >
                                    <ArrowLeft size={14} />
                                </button>

                                <div className="hidden items-center gap-1.5 px-1 sm:flex">
                                    {slides.map(
                                        (
                                            slide,
                                            index,
                                        ) => (
                                            <button
                                                key={slide.id}
                                                type="button"
                                                disabled={isTransitioning}
                                                onClick={() =>
                                                    goToSlide(index)
                                                }
                                                aria-label={`Abrir ${slide.label}`}
                                                className={`h-1.5 rounded-full transition-all duration-500 disabled:cursor-default ${(
                                                        incomingSlide ??
                                                        activeSlide
                                                    ) === index
                                                        ? "w-6 bg-cyan-400"
                                                        : "w-1.5 bg-white/15 hover:bg-white/30"
                                                    }`}
                                            />
                                        ),
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={nextSlide}
                                    disabled={isTransitioning}
                                    aria-label="Próxima tela"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-500 transition-all duration-300 hover:border-cyan-400/30 hover:bg-white/[0.06] hover:text-cyan-400 disabled:cursor-default disabled:opacity-30"
                                >
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>

                        {/* CARROSSEL */}
                        <div className="relative overflow-hidden rounded-[1.25rem]">
                            <div
                                className={
                                    incomingSlide === null
                                        ? "relative"
                                        : direction === 1
                                            ? "relative animate-cfit-slide-out-left"
                                            : "relative animate-cfit-slide-out-right"
                                }
                            >
                                {renderSlide(activeSlide)}
                            </div>

                            {incomingSlide !== null && (
                                <div
                                    className={
                                        direction === 1
                                            ? "absolute inset-0 animate-cfit-slide-in-right"
                                            : "absolute inset-0 animate-cfit-slide-in-left"
                                    }
                                    onAnimationEnd={finishTransition}
                                >
                                    {renderSlide(incomingSlide)}
                                </div>
                            )}
                        </div>

                        {/* MOBILE DOTS */}
                        <div className="flex items-center justify-center gap-1.5 py-3 sm:hidden">
                            {slides.map(
                                (
                                    slide,
                                    index,
                                ) => (
                                    <button
                                        key={slide.id}
                                        type="button"
                                        disabled={isTransitioning}
                                        onClick={() =>
                                            goToSlide(index)
                                        }
                                        aria-label={`Abrir ${slide.label}`}
                                        className={`h-1.5 rounded-full transition-all duration-500 ${(
                                                incomingSlide ??
                                                activeSlide
                                            ) === index
                                                ? "w-6 bg-cyan-400"
                                                : "w-1.5 bg-white/15"
                                            }`}
                                    />
                                ),
                            )}
                        </div>
                    </div>

                    {/* LEGENDA INFERIOR */}
                    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="max-w-xl text-xs leading-6 text-slate-500">
                            Navegue pelas principais áreas
                            do Cfit e veja como cada módulo
                            participa da operação.
                        </p>

                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />

                            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
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
                        cfitSlideOutLeft 700ms
                        cubic-bezier(0.22, 1, 0.36, 1)
                        both;
                    will-change: transform;
                }

                .animate-cfit-slide-in-right {
                    animation:
                        cfitSlideInRight 700ms
                        cubic-bezier(0.22, 1, 0.36, 1)
                        both;
                    will-change: transform;
                }

                .animate-cfit-slide-out-right {
                    animation:
                        cfitSlideOutRight 700ms
                        cubic-bezier(0.22, 1, 0.36, 1)
                        both;
                    will-change: transform;
                }

                .animate-cfit-slide-in-left {
                    animation:
                        cfitSlideInLeft 700ms
                        cubic-bezier(0.22, 1, 0.36, 1)
                        both;
                    will-change: transform;
                }

                @media (prefers-reduced-motion: reduce) {
                    .animate-cfit-slide-out-left,
                    .animate-cfit-slide-in-right,
                    .animate-cfit-slide-out-right,
                    .animate-cfit-slide-in-left {
                        animation-duration: 1ms;
                    }
                }
            `}</style>
        </section>
    );
}
