import { useEffect, useState } from "react";

import { getStudents } from "../services/student.service";
import type { Student } from "../types/student";

export default function useStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [search, setSearch] = useState("");

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

    return {
        students,
        search,
        setSearch,
        loadStudents,
    };
}