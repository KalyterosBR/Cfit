import { Api } from "../../../services/http";

export async function getStudents(search = "") {
    const response = await Api.get("/students/", {
        params: {
            search,
        },
    });

    return response.data;
}

export async function createStudent(data: {
    name: string;
    cpf: string;
    phone: string;
}) {
    const response = await Api.post("/students/", data);

    return response.data;
}

export async function updateStudent(
    id: string,
    data: {
        name: string;
        cpf: string;
        phone: string;
    },
) {
    const response = await Api.put(
        `/students/${id}/`,
        data,
    );

    return response.data;
}

export async function deleteStudent(id: string) {
    await Api.delete(`/students/${id}/`);
}