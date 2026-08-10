import { useEffect, useState } from "react";

import { Toast } from "../../../services/toast";

import {
    createStudent,
    updateStudent,
} from "../services/student.service";

import { getAddressByCep } from "../services/cep.service";

import type { Student } from "../types/student";

interface UseStudentFormProps {
    student?: Student | null;
    onSuccess: () => void | Promise<void>;
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

    const [birthDate, setBirthDate] = useState("");
    const [email, setEmail] = useState("");

    const [cep, setCep] = useState("");
    const [street, setStreet] = useState("");
    const [number, setNumber] = useState("");
    const [neighborhood, setNeighborhood] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");

    const [emergencyContact, setEmergencyContact] = useState("");
    const [emergencyPhone, setEmergencyPhone] = useState("");

    const [loading, setLoading] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);

    const [errors, setErrors] = useState({
        name: "",
        cpf: "",
        email: "",
        cep: "",
    });

    useEffect(() => {
        setName(student?.name ?? "");
        setCpf(student?.cpf ?? "");
        setPhone(student?.phone ?? "");

        setBirthDate(student?.birth_date ?? "");
        setEmail(student?.email ?? "");

        setCep(student?.cep ?? "");
        setStreet(student?.street ?? "");
        setNumber(student?.number ?? "");
        setNeighborhood(student?.neighborhood ?? "");
        setCity(student?.city ?? "");
        setState(student?.state ?? "");

        setEmergencyContact(
            student?.emergency_contact ?? "",
        );

        setEmergencyPhone(
            student?.emergency_phone ?? "",
        );

        setErrors({
            name: "",
            cpf: "",
            email: "",
            cep: "",
        });
    }, [student]);

    useEffect(() => {
        const cleanCep = cep.replace(/\D/g, "");

        if (cleanCep.length !== 8) {
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                setLoadingCep(true);

                setErrors((current) => ({
                    ...current,
                    cep: "",
                }));

                const address =
                    await getAddressByCep(cleanCep);

                if (!address) {
                    setErrors((current) => ({
                        ...current,
                        cep: "CEP não encontrado.",
                    }));

                    return;
                }

                setCep(address.cep);
                setStreet(address.street);
                setNeighborhood(address.neighborhood);
                setCity(address.city);
                setState(address.state);
            } catch (error) {
                console.error(error);

                setErrors((current) => ({
                    ...current,
                    cep: "Não foi possível consultar o CEP.",
                }));
            } finally {
                setLoadingCep(false);
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [cep]);

    async function handleSubmit() {
        const newErrors = {
            name: "",
            cpf: "",
            email: "",
            cep: errors.cep,
        };

        if (!name.trim()) {
            newErrors.name =
                "Informe o nome do aluno.";
        }

        if (
            cpf.replace(/\D/g, "").length !== 11
        ) {
            newErrors.cpf =
                "Informe um CPF válido.";
        }

        if (
            email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email.trim(),
            )
        ) {
            newErrors.email =
                "Informe um e-mail válido.";
        }

        setErrors(newErrors);

        if (
            newErrors.name ||
            newErrors.cpf ||
            newErrors.email ||
            newErrors.cep
        ) {
            return;
        }

        try {
            setLoading(true);

            const data = {
                name: name.trim(),
                cpf,
                phone,

                birth_date: birthDate || null,
                email: email.trim() || null,

                cep: cep.trim() || null,
                street: street.trim() || null,
                number: number.trim() || null,
                neighborhood:
                    neighborhood.trim() || null,
                city: city.trim() || null,
                state:
                    state.trim().toUpperCase() ||
                    null,

                emergency_contact:
                    emergencyContact.trim() || null,

                emergency_phone:
                    emergencyPhone.trim() || null,
            };

            if (student) {
                await updateStudent(
                    student.id,
                    data,
                );

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

        birthDate,
        setBirthDate,

        email,
        setEmail,

        cep,
        setCep,

        street,
        setStreet,

        number,
        setNumber,

        neighborhood,
        setNeighborhood,

        city,
        setCity,

        state,
        setState,

        emergencyContact,
        setEmergencyContact,

        emergencyPhone,
        setEmergencyPhone,

        loading,
        loadingCep,
        errors,
        handleSubmit,
    };
}