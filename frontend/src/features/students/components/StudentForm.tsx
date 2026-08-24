import Input from "../../../components/Input";
import Button from "../../../components/Button";

import useStudentForm from "../hooks/useStudentForm";

import {
    cepMask,
    cpfMask,
    phoneMask,
} from "../../../utils/masks";

import type { Student } from "../types/student";

interface StudentFormProps {
    student?: Student | null;
    onCancel: () => void;
    onSuccess: () => void | Promise<void>;
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
    } = useStudentForm({
        student,
        onSuccess,
        onCancel,
    });

    return (
        <div className="space-y-6">
            {/* DADOS PESSOAIS */}
            <section>
                <div className="mb-4">
                    <h3 className="font-semibold text-slate-900">
                        Dados pessoais
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Informações principais do aluno. Campos com * são obrigatórios.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                    <div className="lg:col-span-4">
                        <Input
                            label="Nome *"
                            required
                            placeholder="Digite o nome do aluno"
                            value={name}
                            error={errors.name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                        />
                    </div>

                    <div>
                        <Input
                            label="CPF *"
                            required
                            placeholder="000.000.000-00"
                            value={cpf}
                            error={errors.cpf}
                            onChange={(e) =>
                                setCpf(
                                    cpfMask(e.target.value),
                                )
                            }
                        />
                    </div>

                    <div>
                        <Input
                            label="Telefone *"
                            required
                            placeholder="(84) 99999-9999"
                            value={phone}
                            error={errors.phone}
                            onChange={(e) =>
                                setPhone(
                                    phoneMask(e.target.value),
                                )
                            }
                        />
                    </div>

                    <div>
                        <Input
                            label="Data de nascimento *"
                            required
                            type="date"
                            value={birthDate}
                            error={errors.birthDate}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={(e) =>
                                setBirthDate(e.target.value)
                            }
                        />
                    </div>

                    <div>
                        <Input
                            label="E-mail"
                            type="email"
                            placeholder="aluno@email.com"
                            value={email}
                            error={errors.email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                        />
                    </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={whatsappOptIn} onChange={e=>setWhatsappOptIn(e.target.checked)}/> Autoriza comunicação por WhatsApp</label><label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={emailOptIn} onChange={e=>setEmailOptIn(e.target.checked)}/> Autoriza comunicação por e-mail</label></div>
            </section>

            {/* ENDEREÇO */}
            <section className="border-t border-slate-200 pt-6">
                <div className="mb-4">
                    <h3 className="font-semibold text-slate-900">
                        Endereço
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Informações de endereço do aluno.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <div className="lg:col-span-6">
                        <Input
                            label="CEP"
                            placeholder="00000-000"
                            value={cep}
                            error={errors.cep}
                            helperText={
                                loadingCep
                                    ? "Consultando CEP..."
                                    : undefined
                            }
                            onChange={(e) =>
                                setCep(
                                    cepMask(e.target.value),
                                )
                            }
                        />
                    </div>

                    <div className="lg:col-span-6">
                        <Input
                            label="Número"
                            placeholder="Ex: 120"
                            value={number}
                            onChange={(e) =>
                                setNumber(e.target.value)
                            }
                        />
                    </div>

                    <div className="lg:col-span-12">
                        <Input
                            label="Rua"
                            placeholder="Nome da rua"
                            value={street}
                            onChange={(e) =>
                                setStreet(e.target.value)
                            }
                        />
                    </div>

                    <div className="lg:col-span-5">
                        <Input
                            label="Bairro"
                            placeholder="Bairro"
                            value={neighborhood}
                            onChange={(e) =>
                                setNeighborhood(
                                    e.target.value,
                                )
                            }
                        />
                    </div>

                    <div className="lg:col-span-5">
                        <Input
                            label="Cidade"
                            placeholder="Cidade"
                            value={city}
                            onChange={(e) =>
                                setCity(e.target.value)
                            }
                        />
                    </div>

                    <div className="lg:col-span-2">
                        <Input
                            label="UF"
                            placeholder="RN"
                            value={state}
                            error={errors.state}
                            onChange={(e) =>
                                setState(
                                    e.target.value
                                        .toUpperCase()
                                        .slice(0, 2),
                                )
                            }
                        />
                    </div>
                </div>
            </section>

            {/* CONTATO DE EMERGÊNCIA */}
            <section className="border-t border-slate-200 pt-6">
                <div className="mb-4">
                    <h3 className="font-semibold text-slate-900">
                        Contato de emergência
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Pessoa para contato em caso de emergência.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                        <Input
                            label="Nome do contato"
                            placeholder="Digite o nome do contato"
                            value={emergencyContact}
                            onChange={(e) =>
                                setEmergencyContact(
                                    e.target.value,
                                )
                            }
                        />
                    </div>

                    <div>
                        <Input
                            label="Telefone"
                            placeholder="(84) 99999-9999"
                            value={emergencyPhone}
                            error={errors.emergencyPhone}
                            onChange={(e) =>
                                setEmergencyPhone(
                                    phoneMask(e.target.value),
                                )
                            }
                        />
                    </div>
                </div>
            </section>

            {/* AÇÕES */}
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={loading || loadingCep}
                >
                    Cancelar
                </Button>

                <Button
                    type="button"
                    loading={loading}
                    disabled={loadingCep}
                    onClick={handleSubmit}
                >
                    {student ? "Atualizar" : "Salvar"}
                </Button>
            </div>
        </div>
    );
}
