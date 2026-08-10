import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    ArrowLeft,
    CalendarDays,
    CircleCheck,
    CircleX,
    History,
    Mail,
    PauseCircle,
    Pencil,
    Phone,
    PlayCircle,
    PlusCircle,
} from "lucide-react";

import DashboardLayout from "../../../layouts/DashboardLayout";

import AddEnrollmentModal from "../components/AddEnrollmentModal";
import ManageEnrollmentModal from "../components/ManageEnrollmentModal";

import { getStudent } from "../services/student.service";

import {
    getStudentEnrollmentHistory,
    getStudentEnrollments,
    type Enrollment,
    type EnrollmentHistory,
} from "../services/enrollment.service";

import type { Student } from "../types/student";


type StudentTab =
    | "overview"
    | "plans"
    | "financial"
    | "checkins"
    | "workouts"
    | "history";


const tabs: {
    id: StudentTab;
    label: string;
}[] = [
        {
            id: "overview",
            label: "Visão geral",
        },
        {
            id: "plans",
            label: "Planos",
        },
        {
            id: "financial",
            label: "Financeiro",
        },
        {
            id: "checkins",
            label: "Check-ins",
        },
        {
            id: "workouts",
            label: "Treinos",
        },
        {
            id: "history",
            label: "Histórico",
        },
    ];


