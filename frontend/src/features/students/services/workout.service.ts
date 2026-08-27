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
    load_history?: WorkoutLoadRecord[];
}

export interface WorkoutLoadRecord {
    id: string;
    load: string | null;
    sets: number;
    repetitions: string;
    recorded_at: string;
    recorded_by_name: string;
    notes: string;
}

export interface WorkoutProgress {
    id: string;
    recorded_at: string;
    adherence_percentage: number;
    notes: string;
    created_by_name: string;
}

export interface WorkoutSession {
    id: string;
    scheduled_for: string;
    completed_at: string | null;
    status: "planned" | "completed" | "skipped";
    status_label: string;
    duration_minutes: number | null;
    notes: string;
}

export interface WorkoutTemplate {
    id: string;
    name: string;
    objective: string;
    description: string;
    active: boolean;
    exercises: WorkoutExercise[];
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
    sessions: WorkoutSession[];
    adherence_percentage: number | null;
    template: string | null;
    unit: string | null;
}

type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };

export async function getWorkoutPlans(params: { student?: string; status?: WorkoutStatus; review?: "overdue" | "upcoming"; instructor?: string; search?: string; page?: number } = {}): Promise<Page<WorkoutPlan>> {
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

export async function getExercises(search = "", page = 1): Promise<Page<Exercise>> {
    const response = await Api.get<Page<Exercise>>("/workouts/exercises/", { params: { search: search || undefined, page } });
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

export async function updateWorkoutExercise(id: string, payload: Partial<WorkoutExercise>): Promise<WorkoutExercise> {
    return (await Api.patch<WorkoutExercise>(`/workouts/plan-exercises/${id}/`, payload)).data;
}

export async function deleteWorkoutExercise(id: string): Promise<void> {
    await Api.delete(`/workouts/plan-exercises/${id}/`);
}

export async function getWorkoutTemplates(search = "", page = 1): Promise<Page<WorkoutTemplate>> {
    return (await Api.get<Page<WorkoutTemplate>>("/workouts/templates/", { params: { search: search || undefined, page } })).data;
}

export async function createWorkoutTemplate(payload: { name: string; objective: string; description: string }): Promise<WorkoutTemplate> {
    return (await Api.post<WorkoutTemplate>("/workouts/templates/", payload)).data;
}

export async function addTemplateExercise(payload: { template: string; exercise: string; sets: number; repetitions: string; load: string | null; rest_seconds: number; order: number; notes: string }): Promise<WorkoutExercise> {
    return (await Api.post<WorkoutExercise>("/workouts/template-exercises/", payload)).data;
}

export async function applyWorkoutTemplate(workout: string, template: string): Promise<WorkoutPlan> {
    return (await Api.post<{ workout: WorkoutPlan }>(`/workouts/plans/${workout}/apply-template/`, { template })).data.workout;
}

export async function createWorkoutSession(payload: { workout: string; scheduled_for: string; status: "planned" | "completed" | "skipped"; duration_minutes: number | null; notes: string }): Promise<WorkoutSession> {
    return (await Api.post<WorkoutSession>("/workouts/sessions/", payload)).data;
}
