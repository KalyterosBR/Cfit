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

export default function StudentsListPage() {
    const {
        students,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        loadStudents,
    } = useStudents();

    const [openModal, setOpenModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const [openConfirm, setOpenConfirm] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [studentToToggle, setStudentToToggle] = useState<Student | null>(null);

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
                await deactivateStudent(studentToToggle.id);
            } else {
                await activateStudent(studentToToggle.id);
            }

            await loadStudents();

            Toast.success.updated("Aluno");

            setOpenConfirm(false);
            setStudentToToggle(null);
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
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value as StudentStatusFilter,
                            )
                        }
                        className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
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

                <div className="mt-6">
                    <StudentsTable
                        students={students}
                        onEdit={handleEdit}
                        onToggleActive={handleToggleActive}
                    />
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
                onCancel={cancelToggleActive}
                onConfirm={confirmToggleActive}
            />
        </DashboardLayout>
    );
}