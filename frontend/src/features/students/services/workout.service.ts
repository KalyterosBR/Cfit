import { Api } from "@/services/http";

export type WorkoutStatus = "active" | "completed" | "canceled";

export interface Exercise {
    id: string;
    name: string;
    muscle_group: string;
    instructions: string;
    active: boolean;
}

export interface WorkoutExercise {
    id: string;
    exercise: string;
    exercise_name: string;
    sets: number;
    repetitions: string;
    load: string | null;
    rest_seconds: number;
    order: number;
    notes: string;
}

export interface WorkoutProgress {
    id: string;
    recorded_at: string;
    adherence_percentage: number;
    notes: string;
    created_by_name: string;
}

export interface WorkoutPlan {
    id: string;
    student: string;
    student_name: string;
    name: string;
    objective: string;
    instructor_name: string;
    start_date: string;
    review_date: string | null;
    status: WorkoutStatus;
    status_label: string;
    notes: string;
    exercises: WorkoutExercise[];
    progress: WorkoutProgress[];
}

type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };

export async function getWorkoutPlans(params: { student?: string; status?: WorkoutStatus; search?: string } = {}): Promise<Page<WorkoutPlan>> {
    const response = await Api.get<Page<WorkoutPlan>>("/workouts/plans/", { params });
    return response.data;
}

export async function createWorkoutPlan(payload: { student: string; name: string; objective: string; start_date: string; review_date: string | null; notes: string }): Promise<WorkoutPlan> {
    const response = await Api.post<WorkoutPlan>("/workouts/plans/", payload);
    return response.data;
}

export async function updateWorkoutPlan(id: string, payload: Partial<WorkoutPlan>): Promise<WorkoutPlan> {
    const response = await Api.patch<WorkoutPlan>(`/workouts/plans/${id}/`, payload);
    return response.data;
}

export async function getExercises(search = ""): Promise<Page<Exercise>> {
    const response = await Api.get<Page<Exercise>>("/workouts/exercises/", { params: { search: search || undefined } });
    return response.data;
}

export async function createExercise(payload: { name: string; muscle_group: string; instructions: string }): Promise<Exercise> {
    const response = await Api.post<Exercise>("/workouts/exercises/", payload);
    return response.data;
}

export async function addWorkoutExercise(payload: { workout: string; exercise: string; sets: number; repetitions: string; load: string | null; rest_seconds: number; order: number; notes: string }): Promise<WorkoutExercise> {
    const response = await Api.post<WorkoutExercise>("/workouts/plan-exercises/", payload);
    return response.data;
}

export async function addWorkoutProgress(payload: { workout: string; recorded_at: string; adherence_percentage: number; notes: string }): Promise<WorkoutProgress> {
    const response = await Api.post<WorkoutProgress>("/workouts/progress/", payload);
    return response.data;
}
