import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, AppState, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useTraining } from './TrainingProvider';
import { completionPayload, counts, remainingRest, type CompletedSession, type TrainingDraft, type TrainingWorkout } from './session';

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
      {saved ? <View style={s.success}><Ionicons name="checkmark-circle" color="#047857" size={40} /><Text style={s.title}>Treino salvo!</Text><Text style={s.body}>{saved.duration_minutes} min · Suas séries e cargas foram registradas no histórico.</Text><Pressable accessibilityRole="button" style={s.button} onPress={() => router.replace('/(app)/treinos')}><Text style={s.buttonText}>Voltar aos treinos</Text></Pressable></View> : null}
      {active && exercise && result && progress ? <>
        <Text style={s.eyebrow}>{active.workout.name}</Text>
        <View style={s.progressHeading}><Text style={s.muted}>Exercício {active.index + 1} de {active.workout.exercises.length}</Text><Text style={s.progressCount}>{progress.done}/{progress.total} séries</Text></View>
        <View style={s.track}><View style={[s.fill, { width: `${progress.done / progress.total * 100}%` }]} /></View>
        <Text style={s.title}>{exercise.name}</Text>
        <Text style={s.body}>{exercise.sets} séries · {exercise.repetitions} repetições · {elapsed} min de sessão</Text>
        {exercise.instructions ? <Text style={s.instructions}>{exercise.instructions}</Text> : null}
        {exercise.notes ? <Text style={s.body}>{exercise.notes}</Text> : null}
        <View style={s.card}><Text style={s.label}>CARGA REALIZADA (KG)</Text><TextInput accessibilityLabel="Carga realizada em quilogramas" editable={!saving && !active.endedAt} value={result.load} onChangeText={load => update(value => ({ ...value, results: value.results.map((item, index) => index === value.index ? { ...item, load } : item) }))} keyboardType="decimal-pad" maxLength={9} placeholder="Sem carga" placeholderTextColor="#66768b" style={s.input} /><Text style={s.muted}>Prescrição: {exercise.load === null ? 'sem carga informada' : `${exercise.load} kg`}. A carga realizada não altera a ficha do professor.</Text></View>
        <Text style={s.section}>Marque as séries realizadas</Text>
        <View style={s.sets}>{result.completed.map((done, index) => <Pressable key={index} accessibilityRole="checkbox" accessibilityState={{ checked: done, disabled: saving || !!active.endedAt }} accessibilityLabel={`Série ${index + 1}`} disabled={saving || !!active.endedAt} onPress={() => toggleSet(index)} style={[s.set, done ? s.setDone : null]}><Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={done ? '#fff' : '#2266db'} /><Text style={[s.setText, done ? s.setTextDone : null]}>Série {index + 1}</Text></Pressable>)}</View>
        {rest > 0 ? <View style={s.rest}><View><Text style={s.restLabel}>DESCANSO</Text><Text accessibilityLiveRegion="none" style={s.restTime}>{Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</Text></View><Pressable accessibilityRole="button" onPress={() => update(value => ({ ...value, restUntil: null }))} style={s.skip}><Text style={s.skipText}>Encerrar descanso</Text></Pressable></View> : active.restUntil !== null ? <Text accessibilityLiveRegion="polite" style={s.ready}>Descanso concluído. Continue quando estiver pronto.</Text> : null}
        <View style={s.navigation}><Pressable accessibilityRole="button" disabled={active.index === 0 || saving} style={[s.outline, active.index === 0 ? s.disabled : null]} onPress={() => update(value => ({ ...value, index: value.index - 1 }))}><Text style={s.outlineText}>Anterior</Text></Pressable><Pressable accessibilityRole="button" disabled={active.index === active.workout.exercises.length - 1 || saving} style={[s.outline, active.index === active.workout.exercises.length - 1 ? s.disabled : null]} onPress={() => update(value => ({ ...value, index: value.index + 1 }))}><Text style={s.outlineText}>Próximo →</Text></Pressable></View>
        <Pressable accessibilityRole="button" disabled={!progress.complete || saving} style={[s.button, !progress.complete || saving ? s.disabled : null]} onPress={() => void finish()}><Text style={s.buttonText}>{saving ? 'Salvando…' : active.endedAt ? 'Tentar salvar novamente' : 'Finalizar e salvar treino'}</Text></Pressable>
        {active.endedAt ? <Text style={s.muted}>A sessão terminou. Se o envio falhou, tente salvar novamente ou descarte para iniciar outra.</Text> : <Text style={s.muted}>Ao voltar, você pode retomar enquanto o aplicativo estiver aberto. Finalize para salvar no seu histórico.</Text>}
        <Pressable accessibilityRole="button" disabled={saving} onPress={discard} style={s.discard}><Text style={s.discardText}>Descartar sessão</Text></Pressable>
      </> : workout && !saved ? <>
        <Text style={s.eyebrow}>SUA FICHA</Text><Text style={s.title}>{workout.name}</Text><Text style={s.body}>{workout.objective}</Text>
        <View style={s.card}><Text style={s.section}>{workout.exercises.length} exercícios</Text><Text style={s.body}>Acompanhe cada série, registre a carga realizada e respeite o descanso indicado pelo professor.</Text><Pressable accessibilityRole="button" disabled={!ready} style={[s.button, !ready ? s.disabled : null]} onPress={begin}><Text style={s.buttonText}>Iniciar sessão</Text></Pressable>{!ready ? <Text style={s.muted}>É necessário um treino ativo com séries cadastradas para iniciar.</Text> : null}</View>
        <Text style={s.section}>Últimas sessões</Text><Text style={s.muted}>Até 20 sessões concluídas desta ficha.</Text>
        {workout.sessions.length ? workout.sessions.map(session => <View key={session.id} style={s.card}><Text style={s.rowTitle}>{new Date(session.scheduled_for + 'T12:00:00').toLocaleDateString('pt-BR')} · {session.duration_minutes ?? '—'} min</Text>{session.exercises.length ? session.exercises.map(item => <View key={item.id} style={s.historyRow}><Text style={s.rowTitle}>{item.name}</Text><Text style={s.muted}>{item.sets} × {item.repetitions} · {item.load === null ? 'Sem carga informada' : `${item.load} kg`}</Text></View>) : <Text style={s.muted}>Sessão registrada pela academia, sem detalhamento de cargas.</Text>}</View>) : <Text style={s.body}>Seu histórico aparecerá aqui depois do primeiro treino salvo.</Text>}
      </> : null}
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
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
  button: { backgroundColor: '#2266db', borderRadius: 14, minHeight: 52, padding: 14, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 14 }, disabled: { opacity: 0.45 },
  progressHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, progressCount: { color: '#2266db', fontSize: 12, fontWeight: '800' },
  track: { height: 5, backgroundColor: '#dce4ef', borderRadius: 5, marginTop: 12, overflow: 'hidden' }, fill: { height: 5, backgroundColor: '#08b6d4' },
  instructions: { color: '#40536d', backgroundColor: '#edf4ff', borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 22, marginTop: 16 },
  label: { color: '#66768b', fontSize: 10, letterSpacing: 1, fontWeight: '800' },
  input: { minHeight: 48, backgroundColor: '#f4f7fb', borderRadius: 12, padding: 12, color: '#14243c', fontSize: 20, fontWeight: '700', marginTop: 10 },
  sets: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  set: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 52, padding: 14, borderColor: '#dce4ef', borderWidth: 1, borderRadius: 14, backgroundColor: '#fff' },
  setDone: { backgroundColor: '#2266db', borderColor: '#2266db' }, setText: { color: '#14243c', fontWeight: '700', fontSize: 13 }, setTextDone: { color: '#fff' },
  rest: { backgroundColor: '#14243c', borderRadius: 18, padding: 18, marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  restLabel: { color: '#67e8f9', fontSize: 10, letterSpacing: 2, fontWeight: '800' }, restTime: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 8, fontVariant: ['tabular-nums'] },
  skip: { minHeight: 44, justifyContent: 'center' }, skipText: { color: '#cbd5e1', fontSize: 12, fontWeight: '700' },
  ready: { color: '#047857', fontSize: 13, marginTop: 20, lineHeight: 21 },
  navigation: { flexDirection: 'row', gap: 12, marginTop: 20 }, outline: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#dce4ef', borderRadius: 12, backgroundColor: '#fff' },
  outlineText: { color: '#2266db', fontWeight: '700', fontSize: 13 },
  discard: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, discardText: { color: '#b91c1c', fontSize: 12, fontWeight: '700' },
  error: { backgroundColor: '#fff1f2', borderRadius: 14, padding: 16, marginBottom: 20 }, errorText: { color: '#b91c1c', fontSize: 13, lineHeight: 21 },
  success: { paddingTop: 16 }, rowTitle: { color: '#14243c', fontSize: 14, fontWeight: '700', lineHeight: 22 },
  historyRow: { borderTopWidth: 1, borderTopColor: '#e5ebf3', paddingTop: 12, marginTop: 12 },
});
