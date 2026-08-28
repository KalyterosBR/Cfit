import { useEffect, useState } from "react";
import { cepMask, cpfMask, isValidCpf, isValidEmail, normalizeEmail, phoneMask } from "../../../utils/masks";
import axios from "axios";

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
    const [emailOptIn, setEmailOptIn] = useState(false);
    const [whatsappOptIn, setWhatsappOptIn] = useState(false);

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
        phone: "",
        birthDate: "",
        email: "",
        cep: "",
        state: "",
        emergencyPhone: "",
    });

    useEffect(() => {
        setName(student?.name ?? "");
        setCpf(cpfMask(student?.cpf ?? ""));
        setPhone(phoneMask(student?.phone ?? ""));

        setBirthDate(student?.birth_date ?? "");
        setEmail(student?.email ?? "");
        setEmailOptIn(student?.email_opt_in ?? false);
        setWhatsappOptIn(student?.whatsapp_opt_in ?? false);

        setCep(cepMask(student?.cep ?? ""));
        setStreet(student?.street ?? "");
        setNumber(student?.number ?? "");
        setNeighborhood(student?.neighborhood ?? "");
        setCity(student?.city ?? "");
        setState(student?.state ?? "");

        setEmergencyContact(
            student?.emergency_contact ?? "",
        );

        setEmergencyPhone(
            phoneMask(student?.emergency_phone ?? ""),
        );

        setErrors({
            name: "",
            cpf: "",
            phone: "",
            birthDate: "",
            email: "",
            cep: "",
            state: "",
            emergencyPhone: "",
        });
    }, [student]);

    useEffect(() => {
        const cleanCep = cep.replace(/\D/g, "");

        if (cleanCep.length !== 8) {
            setLoadingCep(false);
            setErrors((current) => ({
                ...current,
                cep: "",
            }));
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
            phone: "",
            birthDate: "",
            email: "",
            cep: "",
            state: "",
            emergencyPhone: "",
        };

        if (!name.trim()) {
            newErrors.name =
                "Informe o nome do aluno.";
        }

        if (!isValidCpf(cpf)) {
            newErrors.cpf =
                "Informe um CPF válido.";
        }

        const phoneDigits = phone.replace(/\D/g, "");

        if (!phoneDigits) {
            newErrors.phone = "Informe o telefone do aluno.";
        } else if (![10, 11].includes(phoneDigits.length)) {
            newErrors.phone = "Informe um telefone com DDD válido.";
        }

        if (!birthDate) {
            newErrors.birthDate = "Informe a data de nascimento.";
        } else if (new Date(`${birthDate}T00:00:00`) > new Date()) {
            newErrors.birthDate = "A data de nascimento não pode ser futura.";
        }

        if (
            email.trim() &&
            !isValidEmail(email)
        ) {
            newErrors.email =
                "Informe um e-mail válido.";
        }

        const cepDigits = cep.replace(/\D/g, "");

        if (cepDigits && cepDigits.length !== 8) {
            newErrors.cep = "Informe um CEP completo.";
        } else if (errors.cep) {
            newErrors.cep = errors.cep;
        }

        if (state.trim() && !/^[A-Za-z]{2}$/.test(state.trim())) {
            newErrors.state = "Informe uma UF válida.";
        }

        const emergencyPhoneDigits = emergencyPhone.replace(/\D/g, "");

        if (
            emergencyPhoneDigits &&
            ![10, 11].includes(emergencyPhoneDigits.length)
        ) {
            newErrors.emergencyPhone =
                "Informe um telefone com DDD válido.";
        }

        setErrors(newErrors);

        if (
            newErrors.name ||
            newErrors.cpf ||
            newErrors.phone ||
            newErrors.birthDate ||
            newErrors.email ||
            newErrors.cep ||
            newErrors.state ||
            newErrors.emergencyPhone ||
            loadingCep
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
                email: email.trim() ? normalizeEmail(email) : null,
                email_opt_in: emailOptIn,
                whatsapp_opt_in: whatsappOptIn,

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

            if (axios.isAxiosError(error) && error.response?.data) {
                const apiErrors = error.response.data as Record<
                    string,
                    string[] | string
                >;
                const firstMessage = (field: string) => {
                    const value = apiErrors[field];

                    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
                };

                setErrors((current) => ({
                    ...current,
                    name: firstMessage("name") || current.name,
                    cpf: firstMessage("cpf") || current.cpf,
                    phone: firstMessage("phone") || current.phone,
                    birthDate:
                        firstMessage("birth_date") || current.birthDate,
                    email: firstMessage("email") || current.email,
                    cep: firstMessage("cep") || current.cep,
                    state: firstMessage("state") || current.state,
                    emergencyPhone:
                        firstMessage("emergency_phone") ||
                        current.emergencyPhone,
                }));
            }

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
        emailOptIn,
        setEmailOptIn,
        whatsappOptIn,
        setWhatsappOptIn,

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
