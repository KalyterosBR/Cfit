import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getStudentCharges,
    type Charge,
} from "../services/financial.service";

import {
    ArrowLeft,
    CalendarDays,
    CircleCheck,
    CircleX,
    Clock3,
    DoorOpen,
    History,
    Mail,
    PauseCircle,
    Pencil,
    Phone,
    PlayCircle,
    PlusCircle,
} from "lucide-react";

import DashboardLayout from "../../../layouts/DashboardLayout";
import StudentForm from "../components/StudentForm";
import Modal from "../../../components/Modal";
import {
    getRequestErrorKind,
    type RequestErrorKind,
} from "../../../services/http/request-error";
import AddEnrollmentModal from "../components/AddEnrollmentModal";
import ManageEnrollmentModal from "../components/ManageEnrollmentModal";

import {
    getStudent,
    getStudentOperationalSummary,
    getStudentTimeline,
    type StudentOperationalSummary,
    type StudentTimelineEvent,
} from "../services/student.service";

import {
    getStudentEnrollments,
    type Enrollment,
} from "../services/enrollment.service";

import type { Student } from "../types/student";
import StudentWorkoutSection from "../components/StudentWorkoutSection";

import {
    createCheckIn,
    getStudentCheckIns,
    type CheckIn,
} from "../services/checkin.service";


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


function OperationalItem({
    label,
    value,
    tone = "default",
}: {
    label: string;
    value: string;
    tone?: "default" | "danger" | "muted";
}) {
    const valueClass = {
        default: "text-slate-900",
        danger: "text-red-600",
        muted: "text-slate-500",
    }[tone];

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className={`mt-1 text-sm font-semibold ${valueClass}`}>
                {value}
            </p>
        </div>
    );
}


