import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, AppState, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useTraining } from './TrainingProvider';
import SessionHistory from './SessionHistory';
import { completionPayload, counts, remainingRest, previousExercise, sessionSummary, type CompletedSession, type TrainingDraft, type TrainingWorkout } from './session';

export default function TrainingScreen({ workoutId, client = api }: { workoutId: string; client?: Pick<typeof api, 'authenticated'> }) {
  const insets = useSafeAreaInsets();
  const { draft, setDraft } = useTraining();
  const active = draft?.workout.id === workoutId ? draft : null;
  const [workout, setWorkout] = useState<TrainingWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<CompletedSession | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const operation = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const load = useCallback(async () => {
    setError(''); setLoading(true);
    try { setWorkout(await client.authenticated<TrainingWorkout>(`/users/portal/workouts/${workoutId}/`)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar seu treino.'); }
    finally { setLoading(false); }
  }, [workoutId, client]);
  useEffect(() => { let current = true; void client.authenticated<TrainingWorkout>(`/users/portal/workouts/${workoutId}/`).then(value => { if (current) setWorkout(value); }).catch(e => { if (current) setError(e instanceof Error ? e.message : 'Não foi possível carregar seu treino.'); }).finally(() => { if (current) setLoading(false); }); return () => { current = false; }; }, [workoutId, client]);
  useEffect(() => {
    const update = () => setClock(Date.now());
    const timer = setInterval(update, 500);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') update(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, []);

  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: true }); }, [active?.index]);

  function begin() {
    if (!workout || !workout.exercises.length || workout.exercises.some(item => item.sets < 1)) return;
    if (draft && draft.workout.id !== workout.id) {
      Alert.alert('Você tem um treino em andamento', 'Continue ou descarte a sessão anterior antes de começar outra.', [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Continuar sessão', onPress: () => router.replace({ pathname: '/treinar', params: { workoutId: draft.workout.id } }) },
      ]);
      return;
    }
    setDraft({ submissionId: randomUUID(), startedAt: new Date().toISOString(), endedAt: null, workout, index: 0, restUntil: null, results: workout.exercises.map(item => ({ id: item.id, completed: Array.from({ length: item.sets }, () => false), load: item.load ?? '' })) });
    setSaved(null); setError('');
  }
  function update(change: (value: TrainingDraft) => TrainingDraft) {
    setDraft(value => value?.workout.id === workoutId ? change(value) : value);
  }
  function toggleSet(index: number) {
    if (!active || active.endedAt || saving) return;
    const checked = !active.results[active.index].completed[index];
    const deadline = checked ? clock + active.workout.exercises[active.index].rest_seconds * 1000 : null;
    update(value => ({ ...value, restUntil: deadline, results: value.results.map((item, row) => row === value.index ? { ...item, completed: item.completed.map((done, set) => set === index ? checked : done) } : item) }));
  }
  async function finish() {
    if (!active || operation.current) return;
    operation.current = true; setSaving(true); setError('');
    try {
      const finalDraft = { ...active, endedAt: active.endedAt || new Date().toISOString(), restUntil: null };
      const payload = completionPayload(finalDraft);
      update(() => finalDraft);
      const result = await client.authenticated<CompletedSession>(`/users/portal/workouts/${workoutId}/`, payload);
      setSaved(result); setDraft(null);
      scroll.current?.scrollTo({ y: 0, animated: true });
      setWorkout(current => current ? { ...current, sessions: [result, ...current.sessions.filter(item => item.id !== result.id)].slice(0, 20) } : current);
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar seu treino.'); }
    finally { operation.current = false; setSaving(false); }
  }
  function discard() {
    Alert.alert('Descartar esta sessão?', 'As séries marcadas nesta sessão serão removidas. Seu histórico salvo será preservado.', [
      { text: 'Continuar treino', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => { setDraft(null); setError(''); } },
    ]);
  }
  const exercise = active?.workout.exercises[active.index];
  const result = active?.results[active.index];
  const previous = exercise ? previousExercise(workout?.sessions || [], exercise.id) : null;
  const savedSummary = saved ? sessionSummary(saved) : null;
  const progress = active ? counts(active) : null;
  const rest = remainingRest(active?.restUntil || null, clock);
  const elapsed = active ? Math.max(0, Math.floor(((active.endedAt ? new Date(active.endedAt).getTime() : clock) - new Date(active.startedAt).getTime()) / 60000)) : 0;
  const ready = workout?.status === 'active' && !!workout.exercises.length && workout.exercises.every(item => item.sets > 0);

  return <View style={s.page}>
    <StatusBar style="dark" />
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={active ? 'Pausar e voltar' : 'Voltar aos treinos'} disabled={saving} style={s.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/treinos')}><Ionicons name="chevron-back" size={22} color="#2266db" /><Text style={s.headerAction}>{active ? 'Voltar' : 'Treinos'}</Text></Pressable>
      <Text style={s.headerLabel}>TREINAR AGORA</Text>
    </View>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 28 }]}>
      {loading && !workout && !active ? <ActivityIndicator accessibilityLabel="Carregando ficha" color="#2266db" /> : null}
      {error ? <View style={s.error}><Text accessibilityRole="alert" style={s.errorText}>{error}</Text>{!workout && !active ? <Pressable accessibilityRole="button" onPress={() => void load()} style={s.button}><Text style={s.buttonText}>Tentar novamente</Text></Pressable> : null}</View> : null}
      {saved && savedSummary ? <View style={s.success}><Ionicons name="checkmark-circle" color="#047857" size={40} /><Text style={s.title}>Treino concluído!</Text><Text style={s.body}>Sua sessão foi salva. Confira o que você realizou.</Text><View style={s.prescription}><View style={s.prescriptionItem}><Text style={s.metricValue}>{savedSummary.duration ?? '—'} min</Text><Text style={s.label}>DURAÇÃO</Text></View><View style={s.prescriptionItem}><Text style={s.metricValue}>{savedSummary.exercises}</Text><Text style={s.label}>EXERCÍCIOS</Text></View><View style={s.prescriptionItem}><Text style={s.metricValue}>{savedSummary.sets}</Text><Text style={s.label}>SÉRIES</Text></View></View><View style={s.card}>{saved.exercises.map(item => <View key={item.id} style={s.historyRow}><Text style={s.rowTitle}>{item.name}</Text><Text style={s.muted}>{item.sets} × {item.repetitions} · {item.load === null ? 'Sem carga informada' : `${item.load} kg`}</Text></View>)}</View><Pressable accessibilityRole="button" style={s.button} onPress={() => router.replace('/(app)/treinos')}><Text style={s.buttonText}>Voltar aos treinos</Text></Pressable></View> : null}
      {active && exercise && result && progress ? <>
        <View style={s.sessionHeading}><Text style={[s.eyebrow, s.sessionName]}>{active.workout.name}</Text><View style={s.sessionClock}><Ionicons name="time-outline" size={16} color="#586980" /><Text style={s.sessionClockText}>{elapsed} min</Text></View></View>
        <View style={s.progressHeading}><Text style={s.muted}>Exercício {active.index + 1} de {active.workout.exercises.length}</Text><Text style={s.progressCount}>{progress.done}/{progress.total} séries</Text></View>
        <View style={s.track}><View style={[s.fill, { width: `${progress.done / progress.total * 100}%` }]} /></View>
        <View style={s.exercisePanel}><View style={s.exerciseCaption}><View style={s.exerciseIndex}><Text style={s.exerciseIndexText}>{String(active.index + 1).padStart(2, '0')}</Text></View><Text style={s.label}>EXERCÍCIO ATUAL</Text></View><Text style={s.exerciseTitle}>{exercise.name}</Text><View style={s.prescription}><View style={s.prescriptionItem}><Text style={s.metricValue}>{exercise.sets}</Text><Text style={s.label}>SÉRIES</Text></View><View style={s.prescriptionItem}><Text style={s.metricValue}>{exercise.repetitions}</Text><Text style={s.label}>REPETIÇÕES</Text></View><View style={s.prescriptionItem}><Text style={s.metricValue}>{exercise.rest_seconds}s</Text><Text style={s.label}>DESCANSO</Text></View></View></View>
        {exercise.instructions ? <View style={s.instructionPanel}><View style={s.instructionHeading}><Ionicons name="information-circle-outline" size={18} color="#2266db" /><Text style={s.instructionLabel}>Como executar</Text></View><Text style={s.instructions}>{exercise.instructions}</Text></View> : null}
        {exercise.notes ? <Text style={s.body}>{exercise.notes}</Text> : null}
        <View style={s.card}><Text style={s.label}>CARGA REALIZADA (KG)</Text>{previous ? <Text style={s.previousLoad}>Última vez: {previous.exercise.load === null ? 'sem carga informada' : `${previous.exercise.load} kg`} · {new Date(previous.scheduledFor + 'T12:00:00').toLocaleDateString('pt-BR')} · {previous.exercise.sets} × {previous.exercise.repetitions}</Text> : <Text style={s.muted}>Primeiro registro disponível para este exercício.</Text>}<TextInput accessibilityLabel="Carga realizada em quilogramas" editable={!saving && !active.endedAt} value={result.load} onChangeText={load => update(value => ({ ...value, results: value.results.map((item, index) => index === value.index ? { ...item, load } : item) }))} keyboardType="decimal-pad" maxLength={9} placeholder="Sem carga" placeholderTextColor="#66768b" style={s.input} /><Text style={s.muted}>Prescrição: {exercise.load === null ? 'sem carga informada' : `${exercise.load} kg`}. A carga realizada não altera a ficha do professor.</Text></View>
        <View style={s.seriesHeading}><Text style={s.seriesTitle}>Suas séries</Text><Text style={s.seriesCount}>{result.completed.filter(Boolean).length}/{exercise.sets} feitas</Text></View><Text style={s.muted}>Toque na série quando concluir.</Text>
        <View style={s.sets}>{result.completed.map((done, index) => <Pressable key={index} accessibilityRole="checkbox" accessibilityState={{ checked: done, disabled: saving || !!active.endedAt }} accessibilityLabel={`Série ${index + 1}`} disabled={saving || !!active.endedAt} onPress={() => toggleSet(index)} style={[s.set, done ? s.setDone : null]}><Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={done ? '#fff' : '#2266db'} /><View style={s.setCopy}><Text style={[s.setText, done ? s.setTextDone : null]}>Série {String(index + 1).padStart(2, '0')}</Text><Text style={[s.setDetail, done ? s.setDetailDone : null]}>{exercise.repetitions} repetições</Text></View><Text style={[s.setState, done ? s.setTextDone : null]}>{done ? 'Concluída' : 'A fazer'}</Text></Pressable>)}</View>
        {rest > 0 ? <View style={s.rest}><View><Text style={s.restLabel}>DESCANSO</Text><Text accessibilityLiveRegion="none" style={s.restTime}>{Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</Text></View><Pressable accessibilityRole="button" onPress={() => update(value => ({ ...value, restUntil: null }))} style={s.skip}><Text style={s.skipText}>Encerrar descanso</Text></Pressable></View> : active.restUntil !== null ? <Text accessibilityLiveRegion="polite" style={s.ready}>Descanso concluído. Continue quando estiver pronto.</Text> : null}
        <View style={s.navigation}><Pressable accessibilityRole="button" disabled={active.index === 0 || saving} style={[s.outline, active.index === 0 ? s.disabled : null]} onPress={() => update(value => ({ ...value, index: value.index - 1 }))}><Text style={s.outlineText}>Anterior</Text></Pressable><Pressable accessibilityRole="button" disabled={active.index === active.workout.exercises.length - 1 || saving} style={[s.outline, active.index === active.workout.exercises.length - 1 ? s.disabled : null]} onPress={() => update(value => ({ ...value, index: value.index + 1 }))}><Text style={s.outlineText}>Próximo →</Text></Pressable></View>
        <Pressable accessibilityRole="button" disabled={!progress.complete || saving} style={[s.button, !progress.complete || saving ? s.disabled : null]} onPress={() => void finish()}><Text style={s.buttonText}>{saving ? 'Salvando…' : active.endedAt ? 'Tentar salvar novamente' : 'Finalizar e salvar treino'}</Text></Pressable>
        {active.endedAt ? <Text style={s.muted}>A sessão terminou. Se o envio falhou, tente salvar novamente ou descarte para iniciar outra.</Text> : <Text style={s.muted}>Ao voltar, você pode retomar enquanto o aplicativo estiver aberto. Finalize para salvar no seu histórico.</Text>}
        <Pressable accessibilityRole="button" disabled={saving} onPress={discard} style={s.discard}><Text style={s.discardText}>Descartar sessão</Text></Pressable>
      </> : workout && !saved ? <>
        <View style={s.workoutHero}><View style={s.heroHeading}><Text style={s.heroLabel}>SUA FICHA DE TREINO</Text><Ionicons name="barbell-outline" size={26} color="#67e8f9" /></View><Text style={s.heroTitle}>{workout.name}</Text>{workout.objective ? <Text style={s.heroDescription}>{workout.objective}</Text> : null}<View style={s.heroMetrics}><View style={s.heroMetric}><Text style={s.heroNumber}>{workout.exercises.length}</Text><Text style={s.heroMetricLabel}>EXERCÍCIOS</Text></View><View style={s.heroMetric}><Text style={s.heroNumber}>{workout.exercises.reduce((sum, item) => sum + item.sets, 0)}</Text><Text style={s.heroMetricLabel}>SÉRIES NO TOTAL</Text></View></View><Pressable accessibilityRole="button" disabled={!ready} style={[s.button, !ready ? s.disabled : null]} onPress={begin}><Ionicons name="play" size={18} color="#fff" /><Text style={s.buttonText}>Iniciar sessão</Text></Pressable>{!ready ? <Text style={s.heroDescription}>É necessário um treino ativo com séries cadastradas para iniciar.</Text> : null}</View>
        {workout.exercises.length ? <><View style={s.seriesHeading}><Text style={s.seriesTitle}>Sequência do treino</Text><Text style={s.seriesCount}>{workout.exercises.length} exercícios</Text></View><View style={s.sequence}>{workout.exercises.map((item, index) => <View key={item.id} style={s.sequenceRow}><Text style={s.sequenceNumber}>{String(index + 1).padStart(2, '0')}</Text><View style={s.setCopy}><Text style={s.rowTitle}>{item.name}</Text><Text style={s.muted}>{item.sets} séries · {item.repetitions} repetições</Text><Text style={s.sequenceDetail}>{item.load === null ? 'Sem carga prescrita' : `${item.load} kg`} · descanso {item.rest_seconds}s</Text></View></View>)}</View></> : null}
      </> : null}
      {workout && !active ? <SessionHistory key={`${workout.id}-${saved?.id || "preview"}`} sessions={workout.sessions} /> : null}
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
  previousLoad: { color: '#2266db', fontSize: 12, lineHeight: 20, marginTop: 12, backgroundColor: '#edf4ff', padding: 12, borderRadius: 10 },
  workoutHero: { backgroundColor: '#14243c', borderRadius: 22, padding: 22, borderTopWidth: 3, borderTopColor: '#08b6d4' },
  heroHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heroLabel: { color: '#67e8f9', fontSize: 10, letterSpacing: 1.5, fontWeight: '800', flex: 1 },
  heroTitle: { color: '#fff', fontSize: 28, lineHeight: 36, fontWeight: '800', marginTop: 16, letterSpacing: -0.6 },
  heroDescription: { color: '#c1cede', fontSize: 13, lineHeight: 21, marginTop: 10 },
  heroMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, borderTopWidth: 1, borderTopColor: '#314158', paddingTop: 18, marginTop: 20 },
  heroMetric: { flexGrow: 1, gap: 5 }, heroNumber: { color: '#fff', fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  heroMetricLabel: { color: '#a8bad1', fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  sessionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, sessionName: { flex: 1, marginBottom: 0 },
  sessionClock: { flexDirection: 'row', alignItems: 'center', gap: 6 }, sessionClockText: { color: '#586980', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  exercisePanel: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#dce4ef', padding: 20, marginTop: 22 },
  exerciseCaption: { flexDirection: 'row', alignItems: 'center', gap: 10 }, exerciseIndex: { backgroundColor: '#edf4ff', borderRadius: 9, paddingVertical: 7, paddingHorizontal: 10 }, exerciseIndexText: { color: '#2266db', fontSize: 12, fontWeight: '800' },
  exerciseTitle: { color: '#14243c', fontSize: 25, lineHeight: 33, fontWeight: '800', letterSpacing: -0.5, marginTop: 14 },
  prescription: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, borderTopWidth: 1, borderTopColor: '#e5ebf3', paddingTop: 16, marginTop: 18 },
  prescriptionItem: { flexGrow: 1, gap: 6 }, metricValue: { color: '#14243c', fontSize: 19, lineHeight: 26, fontWeight: '800' },
  instructionPanel: { padding: 16, backgroundColor: '#edf4ff', borderRadius: 14, marginTop: 14 }, instructionHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 }, instructionLabel: { color: '#2266db', fontSize: 12, fontWeight: '800' },
  seriesHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 26 }, seriesTitle: { color: '#14243c', fontSize: 18, fontWeight: '800' }, seriesCount: { color: '#586980', fontSize: 12, fontWeight: '700' },
  setCopy: { flex: 1 }, setDetail: { color: '#66768b', fontSize: 12, marginTop: 4 }, setDetailDone: { color: '#dbeafe' }, setState: { color: '#66768b', fontSize: 11, fontWeight: '700' },
  sequence: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#dce4ef', overflow: 'hidden', marginTop: 14 }, sequenceRow: { flexDirection: 'row', gap: 14, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5ebf3' }, sequenceNumber: { color: '#2266db', fontSize: 13, fontWeight: '800', paddingTop: 2 }, sequenceDetail: { color: '#66768b', fontSize: 11, lineHeight: 18, marginTop: 4 },
  page: { flex: 1, backgroundColor: '#f4f7fb' },
  header: { backgroundColor: '#f4f7fb', borderBottomWidth: 1, borderBottomColor: '#e3eaf4', paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { minHeight: 44, flexDirection: 'row', gap: 5, alignItems: 'center', paddingRight: 12 }, headerAction: { color: '#2266db', fontWeight: '700', fontSize: 14 },
  headerLabel: { color: '#66768b', fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  content: { padding: 20, maxWidth: 640, width: '100%', alignSelf: 'center' },
  eyebrow: { color: '#2266db', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  title: { color: '#14243c', fontSize: 26, fontWeight: '800', lineHeight: 34, marginTop: 12 },
  body: { color: '#586980', fontSize: 14, lineHeight: 23, marginTop: 12 },
  muted: { color: '#66768b', fontSize: 12, lineHeight: 20, marginTop: 8 },
  section: { color: '#14243c', fontWeight: '800', fontSize: 18, marginTop: 24 },
  card: { backgroundColor: '#fff', borderColor: '#dce4ef', borderWidth: 1, borderRadius: 18, padding: 18, marginTop: 20 },
  button: { backgroundColor: '#2266db', borderRadius: 14, minHeight: 52, padding: 14, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 14 }, disabled: { opacity: 0.45 },
  progressHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, progressCount: { color: '#2266db', fontSize: 12, fontWeight: '800' },
  track: { height: 6, backgroundColor: '#dce4ef', borderRadius: 5, marginTop: 12, overflow: 'hidden' }, fill: { height: 6, backgroundColor: '#08b6d4' },
  instructions: { color: '#40536d', fontSize: 13, lineHeight: 22, marginTop: 8 },
  label: { color: '#66768b', fontSize: 10, letterSpacing: 1, fontWeight: '800' },
  input: { minHeight: 48, backgroundColor: '#f4f7fb', borderRadius: 12, padding: 12, color: '#14243c', fontSize: 20, fontWeight: '700', marginTop: 10 },
  sets: { gap: 10, marginTop: 16 },
  set: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 64, padding: 14, borderColor: '#dce4ef', borderWidth: 1, borderRadius: 14, backgroundColor: '#fff' },
  setDone: { backgroundColor: '#2266db', borderColor: '#2266db' }, setText: { color: '#14243c', fontWeight: '700', fontSize: 13 }, setTextDone: { color: '#fff' },
  rest: { backgroundColor: '#14243c', borderRadius: 18, padding: 18, marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  restLabel: { color: '#67e8f9', fontSize: 10, letterSpacing: 2, fontWeight: '800' }, restTime: { color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 8, fontVariant: ['tabular-nums'] },
  skip: { minHeight: 44, justifyContent: 'center' }, skipText: { color: '#cbd5e1', fontSize: 12, fontWeight: '700' },
  ready: { color: '#047857', fontSize: 13, marginTop: 20, lineHeight: 21 },
  navigation: { flexDirection: 'row', gap: 12, marginTop: 20 }, outline: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#dce4ef', borderRadius: 12, backgroundColor: '#fff' },
  outlineText: { color: '#2266db', fontWeight: '700', fontSize: 13 },
  discard: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, discardText: { color: '#b91c1c', fontSize: 12, fontWeight: '700' },
  error: { backgroundColor: '#fff1f2', borderRadius: 14, padding: 16, marginBottom: 20 }, errorText: { color: '#b91c1c', fontSize: 13, lineHeight: 21 },
  success: { paddingTop: 16 }, rowTitle: { color: '#14243c', fontSize: 14, fontWeight: '700', lineHeight: 22 },
  historyRow: { borderTopWidth: 1, borderTopColor: '#e5ebf3', paddingTop: 12, marginTop: 12 },
});
