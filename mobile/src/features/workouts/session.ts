export type TrainingExercise = { id: string; revision: string; name: string; instructions: string; notes: string; sets: number; repetitions: string; load: string | null; rest_seconds: number };
export type CompletedSession = { id: string; scheduled_for: string; completed_at: string; duration_minutes: number; exercises: { id: string; name: string; sets: number; repetitions: string; load: string | null }[] };
export type TrainingWorkout = { id: string; name: string; objective: string; status: string; exercises: TrainingExercise[]; sessions: CompletedSession[] };
export type TrainingDraft = { submissionId: string; startedAt: string; workout: TrainingWorkout; index: number; results: { id: string; completed: boolean[]; load: string }[]; restUntil: number | null; endedAt: string | null };
export function parseLoad(value: string): string | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(normalized)) throw new Error('Informe uma carga entre 0 e 99.999,99 kg, com até duas casas decimais.');
  return normalized;
}
export function counts(draft: TrainingDraft) {
  const total = draft.results.reduce((sum, item) => sum + item.completed.length, 0);
  const done = draft.results.reduce((sum, item) => sum + item.completed.filter(Boolean).length, 0);
  return { total, done, complete: total > 0 && done === total };
}
export function remainingRest(deadline: number | null, now: number) {
  return deadline === null ? 0 : Math.max(0, Math.ceil((deadline - now) / 1000));
}
export function completionPayload(draft: TrainingDraft) {
  if (!counts(draft).complete) throw new Error('Conclua todas as séries antes de finalizar.');
  return {
    submission_id: draft.submissionId, started_at: draft.startedAt,
    ended_at: draft.endedAt,
    exercises: draft.results.map(item => ({ id: item.id, revision: draft.workout.exercises.find(exercise => exercise.id === item.id)?.revision, completed_sets: item.completed.filter(Boolean).length, load: parseLoad(item.load) })),
  };
}