export default function StudentDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [student, setStudent] =
        useState<Student | null>(null);
    const [openEditModal, setOpenEditModal] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [studentErrorKind, setStudentErrorKind] =
        useState<RequestErrorKind>("generic");
    const [operationalSummary, setOperationalSummary] =
        useState<StudentOperationalSummary | null>(null);
    const [loadingOperationalSummary, setLoadingOperationalSummary] =
        useState(false);
    const [operationalSummaryError, setOperationalSummaryError] =
        useState(false);

    const [activeTab, setActiveTab] =
        useState<StudentTab>("overview");

    const [enrollments, setEnrollments] =
        useState<Enrollment[]>([]);

    const [loadingEnrollments, setLoadingEnrollments] =
        useState(false);
    const [enrollmentsErrorKind, setEnrollmentsErrorKind] =
        useState<RequestErrorKind | null>(null);
    const [charges, setCharges] =
        useState<Charge[]>([]);

    const [loadingCharges, setLoadingCharges] =
        useState(false);

    const [chargesError, setChargesError] =
        useState(false);

    const [timeline, setTimeline] =
        useState<StudentTimelineEvent[]>([]);

    const [loadingHistory, setLoadingHistory] =
        useState(false);

    const [historyError, setHistoryError] =
        useState(false);

    const [checkIns, setCheckIns] =
        useState<CheckIn[]>([]);

    const [checkInsCount, setCheckInsCount] =
        useState(0);

    const [latestCheckIn, setLatestCheckIn] =
        useState<CheckIn | null>(null);

    const [checkInsPage, setCheckInsPage] =
        useState(1);

    const [checkInsNext, setCheckInsNext] =
        useState<string | null>(null);

    const [checkInsPrevious, setCheckInsPrevious] =
        useState<string | null>(null);

    const [loadingCheckIns, setLoadingCheckIns] =
        useState(false);

    const [checkInsError, setCheckInsError] =
        useState(false);

    const [registeringCheckIn, setRegisteringCheckIn] =
        useState(false);

    const [showCheckInModal, setShowCheckInModal] =
        useState(false);

    const [checkInNotes, setCheckInNotes] =
        useState("");

    const [showEnrollmentModal, setShowEnrollmentModal] =
        useState(false);

    const [selectedEnrollment, setSelectedEnrollment] =
        useState<Enrollment | null>(null);


    async function loadStudent() {
        if (!id) {
            setError(true);
            setStudentErrorKind("not_found");
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
            setStudent(null);
            setError(true);
            setStudentErrorKind(getRequestErrorKind(error));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadStudent();
    }, [id]);

    async function loadEnrollments() {
        if (!id) {
            return;
        }

        try {
            setLoadingEnrollments(true);
            setEnrollmentsErrorKind(null);

            const data =
                await getStudentEnrollments(id);

            setEnrollments(data);
        } catch (error) {
            console.error(error);

            setEnrollments([]);
            setEnrollmentsErrorKind(getRequestErrorKind(error));
        } finally {
            setLoadingEnrollments(false);
        }
    }


    async function loadCharges() {
        if (!id) {
            return;
        }

        try {
            setLoadingCharges(true);
            setChargesError(false);

            const data = await getStudentCharges(id);

            setCharges(data);
        } catch (error) {
            console.error(error);

            setCharges([]);
            setChargesError(true);
        } finally {
            setLoadingCharges(false);
        }
    }


    async function loadTimeline() {
        if (!id) {
            return;
        }

        try {
            setLoadingHistory(true);
            setHistoryError(false);

            const data = await getStudentTimeline(id);

            setTimeline(data);
        } catch (error) {
            console.error(error);

            setTimeline([]);
            setHistoryError(true);
        } finally {
            setLoadingHistory(false);
        }
    }


    async function loadOperationalSummary() {
        if (!id) {
            return;
        }

        try {
            setLoadingOperationalSummary(true);
            setOperationalSummaryError(false);

            const data = await getStudentOperationalSummary(id);

            setOperationalSummary(data);
        } catch (error) {
            console.error(error);
            setOperationalSummary(null);
            setOperationalSummaryError(true);
        } finally {
            setLoadingOperationalSummary(false);
        }
    }


    async function loadCheckIns(page: number) {
        if (!id) {
            return;
        }

        try {
            setLoadingCheckIns(true);
            setCheckInsError(false);

            const data = await getStudentCheckIns(
                id,
                page,
            );

            setCheckIns(data.results);
            setCheckInsCount(data.count);
            setCheckInsNext(data.next);
            setCheckInsPrevious(data.previous);

            if (page === 1) {
                setLatestCheckIn(
                    data.results[0] ?? null,
                );
            }
        } catch (error) {
            console.error(error);

            setCheckIns([]);
            setCheckInsCount(0);
            setCheckInsNext(null);
            setCheckInsPrevious(null);

            if (page === 1) {
                setLatestCheckIn(null);
            }

            setCheckInsError(true);
        } finally {
            setLoadingCheckIns(false);
        }
    }


    useEffect(() => {
        loadEnrollments();
        loadCharges();
        loadTimeline();
        loadOperationalSummary();
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


    function handleTabChange(tab: StudentTab) {
        setActiveTab(tab);

        if (tab === "checkins") {
            setCheckInsPage(1);
            loadCheckIns(1);
        }
    }


    function handleCheckInsPageChange(page: number) {
        setCheckInsPage(page);
        loadCheckIns(page);
    }


    async function handleRegisterCheckIn(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!id) {
            return;
        }

        try {
            setRegisteringCheckIn(true);

            await createCheckIn(
                id,
                checkInNotes.trim(),
            );

            setCheckInsPage(1);
            await loadCheckIns(1);
            await loadOperationalSummary();
            await loadTimeline();

            setCheckInNotes("");
            setShowCheckInModal(false);
        } catch (error) {
            console.error(error);

            window.alert(
                "Não foi possível registrar o check-in. Tente novamente.",
            );
        } finally {
            setRegisteringCheckIn(false);
        }
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


    function getChargeStatusLabel(
        status: Charge["status"],
    ) {
        switch (status) {
            case "pending":
                return "Pendente";

            case "paid":
                return "Pago";

            case "overdue":
                return "Atrasado";

            case "canceled":
                return "Cancelado";

            default:
                return status;
        }
    }


    function getChargeStatusClass(
        status: Charge["status"],
    ) {
        switch (status) {
            case "paid":
                return "bg-emerald-50 text-emerald-700";

            case "pending":
                return "bg-amber-50 text-amber-700";

            case "overdue":
                return "bg-red-50 text-red-700";

            case "canceled":
                return "bg-slate-100 text-slate-600";

            default:
                return "bg-slate-100 text-slate-600";
        }
    }


    function getHistoryEventStyle(
        eventType: StudentTimelineEvent["type"],
    ) {
        switch (eventType) {
            case "enrollment_created":
                return {
                    icon: PlusCircle,
                    iconClass:
                        "bg-emerald-50 text-emerald-600",
                    badgeClass:
                        "bg-emerald-50 text-emerald-700",
                };

            case "enrollment_frozen":
                return {
                    icon: PauseCircle,
                    iconClass:
                        "bg-blue-50 text-blue-600",
                    badgeClass:
                        "bg-blue-50 text-blue-700",
                };

            case "enrollment_reactivated":
                return {
                    icon: PlayCircle,
                    iconClass:
                        "bg-emerald-50 text-emerald-600",
                    badgeClass:
                        "bg-emerald-50 text-emerald-700",
                };

            case "enrollment_canceled":
            case "charge_canceled":
                return {
                    icon: CircleX,
                    iconClass:
                        "bg-red-50 text-red-600",
                    badgeClass:
                        "bg-red-50 text-red-700",
                };

            case "enrollment_finished":
            case "payment_registered":
                return {
                    icon: CircleCheck,
                    iconClass:
                        "bg-slate-100 text-slate-600",
                    badgeClass:
                        "bg-slate-100 text-slate-600",
                };

            case "checkin_registered":
                return {
                    icon: DoorOpen,
                    iconClass:
                        "bg-blue-50 text-blue-600",
                    badgeClass:
                        "bg-blue-50 text-blue-700",
                };

            case "student_deactivated":
                return {
                    icon: CircleX,
                    iconClass: "bg-red-50 text-red-600",
                    badgeClass: "bg-red-50 text-red-700",
                };

            case "student_reactivated":
                return {
                    icon: PlayCircle,
                    iconClass: "bg-emerald-50 text-emerald-600",
                    badgeClass: "bg-emerald-50 text-emerald-700",
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
                <div className="space-y-4" aria-label="Carregando ficha do aluno">
                    <div className="h-40 animate-pulse rounded-[1.6rem] bg-slate-100" />
                    <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
                        <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
                    </div>
                </div>
            ) : error || !student ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8">
                    <h2 className="text-xl font-bold text-slate-900">
                        {studentErrorKind === "forbidden"
                            ? "Acesso não permitido"
                            : studentErrorKind === "not_found"
                                ? "Aluno não encontrado"
                                : "Não foi possível carregar o aluno"}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        {studentErrorKind === "forbidden"
                            ? "Seu usuário não possui permissão para consultar esta ficha."
                            : studentErrorKind === "not_found"
                                ? "O cadastro pode ter sido removido ou o endereço está incorreto."
                                : "Verifique a conexão e tente novamente."}
                    </p>

                    {studentErrorKind === "generic" && (
                        <button
                            type="button"
                            onClick={loadStudent}
                            className="mt-4 mr-5 text-sm font-semibold text-red-600 hover:text-red-700"
                        >
                            Tentar novamente
                        </button>
                    )}

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
                    <div className="relative overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.3)] sm:p-6">
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 via-cyan-400 to-transparent" />

                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-5">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-2xl font-black text-white shadow-[0_16px_35px_-18px_rgba(37,99,235,0.8)]">
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

                                        {student.financial_status === "regular" && (
                                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                Financeiro regular
                                            </span>
                                        )}

                                        {student.financial_status === "grace_period" && (
                                            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                                                {student.grace_days_remaining === null
                                                    ? "Em tolerância"
                                                    : `Em tolerância · ${student.grace_days_remaining} ${student.grace_days_remaining === 1
                                                        ? "dia restante"
                                                        : "dias restantes"
                                                    }`}
                                            </span>
                                        )}

                                        {student.financial_status === "defaulting" && (
                                            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                Inadimplente
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

                            <div className="flex shrink-0 flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowEnrollmentModal(true)
                                    }
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                    <PlusCircle size={16} />
                                    Adicionar plano
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowCheckInModal(true)}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <DoorOpen size={16} />
                                    Registrar check-in
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setOpenEditModal(true)}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <Pencil size={16} />
                                    Editar aluno
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-5">
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Resumo operacional
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Situação atual calculada a partir dos dados registrados.
                                    </p>
                                </div>

                                {operationalSummaryError && (
                                    <button
                                        type="button"
                                        onClick={loadOperationalSummary}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                    >
                                        Tentar novamente
                                    </button>
                                )}
                            </div>

                            {loadingOperationalSummary ? (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Carregando resumo operacional">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                                        <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />
                                    ))}
                                </div>
                            ) : operationalSummaryError || !operationalSummary ? (
                                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                    O resumo operacional não está disponível no momento.
                                </p>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <OperationalItem
                                        label="Plano atual"
                                        value={
                                            operationalSummary.active_plans.length > 0
                                                ? operationalSummary.active_plans
                                                    .map((plan) => plan.name)
                                                    .join(", ")
                                                : "Sem plano ativo"
                                        }
                                    />
                                    <OperationalItem
                                        label="Próximo vencimento"
                                        value={
                                            operationalSummary.next_charge
                                                ? `${formatDate(operationalSummary.next_charge.due_date)} · ${formatMoney(operationalSummary.next_charge.amount)}`
                                                : "Sem cobrança em aberto"
                                        }
                                        tone={
                                            operationalSummary.next_charge?.status === "overdue"
                                                ? "danger"
                                                : "default"
                                        }
                                    />
                                    <OperationalItem
                                        label="Último check-in"
                                        value={
                                            operationalSummary.latest_checkin_at
                                                ? formatDateTime(operationalSummary.latest_checkin_at)
                                                : "Nenhum check-in"
                                        }
                                    />
                                    <OperationalItem
                                        label="Frequência · 30 dias"
                                        value={`${operationalSummary.checkins_last_30_days} ${operationalSummary.checkins_last_30_days === 1 ? "check-in" : "check-ins"}`}
                                    />
                                    <OperationalItem
                                        label="Treino atual"
                                        value={operationalSummary.current_workout?.name ?? "Sem treino ativo"}
                                        tone={operationalSummary.current_workout ? "default" : "muted"}
                                    />
                                    <OperationalItem
                                        label="Próxima avaliação"
                                        value="Ainda não disponível"
                                        tone="muted"
                                    />
                                    <OperationalItem
                                        label="Responsável"
                                        value={operationalSummary.current_workout?.instructor ?? "Ainda não disponível"}
                                        tone={operationalSummary.current_workout ? "default" : "muted"}
                                    />
                                    <OperationalItem
                                        label="Risco de evasão"
                                        value="Ainda não calculado"
                                        tone="muted"
                                    />
                                </div>
                            )}
                        </div>
                    </div>


                    {/* ABAS */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 pt-1 shadow-[0_14px_35px_-30px_rgba(15,23,42,0.25)]">
                        <nav className="flex gap-7 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() =>
                                        handleTabChange(tab.id)
                                    }
                                    className={
                                        activeTab === tab.id
                                            ? "whitespace-nowrap border-b-2 border-blue-600 px-1 py-3.5 text-sm font-semibold text-blue-600"
                                            : "whitespace-nowrap border-b-2 border-transparent px-1 py-3.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
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
                                <div className="space-y-3" aria-label="Carregando planos do aluno">
                                    {[1, 2].map((item) => (
                                        <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
                                    ))}
                                </div>
                            ) : enrollmentsErrorKind ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                                    <h3 className="font-semibold text-red-700">
                                        {enrollmentsErrorKind === "forbidden"
                                            ? "Acesso não permitido"
                                            : "Não foi possível carregar os planos"}
                                    </h3>
                                    <p className="mt-1 text-sm text-red-600">
                                        {enrollmentsErrorKind === "forbidden"
                                            ? "Seu usuário não possui permissão para consultar as matrículas."
                                            : "Verifique a conexão e tente novamente."}
                                    </p>
                                    {enrollmentsErrorKind !== "forbidden" && (
                                        <button
                                            type="button"
                                            onClick={loadEnrollments}
                                            className="mt-4 text-sm font-semibold text-red-700 underline underline-offset-4"
                                        >
                                            Tentar novamente
                                        </button>
                                    )}
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


                    {/* FINANCEIRO */}
                    {activeTab === "financial" && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Financeiro do aluno
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Acompanhe cobranças, pagamentos e vencimentos.
                                </p>
                            </div>

                            {loadingCharges ? (
                                <div className="space-y-3" aria-label="Carregando financeiro do aluno">
                                    <div className="grid gap-3 md:grid-cols-3">
                                        {[1, 2, 3].map((item) => (
                                            <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                                        ))}
                                    </div>
                                    <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
                                </div>
                            ) : chargesError ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                                    <h3 className="font-semibold text-red-700">
                                        Não foi possível carregar o financeiro
                                    </h3>

                                    <p className="mt-1 text-sm text-red-600">
                                        Verifique a conexão e tente novamente.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={loadCharges}
                                        className="mt-4 text-sm font-semibold text-red-700 underline underline-offset-4"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <p className="text-sm font-medium text-slate-500">
                                                Total de cobranças
                                            </p>

                                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                                {charges.length}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <p className="text-sm font-medium text-slate-500">
                                                Total pago
                                            </p>

                                            <p className="mt-2 text-2xl font-bold text-emerald-600">
                                                {formatMoney(
                                                    charges
                                                        .filter(
                                                            (charge) =>
                                                                charge.status === "paid",
                                                        )
                                                        .reduce(
                                                            (total, charge) =>
                                                                total +
                                                                Number(charge.amount),
                                                            0,
                                                        )
                                                        .toFixed(2),
                                                )}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <p className="text-sm font-medium text-slate-500">
                                                Em aberto
                                            </p>

                                            <p className="mt-2 text-2xl font-bold text-amber-600">
                                                {formatMoney(
                                                    charges
                                                        .filter(
                                                            (charge) =>
                                                                charge.status === "pending" ||
                                                                charge.status === "overdue",
                                                        )
                                                        .reduce(
                                                            (total, charge) =>
                                                                total +
                                                                Number(charge.amount),
                                                            0,
                                                        )
                                                        .toFixed(2),
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {charges.length === 0 ? (
                                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                                            <h3 className="font-semibold text-slate-900">
                                                Nenhuma cobrança encontrada
                                            </h3>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Este aluno ainda não possui cobranças registradas.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="border-b border-slate-200 bg-slate-50">
                                                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                            <th className="px-6 py-4">
                                                                Descrição
                                                            </th>
                                                            <th className="px-6 py-4">
                                                                Plano
                                                            </th>
                                                            <th className="px-6 py-4">
                                                                Vencimento
                                                            </th>
                                                            <th className="px-6 py-4">
                                                                Valor
                                                            </th>
                                                            <th className="px-6 py-4">
                                                                Status
                                                            </th>
                                                            <th className="px-6 py-4">
                                                                Pagamento
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody className="divide-y divide-slate-100">
                                                        {charges.map((charge) => (
                                                            <tr
                                                                key={charge.id}
                                                                className="text-sm text-slate-700"
                                                            >
                                                                <td className="px-6 py-4 font-medium text-slate-900">
                                                                    {charge.description}
                                                                </td>

                                                                <td className="px-6 py-4">
                                                                    {charge.plan_name}
                                                                </td>

                                                                <td className="px-6 py-4">
                                                                    {formatDate(
                                                                        charge.due_date,
                                                                    )}
                                                                </td>

                                                                <td className="px-6 py-4 font-semibold">
                                                                    {formatMoney(
                                                                        charge.amount,
                                                                    )}
                                                                </td>

                                                                <td className="px-6 py-4">
                                                                    <span
                                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getChargeStatusClass(
                                                                            charge.status,
                                                                        )}`}
                                                                    >
                                                                        {getChargeStatusLabel(
                                                                            charge.status,
                                                                        )}
                                                                    </span>
                                                                </td>

                                                                <td className="px-6 py-4">
                                                                    {charge.paid_at
                                                                        ? formatDateTime(
                                                                            charge.paid_at,
                                                                        )
                                                                        : "—"}
                                                                </td>

                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}


                    {/* CHECK-INS */}
                    {activeTab === "checkins" && (
                        <div className="space-y-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Histórico de check-ins
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Consulte os acessos registrados para este aluno.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCheckInModal(true)
                                    }
                                    disabled={registeringCheckIn}
                                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <DoorOpen size={17} />

                                    {registeringCheckIn
                                        ? "Registrando..."
                                        : "Registrar check-in"}
                                </button>
                            </div>

                            {loadingCheckIns ? (
                                <div className="space-y-3" aria-label="Carregando check-ins do aluno">
                                    {[1, 2, 3].map((item) => (
                                        <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                                    ))}
                                </div>
                            ) : checkInsError ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                                    <h3 className="font-semibold text-red-700">
                                        Não foi possível carregar os check-ins
                                    </h3>

                                    <p className="mt-1 text-sm text-red-600">
                                        Tente novamente ou atualize a página.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            loadCheckIns(checkInsPage)
                                        }
                                        className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-xs font-semibold text-white transition hover:bg-red-700"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            ) : checkInsCount === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <DoorOpen size={20} />
                                    </div>

                                    <h3 className="mt-4 font-semibold text-slate-900">
                                        Nenhum check-in registrado
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Os próximos acessos deste aluno aparecerão aqui.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <p className="text-sm font-medium text-slate-500">
                                                Total de check-ins
                                            </p>

                                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                                {checkInsCount}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <p className="text-sm font-medium text-slate-500">
                                                Último check-in
                                            </p>

                                            <p className="mt-2 text-base font-bold text-blue-600">
                                                {latestCheckIn
                                                    ? formatDateTime(
                                                        latestCheckIn.checked_in_at,
                                                    )
                                                    : "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="border-b border-slate-200 bg-slate-50">
                                                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        <th className="px-6 py-4">
                                                            Data e horário
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Origem
                                                        </th>
                                                        <th className="px-6 py-4">
                                                            Observação
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody className="divide-y divide-slate-100">
                                                    {checkIns.map((checkIn) => (
                                                        <tr
                                                            key={checkIn.id}
                                                            className="text-sm text-slate-700"
                                                        >
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                                        <Clock3 size={17} />
                                                                    </div>

                                                                    <span className="font-semibold text-slate-900">
                                                                        {formatDateTime(
                                                                            checkIn.checked_in_at,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                                    {checkIn.source_label}
                                                                </span>
                                                            </td>

                                                            <td className="px-6 py-4 text-slate-500">
                                                                {checkIn.notes || "—"}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {(checkInsPrevious || checkInsNext) && (
                                            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                                                <p className="text-sm text-slate-500">
                                                    Página {checkInsPage}
                                                </p>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleCheckInsPageChange(
                                                                Math.max(1, checkInsPage - 1),
                                                            )
                                                        }
                                                        disabled={!checkInsPrevious}
                                                        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Anterior
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleCheckInsPageChange(
                                                                checkInsPage + 1,
                                                            )
                                                        }
                                                        disabled={!checkInsNext}
                                                        className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Próxima
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
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
                                    Matrículas, cobranças, pagamentos e check-ins em uma única sequência.
                                </p>
                            </div>

                            {loadingHistory ? (
                                <div className="space-y-3" aria-label="Carregando histórico do aluno">
                                    {[1, 2, 3].map((item) => (
                                        <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                                    ))}
                                </div>
                            ) : historyError ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                                    <h3 className="font-semibold text-red-700">
                                        Não foi possível carregar o
                                        histórico
                                    </h3>

                                    <p className="mt-1 text-sm text-red-600">
                                        Verifique a conexão e tente novamente.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={loadTimeline}
                                        className="mt-4 text-sm font-semibold text-red-700 underline underline-offset-4"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            ) : timeline.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                        <History size={20} />
                                    </div>

                                    <h3 className="mt-4 font-semibold text-slate-900">
                                        Nenhum histórico encontrado
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Ainda não existem eventos operacionais registrados para este aluno.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="space-y-0">
                                        {timeline.map(
                                            (historyItem, index) => {
                                                const eventStyle =
                                                    getHistoryEventStyle(
                                                        historyItem.type,
                                                    );

                                                const EventIcon =
                                                    eventStyle.icon;

                                                const isLast =
                                                    index ===
                                                    timeline.length -
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
                                                                                historyItem.title
                                                                            }
                                                                        </h3>

                                                                        <span
                                                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${eventStyle.badgeClass}`}
                                                                        >
                                                                            {
                                                                                historyItem.category
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

                                                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                                                                        <span>{historyItem.context}</span>
                                                                        <span aria-hidden="true">•</span>
                                                                        <span>
                                                                            {historyItem.actor_name
                                                                                ? `Por ${historyItem.actor_name}`
                                                                                : "Responsável não registrado"}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-500">
                                                                    <CalendarDays
                                                                        size={
                                                                            15
                                                                        }
                                                                    />

                                                                    {formatDateTime(
                                                                        historyItem.occurred_at,
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

                    {activeTab === "workouts" && id && (
                        <StudentWorkoutSection studentId={id} />
                    )}


                    {/* ABAS QUE AINDA SERÃO DESENVOLVIDAS */}
                    {activeTab !== "overview" &&
                        activeTab !== "plans" &&
                        activeTab !== "financial" &&
                        activeTab !== "checkins" &&
                        activeTab !== "workouts" &&
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
                        await loadTimeline();
                        await loadOperationalSummary();
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
                        await loadTimeline();
                        await loadOperationalSummary();

                        setSelectedEnrollment(null);
                    }}
                />
            )}
            {openEditModal && student && (
                <Modal
                    open={openEditModal}
                    title="Editar Aluno"
                    onClose={() => setOpenEditModal(false)}
                >
                    <StudentForm
                        student={student}
                        onCancel={() => setOpenEditModal(false)}
                        onSuccess={async () => {
                            await loadStudent();
                            setOpenEditModal(false);
                        }}
                    />
                </Modal>
            )}


            <Modal
                open={showCheckInModal}
                title="Registrar check-in"
                maxWidth="md"
                onClose={() => {
                    if (!registeringCheckIn) {
                        setShowCheckInModal(false);
                        setCheckInNotes("");
                    }
                }}
            >
                <form onSubmit={handleRegisterCheckIn}>
                    <p className="text-sm leading-6 text-slate-500">
                        Confirme o acesso de {student?.name}. A observação é opcional.
                    </p>

                    <div className="mt-5">
                        <div className="flex items-center justify-between gap-4">
                            <label
                                htmlFor="checkin-notes"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Observação ou motivo
                            </label>

                            <span className="text-xs text-slate-400">
                                {checkInNotes.length}/255
                            </span>
                        </div>

                        <textarea
                            id="checkin-notes"
                            value={checkInNotes}
                            onChange={(event) =>
                                setCheckInNotes(event.target.value)
                            }
                            maxLength={255}
                            rows={4}
                            disabled={registeringCheckIn}
                            placeholder="Ex.: Entrada liberada manualmente pela recepção."
                            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setShowCheckInModal(false);
                                setCheckInNotes("");
                            }}
                            disabled={registeringCheckIn}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={registeringCheckIn}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <DoorOpen size={17} />

                            {registeringCheckIn
                                ? "Registrando..."
                                : "Confirmar check-in"}
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
