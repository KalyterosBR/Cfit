import Input from "../../../components/Input";
import Button from "../../../components/Button";

import useStudentForm from "../hooks/useStudentForm";

import {
    cpfMask,
    phoneMask,
} from "../../../utils/masks";

import type { Student } from "../types/student";

interface StudentFormProps {
    student?: Student | null;
    onCancel: () => void;
    onSuccess: () => Promise<void>;
}

export default function StudentForm({
    student,
    onCancel,
    onSuccess,
}: StudentFormProps) {
    const {
        name,
        setName,
        cpf,
        setCpf,
        phone,
        setPhone,
        loading,
        errors,
        handleSubmit,
    } = useStudentForm({
        student,
        onSuccess,
        onCancel,
    });

    return (
        <div className="grid grid-cols-2 gap-4">

            <div className="col-span-2">
                <Input
                    label="Nome"
                    placeholder="Digite o nome do aluno"
                    value={name}
                    error={errors.name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div>
                <Input
                    label="CPF"
                    placeholder="000.000.000-00"
                    value={cpf}
                    error={errors.cpf}
                    onChange={(e) => setCpf(cpfMask(e.target.value))}
                />
            </div>

            <div>
                <Input
                    label="Telefone"
                    placeholder="(84) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(phoneMask(e.target.value))}
                />
            </div>

            <div className="col-span-2 flex justify-end gap-3 mt-6">

                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancelar
                </Button>

                <Button
                    type="button"
                    loading={loading}
                    onClick={handleSubmit}
                >
                    {student ? "Atualizar" : "Salvar"}
                </Button>

            </div>

        </div>
    );
}