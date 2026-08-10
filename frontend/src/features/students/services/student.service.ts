import { Api } from "../../../services/http";

type StudentPayload = {
    name: string;
    cpf: string;
    phone: string;

    birth_date: string | null;
    email: string | null;

    cep: string | null;
    street: string | null;
    number: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;

    emergency_contact: string | null;
    emergency_phone: string | null;
};

export async function getStudents(search = "") {
    const response = await Api.get("/students/", {
        params: {
            search,
        },
    });

    return response.data;
}

export async function getStudent(id: string) {
    const response = await Api.get(
        `/students/${id}/`,
    );

    return response.data;
}

export async function createStudent(
    data: StudentPayload,
) {
    const response = await Api.post(
        "/students/",
        data,
    );

    return response.data;
}

export async function updateStudent(
    id: string,
    data: StudentPayload,
) {
    const response = await Api.put(
        `/students/${id}/`,
        data,
    );

    return response.data;
}

export async function deactivateStudent(id: string) {
    const response = await Api.post(
        `/students/${id}/deactivate/`,
    );

    return response.data;
}

export async function activateStudent(id: string) {
    const response = await Api.post(
        `/students/${id}/activate/`,
    );

    return response.data;
}

export async function deleteStudent(id: string) {
    await Api.delete(`/students/${id}/`);
}