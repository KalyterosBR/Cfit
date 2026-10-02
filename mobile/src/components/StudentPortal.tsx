import { useCallback, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, TextInput, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Logo from './Logo';
import PortalHistory, { type PortalHistoryData } from './PortalHistory';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../features/auth/AuthProvider';
import { useTraining } from '../features/workouts/TrainingProvider';
import { api } from '../services/api';

type Tab = 'Início' | 'Treinos' | 'Agenda' | 'Perfil';
type Portal = PortalHistoryData & {
  student: { id: string; name: string; email: string; phone: string };
  enrollments: { id: string; plan: string; status: string; start_date: string }[];
  workouts: { id: string; name: string; objective: string; review_date: string | null; exercises: { name: string; sets: number; repetitions: string; load: string; rest_seconds: number }[] }[];
  classes: { id: string; title: string; starts_at: string; location: string; capacity: number; confirmed_count: number; my_booking: { id: string; status: string } | null }[];
};
const statuses: Record<string, string> = { active: 'Ativa', inactive: 'Inativa', canceled: 'Cancelada', frozen: 'Congelada', expired: 'Encerrada', finished: 'Encerrada', confirmed: 'Confirmada', waitlist: 'Lista de espera', attended: 'Presença registrada', absent: 'Ausência registrada' };
const date = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
export default function StudentPortal({ tab }: { tab: Tab }) {
  const insets = useSafeAreaInsets();
  const { draft } = useTraining();
  const { profile, logout } = useAuth();
  const [now, setNow] = useState(() => Date.now());
  const [query, setQuery] = useState('');
  const [agendaFilter, setAgendaFilter] = useState<'upcoming' | 'mine' | 'past'>('upcoming');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<Portal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const version = useRef(0);
  const load = useCallback(async () => {
    const current = ++version.current;
    setLoading(true); setError('');
    try { const result = await api.authenticated<Portal>('/users/portal/me/'); if (current === version.current) setData(result); }
    catch (e) { if (current === version.current) setError(e instanceof Error ? e.message : 'Não foi possível carregar seus dados.'); }
    finally { if (current === version.current) setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => {
    setNow(Date.now());
    void load();
    const clock = setInterval(() => setNow(Date.now()), 60000);
    return () => { version.current += 1; clearInterval(clock); };
  }, [load]));
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
  const matches = (value: string) => value.toLocaleLowerCase('pt-BR').includes(normalizedQuery);
  const featuredWorkout = data?.workouts[0];
  const trainingId = draft?.workout.id || featuredWorkout?.id;
  const upcomingClasses = data?.classes.filter(item => new Date(item.starts_at).getTime() >= now) || [];
  const nextBooking = upcomingClasses.find(item => item.my_booking?.status === 'confirmed' || item.my_booking?.status === 'waitlist');
  const visibleClasses = data?.classes.filter(item => {
    const future = new Date(item.starts_at).getTime() >= now;
    const reserved = item.my_booking?.status === 'confirmed' || item.my_booking?.status === 'waitlist';
    return matches(item.title + ' ' + item.location) && (agendaFilter === 'past' ? !future : agendaFilter === 'mine' ? future && reserved : future);
  }) || [];
  const visibleWorkouts = data?.workouts.filter(item => matches(item.name + ' ' + item.objective + ' ' + item.exercises.map(exercise => exercise.name).join(' '))) || [];
  return <View style={s.app}>
    <StatusBar style="light" />
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      <View style={s.headerRow}><Logo variant="light" width={92} /><Pressable accessibilityRole="button" accessibilityLabel="Meu perfil" onPress={() => router.navigate('/(app)/perfil')} style={s.avatar}><Text style={s.avatarText}>{profile?.name.trim().slice(0, 1).toUpperCase() || 'C'}</Text></Pressable></View>
      <Text style={s.signature}>{profile?.academy?.name || 'SEU RITMO. SUA EVOLUÇÃO.'}</Text>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor="#2563eb" />}>
      <Text style={s.eyebrow}>ÁREA DO ALUNO</Text>
      <Text style={s.title}>{tab === 'Início' ? `Olá, ${profile?.name.split(' ')[0] || 'aluno'}.` : tab}</Text>
      <Text style={s.description}>{tab === 'Início' ? 'Sua academia, seu treino e sua rotina.' : tab === 'Treinos' ? 'As orientações da sua academia, no seu ritmo.' : tab === 'Agenda' ? 'Acompanhe as turmas e suas reservas.' : 'Seu vínculo com a academia.'}</Text>
      {tab === 'Treinos' || tab === 'Agenda' ? <View style={s.search}>
        <Ionicons name="search-outline" size={19} color="#66768b" />
        <TextInput style={s.searchInput} value={query} onChangeText={setQuery} placeholder={tab === 'Treinos' ? 'Buscar treino ou exercício' : 'Buscar turma ou local'} placeholderTextColor="#66768b" accessibilityLabel={tab === 'Treinos' ? 'Buscar treino ou exercício' : 'Buscar turma ou local'} autoCorrect={false} returnKeyType="search" />
        {query ? <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setQuery('')} style={s.clearSearch}><Ionicons name="close-circle" size={20} color="#66768b" /></Pressable> : null}
      </View> : null}
      {tab === 'Agenda' ? <View style={s.filters}>{([['upcoming', 'Próximas'], ['mine', 'Minhas reservas'], ['past', 'Anteriores']] as const).map(([value, label]) => <Pressable accessibilityRole="button" accessibilityState={{ selected: agendaFilter === value }} style={[s.filter, agendaFilter === value ? s.filterActive : null]} key={value} onPress={() => setAgendaFilter(value)}><Text style={[s.filterText, agendaFilter === value ? s.filterTextActive : null]}>{label}</Text></Pressable>)}</View> : null}
      {loading && !data ? <ActivityIndicator color="#2563eb" style={{ marginTop: 32 }} accessibilityLabel="Carregando seus dados" /> : null}
      {error ? <View style={s.block}><Text accessibilityRole="alert" style={{ color: '#b91c1c' }}>{error}</Text><Pressable style={s.retry} onPress={() => void load()}><Text style={{ color: '#2563eb', fontWeight: '700' }}>Tentar novamente</Text></Pressable></View> : null}
      {data ? <>
        {tab === 'Início' ? <View style={s.overview}>
          <Text style={s.overviewLabel}>{draft ? 'SESSÃO EM ANDAMENTO' : 'SEU TREINO'}</Text>
          <Text style={s.overviewTitle}>{draft?.workout.name || featuredWorkout?.name || 'Seu próximo passo começa aqui.'}</Text>
          <Text style={s.overviewDescription}>{draft ? 'Retome suas séries e continue de onde parou.' : featuredWorkout ? `${featuredWorkout.exercises.length} exercícios · ${featuredWorkout.objective || 'Sua ficha preparada pela academia'}` : 'Sua academia ainda não disponibilizou uma ficha de treino.'}</Text>
          <View style={s.actions}>
            <Pressable accessibilityRole="button" style={s.primaryAction} onPress={() => (draft || featuredWorkout?.exercises.length) && trainingId ? router.push({ pathname: '/treinar', params: { workoutId: trainingId } }) : router.navigate('/(app)/treinos')}><Text style={s.primaryText}>{draft ? 'Continuar treino →' : featuredWorkout?.exercises.length ? 'Treinar agora →' : 'Ver treinos →'}</Text></Pressable>
            <Pressable accessibilityRole="button" style={s.secondaryAction} onPress={() => router.navigate('/(app)/agenda')}><Text style={s.secondaryText}>Minha agenda</Text></Pressable>
          </View>
        </View> : null}
        {tab === 'Início' ? <View style={s.block}><Text style={s.section}>Sua próxima aula</Text>{nextBooking ? <><Text style={s.rowTitle}>{nextBooking.title}</Text><Text style={s.description}>{date(nextBooking.starts_at)}</Text><Text style={s.small}>{nextBooking.location || 'Local a definir'} · {statuses[nextBooking.my_booking!.status]}</Text></> : <Text style={s.description}>Você ainda não tem uma reserva para as próximas turmas.</Text>}<Pressable accessibilityRole="button" onPress={() => router.navigate('/(app)/agenda')} style={s.retry}><Text style={s.link}>Explorar agenda →</Text></Pressable></View> : null}
        {tab === 'Perfil' ? <View style={s.block}>
          <Text style={s.section}>{data.student.name}</Text>
          {tab === 'Perfil' ? <><Text style={s.description}>{data.student.email || profile?.email}</Text><Text style={s.description}>{data.student.phone || 'Telefone não informado'}</Text><Text style={s.description}>{profile?.active_unit?.name || 'Unidade não informada'}</Text></> : null}
          {data.enrollments.length ? data.enrollments.map(item => <View key={item.id} style={s.row}><Text style={s.rowTitle}>{item.plan}</Text><Text style={s.description}>{statuses[item.status] || item.status}</Text></View>) : <Text style={s.description}>Nenhuma matrícula disponível.</Text>}
        </View> : null}
        {tab === 'Treinos' ? <>

          {visibleWorkouts.length ? visibleWorkouts.map(workout => <View key={workout.id} style={s.block}><Pressable accessibilityRole="button" accessibilityState={{ expanded: !!expanded[workout.id] }} accessibilityLabel={`${expanded[workout.id] ? 'Recolher' : 'Ver'} exercícios de ${workout.name}`} onPress={() => setExpanded(current => ({ ...current, [workout.id]: !current[workout.id] }))} style={s.workoutHeading}>
              <View style={{ flex: 1 }}><Text style={s.section}>{workout.name}</Text><Text style={s.small}>{workout.exercises.length} exercícios{workout.review_date ? ` · Revisão em ${new Date(workout.review_date + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}</Text></View>
              <Text style={s.expand}>{expanded[workout.id] ? '−' : '+'}</Text>
            </Pressable>{workout.objective ? <Text style={s.description}>{workout.objective}</Text> : null}
            {expanded[workout.id] ? (workout.exercises.length ? workout.exercises.map((exercise, index) => <View key={`${workout.id}-${index}`} style={s.row}><View style={s.exerciseHeading}><Text style={s.exerciseNumber}>{String(index + 1).padStart(2, '0')}</Text><Text style={[s.rowTitle, s.grow]}>{exercise.name}</Text></View>
              <View style={s.exerciseSpecs}><View style={s.spec}><Text style={s.specLabel}>SÉRIES</Text><Text style={s.specValue}>{exercise.sets}</Text></View><View style={s.spec}><Text style={s.specLabel}>REPETIÇÕES</Text><Text style={s.specValue}>{exercise.repetitions}</Text></View><View style={s.spec}><Text style={s.specLabel}>CARGA</Text><Text style={s.specValue}>{exercise.load ? `${exercise.load} kg` : 'Não informada'}</Text></View></View>
              <Text style={s.small}>Descanso: {exercise.rest_seconds} segundos</Text></View>) : <Text style={s.description}>Exercícios ainda não informados.</Text>) : null}
          <Pressable accessibilityRole="button" style={s.primaryAction} onPress={() => router.push({ pathname: '/treinar', params: { workoutId: workout.id } })}><Text style={s.primaryText}>{draft?.workout.id === workout.id ? 'Continuar treino →' : 'Treinar agora / histórico →'}</Text></Pressable>
          </View>) : <Text style={s.description}>{query && tab === 'Treinos' ? 'Nenhum treino encontrado para esta busca.' : 'Sua academia ainda não disponibilizou um treino ativo.'}</Text>}
        </> : null}
        {tab === 'Agenda' ? visibleClasses.length ? visibleClasses.map(item => <View key={item.id} style={s.classCard}>
          <View style={s.classDate}><Text style={s.classDay}>{new Date(item.starts_at).getDate()}</Text><Text style={s.classMonth}>{new Date(item.starts_at).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}</Text></View>
          <View style={s.grow}><Text style={s.rowTitle}>{item.title}</Text><Text style={s.small}>{date(item.starts_at)}</Text><Text style={s.small}>{item.location || 'Local a definir'}</Text><Text style={s.small}>{item.confirmed_count}/{item.capacity} vagas ocupadas</Text><Text style={s.booking}>{item.my_booking ? statuses[item.my_booking.status] || item.my_booking.status : 'Sem reserva'}</Text></View>
        </View>) : <View style={s.emptyState}><Ionicons name="calendar-outline" size={28} color="#66768b" /><Text style={s.rowTitle}>{query ? 'Nenhuma turma encontrada' : agendaFilter === 'mine' ? 'Nenhuma reserva próxima' : agendaFilter === 'past' ? 'Nenhuma turma anterior' : 'Sua agenda está livre'}</Text><Text style={s.description}>{query ? 'Tente outro nome de turma ou local.' : 'As turmas disponibilizadas pela academia aparecem aqui.'}</Text></View> : null}
        {tab === 'Agenda' ? <Text style={s.small}>Exibindo até 20 turmas disponibilizadas pela academia. Reservas são feitas pelo portal web.</Text> : null}
        {tab === 'Perfil' ? <PortalHistory data={data} /> : null}
      </> : null}
      {tab === 'Perfil' ? <Pressable accessibilityRole="button" style={s.signOut} onPress={() => { void logout().catch(() => setError('Não foi possível limpar a sessão. Tente novamente.')); }}><Ionicons name="log-out-outline" size={20} color="#b91c1c" /><Text style={s.signOutText}>Sair da minha conta</Text></Pressable> : null}
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#f4f7fb' }, header: { backgroundColor: '#101f36', paddingHorizontal: 24, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  signature: { color: '#9eafc5', fontSize: 11, letterSpacing: 1, marginTop: 8 }, content: { padding: 24, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' },
  avatar: { minWidth: 44, minHeight: 44, borderRadius: 14, backgroundColor: '#203450', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#67e8f9', fontSize: 18, fontWeight: '800' },
  grow: { flex: 1 }, link: { color: '#2266db', fontWeight: '700', fontSize: 14 },
  search: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce4ef', borderRadius: 14, paddingLeft: 14 },
  searchInput: { flex: 1, minHeight: 50, color: '#14243c', fontSize: 14, paddingVertical: 12 },
  clearSearch: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  filter: { borderRadius: 12, borderWidth: 1, borderColor: '#dce4ef', paddingHorizontal: 12, minHeight: 44, justifyContent: 'center', backgroundColor: '#fff' },
  filterActive: { backgroundColor: '#2266db', borderColor: '#2266db' },
  filterText: { color: '#586980', fontSize: 12, fontWeight: '700' }, filterTextActive: { color: '#fff' },
  classCard: { marginTop: 16, padding: 18, flexDirection: 'row', gap: 16, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#dce4ef' },
  classDate: { width: 52, height: 64, backgroundColor: '#edf4ff', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  classDay: { fontSize: 24, color: '#2266db', fontWeight: '800' }, classMonth: { fontSize: 10, color: '#2266db', fontWeight: '700' },
  booking: { color: '#2266db', fontSize: 12, fontWeight: '700', marginTop: 10 },
  emptyState: { padding: 24, alignItems: 'center', gap: 10, marginTop: 20, borderRadius: 18, borderWidth: 1, borderColor: '#dce4ef', backgroundColor: '#fff' },
  signOut: { minHeight: 52, marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff' },
  signOutText: { color: '#b91c1c', fontWeight: '700', fontSize: 14 },
  eyebrow: { color: '#2266db', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 8 }, title: { color: '#14243c', fontSize: 32, fontWeight: '800', lineHeight: 40, letterSpacing: -1, marginTop: 12 },
  description: { color: '#586980', fontSize: 14, lineHeight: 22, marginTop: 9 }, block: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce4ef', borderRadius: 20, padding: 20, marginTop: 20 },
  overview: { backgroundColor: '#14243c', borderRadius: 24, padding: 22, marginTop: 24, borderTopWidth: 3, borderTopColor: '#08b6d4' },
  overviewLabel: { color: '#67e8f9', fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  overviewTitle: { color: '#fff', fontSize: 24, lineHeight: 31, fontWeight: '800', marginTop: 12 },
  overviewDescription: { color: '#c1cede', fontSize: 14, lineHeight: 22, marginTop: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  primaryAction: { backgroundColor: '#2563eb', borderRadius: 12, paddingHorizontal: 16, minHeight: 48, justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondaryAction: { borderWidth: 1, borderColor: '#65768d', borderRadius: 12, paddingHorizontal: 16, minHeight: 48, justifyContent: 'center' },
  secondaryText: { color: '#e2e8f0', fontWeight: '700', fontSize: 14 },
  exerciseHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exerciseNumber: { color: '#2266db', fontSize: 12, fontWeight: '800', backgroundColor: '#edf4ff', padding: 8, borderRadius: 8 },
  exerciseSpecs: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  spec: { flexGrow: 1, minWidth: 68, backgroundColor: '#f4f7fb', borderRadius: 10, padding: 10 },
  specLabel: { color: '#66768b', fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  specValue: { color: '#14243c', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 5 },
  workoutHeading: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 56 },
  expand: { color: '#2266db', fontSize: 28, width: 32, textAlign: 'center' },
  section: { color: '#14243c', fontWeight: '800', fontSize: 20, marginTop: 12 }, row: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#dce4ef' },
  rowTitle: { color: '#14243c', fontWeight: '700', fontSize: 15 }, small: { color: '#586980', fontSize: 12, lineHeight: 20, marginTop: 8 }, retry: { paddingVertical: 16, minHeight: 44 },
});