export default function StudentDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [student, setStudent] =
        useState<Student | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [activeTab, setActiveTab] =
        useState<StudentTab>("overview");

    const [enrollments, setEnrollments] =
        useState<Enrollment[]>([]);

    const [loadingEnrollments, setLoadingEnrollments] =
        useState(false);

    const [enrollmentHistory, setEnrollmentHistory] =
        useState<EnrollmentHistory[]>([]);

    const [loadingHistory, setLoadingHistory] =
        useState(false);

    const [historyError, setHistoryError] =
        useState(false);

    const [showEnrollmentModal, setShowEnrollmentModal] =
        useState(false);

    const [selectedEnrollment, setSelectedEnrollment] =
        useState<Enrollment | null>(null);


    useEffect(() => {
        async function loadStudent() {
            if (!id) {
                setError(true);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(false);

                const data = await getStudent(id);

                setStudent(data);
            } catch (error) {
                console.error(error);

                setError(true);
            } finally {
                setLoading(false);
            }
        }

        loadStudent();
    }, [id]);


    async function loadEnrollments() {
        if (!id) {
            return;
        }

        try {
            setLoadingEnrollments(true);

            const data =
                await getStudentEnrollments(id);

            setEnrollments(data);
        } catch (error) {
            console.error(error);

            setEnrollments([]);
        } finally {
            setLoadingEnrollments(false);
        }
    }


    async function loadEnrollmentHistory() {
        if (!id) {
            return;
        }

        try {
            setLoadingHistory(true);
            setHistoryError(false);

            const data =
                await getStudentEnrollmentHistory(id);

            setEnrollmentHistory(data);
        } catch (error) {
            console.error(error);

            setEnrollmentHistory([]);
            setHistoryError(true);
        } finally {
            setLoadingHistory(false);
        }
    }


    useEffect(() => {
        loadEnrollments();
        loadEnrollmentHistory();
    }, [id]);


    function formatBirthDate(date: string | null) {
        if (!date) {
            return "Nascimento não informado";
        }

        return formatDate(date);
    }


    function formatDate(date: string) {
        const [year, month, day] = date.split("-");

        return `${day}/${month}/${year}`;
    }


    function formatDateTime(dateTime: string) {
        const date = new Date(dateTime);

        return date.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }


    function formatMoney(value: string) {
        return Number(value).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }


    function getEnrollmentStatusLabel(
        status: Enrollment["status"],
    ) {
        switch (status) {
            case "active":
                return "Ativa";

            case "frozen":
                return "Congelada";

            case "canceled":
                return "Cancelada";

            case "finished":
                return "Encerrada";

            case "expired":
                return "Vencida";

            default:
                return status;
        }
    }


    function getEnrollmentStatusClass(
        status: Enrollment["status"],
    ) {
        switch (status) {
            case "active":
                return "bg-emerald-50 text-emerald-700";

            case "frozen":
                return "bg-blue-50 text-blue-700";

            case "canceled":
                return "bg-red-50 text-red-700";

            case "finished":
                return "bg-slate-100 text-slate-600";

            case "expired":
                return "bg-amber-50 text-amber-700";

            default:
                return "bg-slate-100 text-slate-600";
        }
    }


    function getHistoryEventStyle(
        eventType: EnrollmentHistory["event_type"],
    ) {
        switch (eventType) {
            case "created":
                return {
                    icon: PlusCircle,
                    iconClass:
                        "bg-emerald-50 text-emerald-600",
                    badgeClass:
                        "bg-emerald-50 text-emerald-700",
                };

            case "frozen":
                return {
                    icon: PauseCircle,
                    iconClass:
                        "bg-blue-50 text-blue-600",
                    badgeClass:
                        "bg-blue-50 text-blue-700",
                };

            case "reactivated":
                return {
                    icon: PlayCircle,
                    iconClass:
                        "bg-emerald-50 text-emerald-600",
                    badgeClass:
                        "bg-emerald-50 text-emerald-700",
                };

            case "canceled":
                return {
                    icon: CircleX,
                    iconClass:
                        "bg-red-50 text-red-600",
                    badgeClass:
                        "bg-red-50 text-red-700",
                };

            case "finished":
                return {
                    icon: CircleCheck,
                    iconClass:
                        "bg-slate-100 text-slate-600",
                    badgeClass:
                        "bg-slate-100 text-slate-600",
                };

            default:
                return {
                    icon: History,
                    iconClass:
                        "bg-slate-100 text-slate-600",
                    badgeClass:
                        "bg-slate-100 text-slate-600",
                };
        }
    }


    function getTabTitle() {
        switch (activeTab) {
            case "financial":
                return "Financeiro";

            case "checkins":
                return "Check-ins";

            case "workouts":
                return "Treinos";

            default:
                return "";
        }
    }


    return (
        <DashboardLayout>
            {loading ? (
                <div className="py-10 text-sm text-slate-500">
                    Carregando aluno...
                </div>
            ) : error || !student ? (
                <div className="py-10">
                    <h2 className="text-xl font-bold text-slate-900">
                        Aluno não encontrado
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Não foi possível carregar os dados deste
                        aluno.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/students")
                        }
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                        <ArrowLeft size={16} />

                        Voltar para alunos
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* VOLTAR */}
                    <button
                        type="button"
                        onClick={() =>
                            navigate("/students")
                        }
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                    >
                        <ArrowLeft size={16} />

                        Voltar para alunos
                    </button>


                    {/* CABEÇALHO DO ALUNO */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-5">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-bold text-blue-600">
                                    {student.name
                                        .trim()
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-2xl font-bold text-slate-900">
                                            {student.name}
                                        </h1>

                                        {student.active ? (
                                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                Ativo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                Inativo
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                                        <span>
                                            CPF:{" "}
                                            {student.cpf ??
                                                "Não informado"}
                                        </span>

                                        <span className="inline-flex items-center gap-1.5">
                                            <Phone size={15} />

                                            {student.phone ??
                                                "Não informado"}
                                        </span>

                                        <span className="inline-flex items-center gap-1.5">
                                            <Mail size={15} />

                                            {student.email ??
                                                "Não informado"}
                                        </span>

                                        <span className="inline-flex items-center gap-1.5">
                                            <CalendarDays size={15} />

                                            {formatBirthDate(
                                                student.birth_date,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0">
                                <button
                                    type="button"
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <Pencil size={16} />
                                    Editar aluno
                                </button>
                            </div>
                        </div>
                    </div>


                    {/* ABAS */}
                    <div className="border-b border-slate-200">
                        <nav className="flex gap-8 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() =>
                                        setActiveTab(tab.id)
                                    }
                                    className={
                                        activeTab === tab.id
                                            ? "whitespace-nowrap border-b-2 border-blue-600 px-1 pb-3 text-sm font-semibold text-blue-600"
                                            : "whitespace-nowrap border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                                    }
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>


                    {/* VISÃO GERAL */}
                    {activeTab === "overview" && (
                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            {/* DADOS PESSOAIS */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-5">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        Dados pessoais
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Informações cadastrais do
                                        aluno.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            CPF
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                            {student.cpf ??
                                                "Não informado"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Telefone
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                            {student.phone ??
                                                "Não informado"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Data de nascimento
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                            {student.birth_date
                                                ? formatBirthDate(
                                                    student.birth_date,
                                                )
                                                : "Não informado"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            E-mail
                                        </p>

                                        <p className="mt-1 break-all text-sm font-medium text-slate-700">
                                            {student.email ??
                                                "Não informado"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Situação
                                        </p>

                                        <div className="mt-1">
                                            {student.active ? (
                                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
                                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                    Ativo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-600">
                                                    <span className="h-2 w-2 rounded-full bg-red-500" />
                                                    Inativo
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* ENDEREÇO */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-5">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        Endereço
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Localização cadastrada do
                                        aluno.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            CEP
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                            {student.cep ??
                                                "Não informado"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Número
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                            {student.number ??
                                                "Não informado"}
                                        </p>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Rua
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                            {student.street ??
                                                "Não informado"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Bairro
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                            {student.neighborhood ??
                                                "Não informado"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Cidade / UF
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                            {student.city ||
                                                student.state
                                                ? `${student.city ?? ""}${student.city &&
                                                    student.state
                                                    ? " / "
                                                    : ""
                                                }${student.state ?? ""}`
                                                : "Não informado"}
                                        </p>
                                    </div>
                                </div>
                            </div>


                            {/* CONTATO DE EMERGÊNCIA */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                                <div className="mb-5">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        Contato de emergência
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Pessoa indicada para contato
                                        em caso de emergência.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Nome do contato
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                            {student.emergency_contact ??
                                                "Não informado"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Telefone
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-700">
                                            {student.emergency_phone ??
                                                "Não informado"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* PLANOS */}
                    {activeTab === "plans" && (
                        <div className="space-y-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Planos do aluno
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Matrículas vinculadas a este
                                        aluno.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowEnrollmentModal(
                                            true,
                                        )
                                    }
                                    className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                    + Adicionar plano
                                </button>
                            </div>

                            {loadingEnrollments ? (
                                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
                                    Carregando planos...
                                </div>
                            ) : enrollments.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                                    <h3 className="font-semibold text-slate-900">
                                        Nenhum plano encontrado
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Este aluno ainda não possui
                                        matrícula.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {enrollments.map(
                                        (enrollment) => (
                                            <button
                                                key={
                                                    enrollment.id
                                                }
                                                type="button"
                                                onClick={() =>
                                                    setSelectedEnrollment(
                                                        enrollment,
                                                    )
                                                }
                                                className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
                                            >
                                                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <h3 className="text-lg font-semibold text-slate-900">
                                                                {
                                                                    enrollment.plan_name
                                                                }
                                                            </h3>

                                                            <span
                                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getEnrollmentStatusClass(
                                                                    enrollment.status,
                                                                )}`}
                                                            >
                                                                {getEnrollmentStatusLabel(
                                                                    enrollment.status,
                                                                )}
                                                            </span>
                                                        </div>

                                                        <p className="mt-2 text-xl font-bold text-slate-900">
                                                            {formatMoney(
                                                                enrollment.contracted_price,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:min-w-[520px]">
                                                        <div>
                                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                                Início
                                                            </p>

                                                            <p className="mt-1 text-sm font-medium text-slate-700">
                                                                {formatDate(
                                                                    enrollment.start_date,
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                                Vencimento
                                                            </p>

                                                            <p className="mt-1 text-sm font-medium text-slate-700">
                                                                {formatDate(
                                                                    enrollment.due_date,
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                                Cobrança
                                                            </p>

                                                            <p className="mt-1 text-sm font-medium text-slate-700">
                                                                {enrollment.billing_method ===
                                                                    "monthly"
                                                                    ? "Mensal"
                                                                    : "À vista"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 border-t border-slate-100 pt-4 text-xs font-semibold text-blue-600 lg:mt-0 lg:border-0 lg:pt-0">
                                                        Clique para
                                                        gerenciar
                                                    </div>
                                                </div>
                                            </button>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>
                    )}


                    {/* HISTÓRICO GERAL */}
                    {activeTab === "history" && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Histórico do aluno
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Linha do tempo das movimentações
                                    realizadas nas matrículas.
                                </p>
                            </div>

                            {loadingHistory ? (
                                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
                                    Carregando histórico...
                                </div>
                            ) : historyError ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                                    <h3 className="font-semibold text-red-700">
                                        Não foi possível carregar o
                                        histórico
                                    </h3>

                                    <p className="mt-1 text-sm text-red-600">
                                        Tente atualizar a página.
                                    </p>
                                </div>
                            ) : enrollmentHistory.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                        <History size={20} />
                                    </div>

                                    <h3 className="mt-4 font-semibold text-slate-900">
                                        Nenhum histórico encontrado
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Ainda não existem
                                        movimentações registradas para
                                        este aluno.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="space-y-0">
                                        {enrollmentHistory.map(
                                            (historyItem, index) => {
                                                const eventStyle =
                                                    getHistoryEventStyle(
                                                        historyItem.event_type,
                                                    );

                                                const EventIcon =
                                                    eventStyle.icon;

                                                const isLast =
                                                    index ===
                                                    enrollmentHistory.length -
                                                    1;

                                                return (
                                                    <div
                                                        key={
                                                            historyItem.id
                                                        }
                                                        className="relative flex gap-4"
                                                    >
                                                        {/* LINHA DA TIMELINE */}
                                                        {!isLast && (
                                                            <div className="absolute left-[21px] top-11 h-[calc(100%-20px)] w-px bg-slate-200" />
                                                        )}

                                                        {/* ÍCONE */}
                                                        <div
                                                            className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${eventStyle.iconClass}`}
                                                        >
                                                            <EventIcon
                                                                size={20}
                                                            />
                                                        </div>

                                                        {/* EVENTO */}
                                                        <div
                                                            className={
                                                                isLast
                                                                    ? "min-w-0 flex-1 pb-1"
                                                                    : "min-w-0 flex-1 border-b border-slate-100 pb-6 mb-6"
                                                            }
                                                        >
                                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                                <div className="min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <h3 className="font-semibold text-slate-900">
                                                                            {
                                                                                historyItem.event_label
                                                                            }
                                                                        </h3>

                                                                        <span
                                                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${eventStyle.badgeClass}`}
                                                                        >
                                                                            {
                                                                                historyItem.plan_name
                                                                            }
                                                                        </span>
                                                                    </div>

                                                                    {historyItem.description && (
                                                                        <p className="mt-2 text-sm text-slate-500">
                                                                            {
                                                                                historyItem.description
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-500">
                                                                    <CalendarDays
                                                                        size={
                                                                            15
                                                                        }
                                                                    />

                                                                    {formatDateTime(
                                                                        historyItem.created_at,
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {/* ABAS QUE AINDA SERÃO DESENVOLVIDAS */}
                    {activeTab !== "overview" &&
                        activeTab !== "plans" &&
                        activeTab !== "history" && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {getTabTitle()}
                                </h2>

                                <p className="mt-2 text-sm text-slate-500">
                                    Esta área será desenvolvida na
                                    próxima etapa.
                                </p>
                            </div>
                        )}
                </div>
            )}


            {/* MODAL ADICIONAR PLANO */}
            {showEnrollmentModal && id && (
                <AddEnrollmentModal
                    studentId={id}
                    enrollments={enrollments}
                    onClose={() =>
                        setShowEnrollmentModal(false)
                    }
                    onSuccess={async () => {
                        await loadEnrollments();
                        await loadEnrollmentHistory();
                    }}
                />
            )}


            {/* MODAL GERENCIAR MATRÍCULA */}
            {selectedEnrollment && (
                <ManageEnrollmentModal
                    enrollment={selectedEnrollment}
                    onClose={() =>
                        setSelectedEnrollment(null)
                    }
                    onSuccess={async () => {
                        await loadEnrollments();
                        await loadEnrollmentHistory();

                        setSelectedEnrollment(null);
                    }}
                />
            )}
        </DashboardLayout>
    );
}