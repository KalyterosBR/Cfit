import type { Student } from "../types/student";

interface StudentsTableProps {
    students: Student[];
    onEdit: (student: Student) => void;
    onDelete: (student: Student) => void;
}

export default function StudentsTable({
    students,
    onEdit,
    onDelete,
}: StudentsTableProps) {
    return (
        <table className="w-full">
            <thead>
                <tr className="border-b text-left">
                    <th className="py-3">Nome</th>
                    <th>CPF</th>
                    <th>Telefone</th>
                    <th>Status</th>
                    <th className="text-center">Ações</th>
                </tr>
            </thead>

            <tbody>
                {students.map((student) => (
                    <tr
                        key={student.id}
                        className="border-b hover:bg-slate-50 transition"
                    >
                        <td className="py-4">{student.name}</td>

                        <td>{student.cpf ?? "-"}</td>

                        <td>{student.phone ?? "-"}</td>

                        <td>
                            {student.active ? (
                                <span className="text-green-600 font-medium">
                                    Ativo
                                </span>
                            ) : (
                                <span className="text-red-600 font-medium">
                                    Inativo
                                </span>
                            )}
                        </td>

                        <td className="text-center">
                            <div className="flex justify-center gap-3">

                                <button
                                    onClick={() => onEdit(student)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    ✏️
                                </button>

                                <button
                                    onClick={() => onDelete(student)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    🗑️
                                </button>

                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}