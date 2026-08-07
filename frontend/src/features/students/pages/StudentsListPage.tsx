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

import { deleteStudent } from "../services/student.service";

import type { Student } from "../types/student";

export default function StudentsListPage() {
    const {
        students,
        search,
        setSearch,
        loadStudents,
    } = useStudents();

    const [openModal, setOpenModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const [openConfirm, setOpenConfirm] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

    function handleEdit(student: Student) {
        setSelectedStudent(student);
        setOpenModal(true);
    }

    function handleNewStudent() {
        setSelectedStudent(null);
        setOpenModal(true);
    }

    function handleDelete(student: Student) {
        setStudentToDelete(student);
        setOpenConfirm(true);
    }

    async function confirmDelete() {
        if (!studentToDelete) return;

        try {
            setLoadingDelete(true);

            await deleteStudent(studentToDelete.id);
            await loadStudents();

            Toast.success.deleted("Aluno");

            setOpenConfirm(false);
            setStudentToDelete(null);
        } catch (error) {
            console.error(error);

            Toast.error.deleted("Aluno");
        } finally {
            setLoadingDelete(false);
        }
    }

    function cancelDelete() {
        setOpenConfirm(false);
        setStudentToDelete(null);
    }

    function closeModal() {
        setSelectedStudent(null);
        setOpenModal(false);
    }

    async function reloadStudents() {
        await loadStudents();
    }

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
                <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="mt-6">
                    <StudentsTable
                        students={students}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
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
                title="Excluir aluno"
                description={`Deseja realmente excluir "${studentToDelete?.name ?? ""}"?`}
                loading={loadingDelete}
                onCancel={cancelDelete}
                onConfirm={confirmDelete}
            />
        </DashboardLayout>
    );
}