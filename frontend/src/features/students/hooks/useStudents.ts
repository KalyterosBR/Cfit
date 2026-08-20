import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
    getStudents,
    type StudentSegment,
} from "../services/student.service";
import type { Student } from "../types/student";

export type StudentStatusFilter = "all" | "active" | "inactive";

export default function useStudents() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const latestRequestId = useRef(0);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<StudentStatusFilter>(() => {
            const status = searchParams.get("status");

            return status === "active" || status === "inactive"
                ? status
                : "all";
        });
    const [segmentFilter, setSegmentFilter] =
        useState<StudentSegment>(() => {
            const segment = searchParams.get("segment");

            return segment === "defaulting" ||
                segment === "without_plan" ||
                segment === "without_recent_checkin"
                ? segment
                : "all";
        });

    async function loadStudents() {
        const requestId = latestRequestId.current + 1;
        latestRequestId.current = requestId;

        try {
            setLoading(true);
            setError(false);

            const data = await getStudents(
                search,
                statusFilter,
                segmentFilter,
            );
            if (requestId === latestRequestId.current) {
                setStudents(data.results);
            }
        } catch (error) {
            console.error(error);

            if (requestId === latestRequestId.current) {
                setStudents([]);
                setError(true);
            }
        } finally {
            if (requestId === latestRequestId.current) {
                setLoading(false);
            }
        }
    }

    useEffect(() => {
        latestRequestId.current += 1;
        setLoading(true);

        const searchTimer = window.setTimeout(() => {
            loadStudents();
        }, 300);

        return () => window.clearTimeout(searchTimer);
    }, [search, statusFilter, segmentFilter]);

    function changeStatusFilter(status: StudentStatusFilter) {
        setStatusFilter(status);

        const nextParams = new URLSearchParams(searchParams);

        if (status === "all") {
            nextParams.delete("status");
        } else {
            nextParams.set("status", status);
        }

        setSearchParams(nextParams, { replace: true });
    }

    function changeSegmentFilter(segment: StudentSegment) {
        setSegmentFilter(segment);

        const nextParams = new URLSearchParams(searchParams);

        if (segment === "all") {
            nextParams.delete("segment");
        } else {
            nextParams.set("segment", segment);
        }

        setSearchParams(nextParams, { replace: true });
    }

    return {
        students,
        loading,
        error,
        search,
        setSearch,
        statusFilter,
        setStatusFilter: changeStatusFilter,
        segmentFilter,
        setSegmentFilter: changeSegmentFilter,
        loadStudents,
    };
}
