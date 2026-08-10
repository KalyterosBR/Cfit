import { useEffect, useState } from "react";

import { getStudents } from "../services/student.service";
import type { Student } from "../types/student";

export type StudentStatusFilter = "all" | "active" | "inactive";

export default function useStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<StudentStatusFilter>("all");

    async function loadStudents() {
        try {
            const data = await getStudents(search);
            setStudents(data.results);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        loadStudents();
    }, [search]);

    const filteredStudents = students.filter((student) => {
        if (statusFilter === "active") {
            return student.active;
        }

        if (statusFilter === "inactive") {
            return !student.active;
        }

        return true;
    });

    return {
        students: filteredStudents,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        loadStudents,
    };
}