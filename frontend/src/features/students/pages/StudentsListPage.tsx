import { useState } from "react";

import { Toast } from "../../../services/toast";

import DashboardLayout from "../../../layouts/DashboardLayout";

import Modal from "../../../components/Modal";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import PageHeader from "../../../components/PageHeader";
import SearchInput from "../../../components/SearchInput";
import ConfirmDialog from "../../../components/ConfirmDialog";

import useStudents from "../hooks/useStudents";

import StudentForm from "../components/StudentForm";
import StudentsTable from "../components/StudentsTable";

import {
    activateStudent,
    deactivateStudent,
} from "../services/student.service";

import type { Student } from "../types/student";
import type { StudentStatusFilter } from "../hooks/useStudents";
import type { StudentSegment } from "../services/student.service";

const segmentOptions: Array<{
    value: StudentSegment;
    label: string;
}> = [
    { value: "all", label: "Todos os alunos" },
    { value: "defaulting", label: "Inadimplentes" },
    { value: "without_plan", label: "Sem plano ativo" },
    {
        value: "without_recent_checkin",
        label: "Sem check-in há 30 dias",
    },
];

export default function StudentsListPage() {
    const {
        students,
        loading,
        error,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        segmentFilter,
        setSegmentFilter,
        loadStudents,
    } = useStudents();

    const [openModal, setOpenModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const [openConfirm, setOpenConfirm] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [studentToToggle, setStudentToToggle] = useState<Student | null>(null);
    const [deactivationReason, setDeactivationReason] = useState("");

    function handleEdit(student: Student) {
        setSelectedStudent(student);
        setOpenModal(true);
    }

    function handleNewStudent() {
        setSelectedStudent(null);
        setOpenModal(true);
    }

    function handleToggleActive(student: Student) {
        setStudentToToggle(student);
        setOpenConfirm(true);
    }

    async function confirmToggleActive() {
        if (!studentToToggle) return;

        try {
            setLoadingStatus(true);

            if (studentToToggle.active) {
                await deactivateStudent(
                    studentToToggle.id,
                    deactivationReason.trim(),
                );
            } else {
                await activateStudent(studentToToggle.id);
            }

            await loadStudents();

            Toast.success.updated("Aluno");

            setOpenConfirm(false);
            setStudentToToggle(null);
            setDeactivationReason("");
        } catch (error) {
            console.error(error);

            Toast.error.updated("Aluno");
        } finally {
            setLoadingStatus(false);
        }
    }

    function cancelToggleActive() {
        setOpenConfirm(false);
        setStudentToToggle(null);
        setDeactivationReason("");
    }

    function closeModal() {
        setSelectedStudent(null);
        setOpenModal(false);
    }

    async function reloadStudents() {
        await loadStudents();
    }

    const isDeactivating = studentToToggle?.active ?? false;

    return (
        <DashboardLayout>
            <PageHeader
                title="Alunos"
                subtitle="Gerencie todos os alunos da academia."
                actions={
                    <Button onClick={handleNewStudent}>
                        + Novo Aluno
                    </Button>
                }
            />

            <Card>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex-1">
                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Pesquisar por nome ou CPF..."
                            aria-label="Pesquisar alunos por nome ou CPF"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value as StudentStatusFilter,
                            )
                        }
                        className="h-10 rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-semibold text-slate-700 outline-none transition hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                    >
                        <option value="all">
                            Todos
                        </option>

                        <option value="active">
                            Ativos
                        </option>

                        <option value="inactive">
                            Inativos
                        </option>
                    </select>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Segmentos rápidos
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {segmentOptions.map((option) => {
                            const selected = segmentFilter === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                        setSegmentFilter(option.value)
                                    }
                                    aria-pressed={selected}
                                    className={
                                        selected
                                            ? "rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm"
                                            : "rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                    }
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="mt-6">
                    {loading ? (
                        <div className="space-y-3" aria-label="Carregando alunos">
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    key={item}
                                    className="h-16 animate-pulse rounded-xl bg-slate-100"
                                />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                            <h2 className="font-semibold text-red-700">
                                Não foi possível carregar os alunos
                            </h2>
                            <p className="mt-1 text-sm text-red-600">
                                Verifique a conexão e tente novamente.
                            </p>
                            <button
                                type="button"
                                onClick={loadStudents}
                                className="mt-4 text-sm font-semibold text-red-700 underline underline-offset-4"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : (
                        <StudentsTable
                            students={students}
                            emptyTitle={search || statusFilter !== "all" || segmentFilter !== "all"
                                ? "Nenhum aluno corresponde aos filtros"
                                : "Nenhum aluno cadastrado"}
                            emptyDescription={search || statusFilter !== "all" || segmentFilter !== "all"
                                ? "Altere a busca ou os filtros para consultar outros alunos."
                                : "Cadastre o primeiro aluno para iniciar a operação."}
                            onEdit={handleEdit}
                            onToggleActive={handleToggleActive}
                        />
                    )}
                </div>
            </Card>

            <Modal
                open={openModal}
                title={selectedStudent ? "Editar Aluno" : "Novo Aluno"}
                onClose={closeModal}
            >
                <StudentForm
                    student={selectedStudent}
                    onCancel={closeModal}
                    onSuccess={reloadStudents}
                />
            </Modal>

            <ConfirmDialog
                open={openConfirm}
                title={
                    isDeactivating
                        ? "Inativar aluno"
                        : "Reativar aluno"
                }
                description={
                    isDeactivating
                        ? `Deseja realmente inativar "${studentToToggle?.name ?? ""}"?`
                        : `Deseja realmente reativar "${studentToToggle?.name ?? ""}"?`
                }
                loading={loadingStatus}
                confirmDisabled={
                    isDeactivating && !deactivationReason.trim()
                }
                onCancel={cancelToggleActive}
                onConfirm={confirmToggleActive}
            >
                {isDeactivating && (
                    <div className="mt-5">
                        <label
                            htmlFor="deactivation-reason"
                            className="text-sm font-semibold text-slate-700"
                        >
                            Motivo da inativação
                        </label>
                        <textarea
                            id="deactivation-reason"
                            value={deactivationReason}
                            onChange={(event) =>
                                setDeactivationReason(event.target.value)
                            }
                            maxLength={500}
                            rows={4}
                            disabled={loadingStatus}
                            placeholder="Explique por que este aluno está sendo inativado."
                            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <p className="mt-1 text-xs text-slate-400">
                            Obrigatório · {deactivationReason.length}/500
                        </p>
                    </div>
                )}
            </ConfirmDialog>
        </DashboardLayout>
    );
}
