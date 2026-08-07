import { useEffect, useState } from "react";

import { Toast } from "../../../services/toast";

import {
    createStudent,
    updateStudent,
} from "../services/student.service";

import type { Student } from "../types/student";

interface UseStudentFormProps {
    student?: Student | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function useStudentForm({
    student,
    onSuccess,
    onCancel,
}: UseStudentFormProps) {
    const [name, setName] = useState("");
    const [cpf, setCpf] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState({
        name: "",
        cpf: "",
    });

    useEffect(() => {
        setName(student?.name ?? "");
        setCpf(student?.cpf ?? "");
        setPhone(student?.phone ?? "");
        setErrors({
            name: "",
            cpf: "",
        });
    }, [student]);

    async function handleSubmit() {
        const newErrors = {
            name: "",
            cpf: "",
        };

        if (!name.trim()) {
            newErrors.name = "Informe o nome do aluno.";
        }

        if (cpf.replace(/\D/g, "").length !== 11) {
            newErrors.cpf = "Informe um CPF válido.";
        }

        setErrors(newErrors);

        if (newErrors.name || newErrors.cpf) {
            return;
        }

        try {
            setLoading(true);

            const data = {
                name: name.trim(),
                cpf,
                phone,
            };

            if (student) {
                await updateStudent(student.id, data);

                Toast.success.updated("Aluno");
            } else {
                await createStudent(data);

                Toast.success.created("Aluno");
            }

            await onSuccess();

            onCancel();
        } catch (error) {
            console.error(error);

            if (student) {
                Toast.error.updated("Aluno");
            } else {
                Toast.error.created("Aluno");
            }
        } finally {
            setLoading(false);
        }
    }

    return {
        name,
        setName,
        cpf,
        setCpf,
        phone,
        setPhone,
        loading,
        errors,
        handleSubmit,
    };
}