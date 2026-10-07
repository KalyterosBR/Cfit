import { useCallback, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, Pressable, TextInput, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Logo from './Logo';
import ProfileContacts, { type ContactData } from './ProfileContacts';
import ActiveMembership, { type Membership } from './ActiveMembership';
import PortalWebAction from './PortalWebAction';
import { type PortalHistoryData } from './PortalHistory';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../features/auth/AuthProvider';
import { useTraining } from '../features/workouts/TrainingProvider';
import { api } from '../services/api';

type Tab = 'Início' | 'Treinos' | 'Agenda' | 'Perfil';
type Portal = PortalHistoryData & {
  student: ContactData & { id: string; name: string; email: string };
  enrollments: Membership[];
  workouts: { id: string; name: string; objective: string; review_date: string | null; exercises: { name: string; sets: number; repetitions: string; load: string; rest_seconds: number }[] }[];
  classes: { id: string; title: string; starts_at: string; ends_at?: string; status?: string; location: string; capacity: number; confirmed_count: number; my_booking: { id: string; status: string } | null }[];
};
const statuses: Record<string, string> = { active: 'Ativa', inactive: 'Inativa', canceled: 'Cancelada', frozen: 'Congelada', expired: 'Encerrada', finished: 'Encerrada', confirmed: 'Confirmada', waitlist: 'Lista de espera', attended: 'Presença registrada', absent: 'Ausência registrada' };
const date = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
export default function StudentPortal({ tab }: { tab: Tab }) {
  const [bookingBusy, setBookingBusy] = useState<string | null>(null);
  const [bookingMessage, setBookingMessage] = useState('');
  const bookingOperation = useRef(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
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
    try { const result = await api.authenticated<Portal>('/users/portal/me/'); if (current === version.current) { setData(result); setUpdatedAt(Date.now()); } }
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
  const pendingDocuments = data?.documents.filter(item => item.requires_acceptance && !item.accepted_at).length || 0;
  const overdueCharges = data?.charges.filter(item => item.operational_category === 'overdue').length || 0;
  const openCharges = data?.charges.filter(item => ['pending', 'overdue'].includes(item.status)).length || 0;
  const openHistory = (value: string) => router.push({ pathname: '/acompanhamento', params: { section: value } });
  function changeBooking(item: Portal['classes'][number]) {
    const cancel = ['confirmed', 'waitlist'].includes(item.my_booking?.status || '');
    Alert.alert(cancel ? 'Cancelar reserva?' : 'Reservar esta aula?', `${item.title} · ${date(item.starts_at)}${!cancel && item.confirmed_count >= item.capacity ? '\nA turma está lotada. Você entrará na lista de espera.' : ''}`, [
      { text: 'Agora não', style: 'cancel' },
      { text: cancel ? 'Cancelar reserva' : 'Confirmar', style: cancel ? 'destructive' : 'default', onPress: () => { void submitBooking(item, cancel); } },
    ]);
  }
  async function submitBooking(item: Portal['classes'][number], cancel: boolean) {
    if (bookingOperation.current) return;
    bookingOperation.current = true; setBookingBusy(item.id); setError(''); setBookingMessage('');
    try {
      const result = await api.authenticated<{ id: string; status: string }>('/users/portal/me/', cancel ? { operation: 'cancel_booking', booking_id: item.my_booking!.id } : { operation: 'book_class', class_id: item.id });
      setBookingMessage(cancel ? 'Reserva cancelada.' : result.status === 'waitlist' ? 'Você entrou na lista de espera. Acompanhe sua reserva nesta aba.' : 'Sua reserva está confirmada.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível atualizar a reserva.'); }
    finally { bookingOperation.current = false; setBookingBusy(null); }
  }
  return <View style={s.app}>
    <StatusBar style="dark" />
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      <View style={s.headerRow}><Logo width={88} /><View style={s.headerContext}><Text style={s.headerCaption}>SUA ACADEMIA</Text><Text numberOfLines={1} style={s.signature}>{profile?.academy?.name || 'Cfit'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Meu perfil" onPress={() => router.navigate('/(app)/perfil')} style={s.avatar}><Text style={s.avatarText}>{profile?.name.trim().slice(0, 1).toUpperCase() || 'C'}</Text></Pressable></View>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor="#2563eb" />}>
      <View style={s.pageCaption}><Text style={s.eyebrow}>{tab === 'Início' ? 'SEU DIA NO CFIT' : 'ÁREA DO ALUNO'}</Text><Text style={s.today}>{new Date(now).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</Text></View>
      <Text style={s.title}>{tab === 'Início' ? `Olá, ${profile?.name.split(' ')[0] || 'aluno'}.` : tab}</Text>
      <Text style={s.description}>{tab === 'Início' ? 'Sua academia, seu treino e sua rotina.' : tab === 'Treinos' ? 'As orientações da sua academia, no seu ritmo.' : tab === 'Agenda' ? 'Escolha uma aula para reservar. Turmas lotadas têm lista de espera.' : 'Seus dados, vínculo e acesso à conta.'}</Text>
      {tab === 'Treinos' || tab === 'Agenda' ? <View style={s.search}>
        <Ionicons name="search-outline" size={19} color="#66768b" />
        <TextInput style={s.searchInput} value={query} onChangeText={setQuery} placeholder={tab === 'Treinos' ? 'Buscar treino ou exercício' : 'Buscar turma ou local'} placeholderTextColor="#66768b" accessibilityLabel={tab === 'Treinos' ? 'Buscar treino ou exercício' : 'Buscar turma ou local'} autoCorrect={false} returnKeyType="search" />
        {query ? <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setQuery('')} style={s.clearSearch}><Ionicons name="close-circle" size={20} color="#66768b" /></Pressable> : null}
      </View> : null}
      {tab === 'Agenda' && data ? <View style={s.agendaSummary}><View style={s.agendaSummaryIcon}><Ionicons name="calendar-outline" size={26} color="#2266db" /></View><View style={s.grow}><Text style={s.rowTitle}>{upcomingClasses.filter(item => ['confirmed', 'waitlist'].includes(item.my_booking?.status || '')).length} reservas próximas</Text><Text style={s.quickDescription}>{nextBooking ? `Próxima: ${date(nextBooking.starts_at)}` : 'Explore as turmas da sua academia.'}</Text></View></View> : null}
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
        {tab === 'Início' ? <>
          <View style={s.chapterHeading}><Text style={s.section}>Sua rotina, em um toque</Text><Text style={s.chapterLabel}>ACOMPANHAMENTO</Text></View>
          <View style={s.quickGrid}>{([['financeiro', 'wallet-outline', 'Financeiro', openCharges ? `${openCharges} ${openCharges === 1 ? 'cobrança em aberto' : 'cobranças em aberto'}` : 'Consultar cobranças'], ['acessos', 'footsteps-outline', 'Meus acessos', 'Histórico de entradas'], ['avaliacoes', 'fitness-outline', 'Avaliações', 'Consultar resultados'], ['documentos', 'document-text-outline', 'Documentos', pendingDocuments ? `${pendingDocuments} aguardando aceite` : 'Ler meus documentos']] as const).map(([value, icon, title, subtitle]) => <Pressable key={value} accessibilityRole="button" onPress={() => openHistory(value)} style={({ pressed }) => [s.quickAction, pressed ? s.pressed : null]}><View style={s.quickTop}><Ionicons name={icon} size={23} color="#2266db" /><Ionicons name="arrow-forward" size={16} color="#66768b" /></View><Text style={s.quickTitle}>{title}</Text><Text style={s.quickDescription}>{subtitle}</Text></Pressable>)}</View>
          {overdueCharges || pendingDocuments ? <View style={s.attention}><Ionicons name="information-circle-outline" size={20} color="#2266db" /><View style={s.grow}><Text style={s.attentionTitle}>Vale conferir</Text><Text style={s.quickDescription}>Há documentos aguardando aceite ou cobranças vencidas nos registros disponíveis. Consulte os detalhes nos atalhos acima.</Text></View></View> : null}
        </> : null}
        {tab === 'Início' ? <View style={s.block}><Text style={s.section}>Sua próxima aula</Text>{nextBooking ? <><Text style={s.rowTitle}>{nextBooking.title}</Text><Text style={s.description}>{date(nextBooking.starts_at)}</Text><Text style={s.small}>{nextBooking.location || 'Local a definir'} · {statuses[nextBooking.my_booking!.status]}</Text></> : <Text style={s.description}>Você ainda não tem uma reserva para as próximas turmas.</Text>}<Pressable accessibilityRole="button" onPress={() => router.navigate('/(app)/agenda')} style={s.retry}><Text style={s.link}>Explorar agenda →</Text></Pressable></View> : null}
        {tab === 'Perfil' ? <View style={s.block}>
          <View style={s.profileHeading}><View style={s.profileInitial}><Text style={s.profileInitialText}>{data.student.name.trim().slice(0, 1).toUpperCase()}</Text></View><View style={s.grow}><Text style={s.section}>{data.student.name}</Text><Text style={s.small}>Aluno da academia</Text></View></View>
          {([['E-MAIL', data.student.email || profile?.email], ['ACADEMIA', profile?.academy?.name || 'Não informada'], ['UNIDADE', profile?.active_unit?.name || 'Não informada']] as const).map(([label, value]) => <View key={label} style={s.contactRow}><Text style={s.contactLabel}>{label}</Text><Text selectable style={s.contactValue}>{value}</Text></View>)}
        </View> : null}
        {tab === 'Perfil' ? <><ProfileContacts student={data.student} onSaved={values => setData(current => current ? { ...current, student: { ...current.student, ...values } } : current)} /><ActiveMembership enrollments={data.enrollments} /></> : null}
        {tab === 'Treinos' ? <>

          {visibleWorkouts.length ? visibleWorkouts.map(workout => <View key={workout.id} style={[s.block, s.workoutCard]}><Text style={s.workoutCaption}>FICHA DE TREINO</Text><Pressable accessibilityRole="button" accessibilityState={{ expanded: !!expanded[workout.id] }} accessibilityLabel={`${expanded[workout.id] ? 'Recolher' : 'Ver'} exercícios de ${workout.name}`} onPress={() => setExpanded(current => ({ ...current, [workout.id]: !current[workout.id] }))} style={s.workoutHeading}>
              <View style={{ flex: 1 }}><Text style={s.section}>{workout.name}</Text><Text style={s.small}>{workout.review_date ? `Revisão em ${new Date(workout.review_date + 'T12:00:00').toLocaleDateString('pt-BR')}` : 'Orientações da sua academia'}</Text></View>
              <View style={s.expand}><Ionicons name={expanded[workout.id] ? 'chevron-up' : 'chevron-down'} size={20} color="#2266db" /></View>
            </Pressable><View style={s.workoutSummary}><View style={s.workoutMetric}><Ionicons name="barbell-outline" size={18} color="#2266db" /><Text style={s.workoutMetricText}>{workout.exercises.length} exercícios</Text></View><View style={s.workoutMetric}><Ionicons name="layers-outline" size={18} color="#2266db" /><Text style={s.workoutMetricText}>{workout.exercises.reduce((sum, item) => sum + item.sets, 0)} séries</Text></View></View>{workout.objective ? <Text style={s.description}>{workout.objective}</Text> : null}
            {expanded[workout.id] ? (workout.exercises.length ? workout.exercises.map((exercise, index) => <View key={`${workout.id}-${index}`} style={s.row}><View style={s.exerciseHeading}><Text style={s.exerciseNumber}>{String(index + 1).padStart(2, '0')}</Text><Text style={[s.rowTitle, s.grow]}>{exercise.name}</Text></View>
              <View style={s.exerciseSpecs}><View style={s.spec}><Text style={s.specLabel}>SÉRIES</Text><Text style={s.specValue}>{exercise.sets}</Text></View><View style={s.spec}><Text style={s.specLabel}>REPETIÇÕES</Text><Text style={s.specValue}>{exercise.repetitions}</Text></View><View style={s.spec}><Text style={s.specLabel}>CARGA</Text><Text style={s.specValue}>{exercise.load ? `${exercise.load} kg` : 'Não informada'}</Text></View></View>
              <Text style={s.small}>Descanso: {exercise.rest_seconds} segundos</Text></View>) : <Text style={s.description}>Exercícios ainda não informados.</Text>) : null}
          <Pressable accessibilityRole="button" style={[s.primaryAction, s.workoutAction]} onPress={() => router.push({ pathname: '/treinar', params: { workoutId: workout.id } })}><Text style={s.primaryText}>{draft?.workout.id === workout.id ? 'Continuar treino →' : 'Abrir treino →'}</Text></Pressable>
          </View>) : <View style={s.emptyState}><View style={s.emptyIcon}><Ionicons name="barbell-outline" size={30} color="#2266db" /></View><Text style={s.rowTitle}>{query ? 'Nenhum treino encontrado' : 'Sua próxima ficha vem aí'}</Text><Text style={[s.description, s.center]}>{query ? 'Tente o nome da ficha ou de um exercício.' : 'Os treinos disponibilizados pela academia aparecerão aqui.'}</Text>{query ? <Pressable accessibilityRole="button" style={s.retry} onPress={() => setQuery('')}><Text style={s.link}>Limpar busca</Text></Pressable> : null}</View>}
        </> : null}
        {tab === 'Agenda' && bookingMessage ? <Text accessibilityLiveRegion="polite" style={s.booking}>{bookingMessage}</Text> : null}
        {tab === 'Agenda' ? visibleClasses.length ? visibleClasses.map(item => <View key={item.id} style={s.classCard}>
          <View style={s.classDate}><Text style={s.classDay}>{new Date(item.starts_at).getDate()}</Text><Text style={s.classMonth}>{new Date(item.starts_at).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}</Text></View>
          <View style={s.grow}><Text style={s.rowTitle}>{item.title}</Text><Text style={s.small}>{date(item.starts_at)}</Text><Text style={s.small}>{item.location || 'Local a definir'}</Text><View style={s.occupancyTrack}><View style={[s.occupancyFill, { width: `${item.capacity > 0 ? Math.min(100, Math.max(0, item.confirmed_count / item.capacity * 100)) : 0}%` }]} /></View><Text style={s.small}>{item.confirmed_count}/{item.capacity} vagas ocupadas</Text><Text style={s.booking}>{item.my_booking ? statuses[item.my_booking.status] || item.my_booking.status : 'Sem reserva'}</Text>{new Date(item.starts_at).getTime() > now && (!item.status || item.status === 'scheduled') && !['attended', 'absent'].includes(item.my_booking?.status || '') ? <Pressable accessibilityRole="button" disabled={!!bookingBusy} onPress={() => changeBooking(item)} style={[s.bookingAction, bookingBusy ? s.pressed : null]}><Text style={s.bookingActionText}>{bookingBusy === item.id ? 'Aguarde…' : ['confirmed', 'waitlist'].includes(item.my_booking?.status || '') ? 'Cancelar reserva' : item.confirmed_count >= item.capacity ? 'Entrar na lista de espera' : 'Reservar aula'}</Text></Pressable> : null}</View>
        </View>) : <View style={s.emptyState}><Ionicons name="calendar-outline" size={28} color="#66768b" /><Text style={s.rowTitle}>{query ? 'Nenhuma turma encontrada' : agendaFilter === 'mine' ? 'Nenhuma reserva próxima' : agendaFilter === 'past' ? 'Nenhuma turma anterior' : 'Nenhuma aula próxima disponível'}</Text><Text style={[s.description, s.center]}>{query ? 'Tente outro nome de turma ou local.' : agendaFilter === 'upcoming' ? 'A academia precisa disponibilizar uma turma futura para sua unidade. Quando houver uma aula, o botão de reserva ou lista de espera aparecerá nela.' : agendaFilter === 'mine' ? 'Abra Próximas e escolha uma aula disponível para fazer sua reserva.' : 'As aulas anteriores disponibilizadas pela academia aparecem aqui.'}</Text></View> : null}
        {tab === 'Agenda' ? <Text style={s.small}>Consulta de até 20 turmas próximas e 20 anteriores disponibilizadas pela academia.</Text> : null}

        {tab === 'Perfil' ? <View style={s.block}><Text style={s.section}>Conta e acesso</Text><Text style={s.description}>Seu e-mail cadastrado é usado para entrar no Cfit.</Text><Pressable accessibilityRole="button" onPress={() => router.push('/seguranca')} style={s.accountAction}><View style={s.quickTop}><Ionicons name="lock-closed-outline" size={21} color="#2266db" /></View><View style={s.grow}><Text style={s.quickTitle}>Alterar minha senha</Text><Text style={s.quickDescription}>Após a troca, entre novamente com a nova senha.</Text></View><Ionicons name="chevron-forward" size={18} color="#66768b" /></Pressable></View> : null}
        {tab === 'Perfil' ? <PortalWebAction title="Meu cadastro no portal web" description="Consulte os demais dados do seu cadastro." /> : null}
      </> : null}
      {updatedAt ? <View style={s.updateFooter}><Ionicons name="sync-outline" size={13} color="#66768b" /><Text style={s.updateText}>{loading ? 'Atualizando…' : `Atualizado às ${new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`} · puxe para atualizar</Text></View> : null}
      {tab === 'Perfil' ? <Pressable accessibilityRole="button" style={s.signOut} onPress={() => { void logout().catch(() => setError('Não foi possível limpar a sessão. Tente novamente.')); }}><Ionicons name="log-out-outline" size={20} color="#b91c1c" /><Text style={s.signOutText}>Sair da minha conta</Text></Pressable> : null}
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
  accountAction: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, borderTopWidth: 1, borderTopColor: '#e5ebf3', paddingTop: 16, marginTop: 16 },
  agendaSummary: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: '#edf4ff', borderRadius: 16 }, agendaSummaryIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  occupancyTrack: { height: 4, borderRadius: 4, backgroundColor: '#e5ebf3', marginTop: 14, overflow: 'hidden' }, occupancyFill: { height: 4, backgroundColor: '#08b6d4' },
  pageCaption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, today: { color: '#66768b', fontSize: 11, fontWeight: '700', marginTop: 8 },
  chapterHeading: { marginTop: 28, gap: 8 }, chapterLabel: { color: '#66768b', fontSize: 9, letterSpacing: 1.5, fontWeight: '700' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }, quickAction: { flexGrow: 1, flexBasis: '46%', minWidth: 135, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce4ef', borderRadius: 16, padding: 16, minHeight: 116 },
  quickTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }, quickTitle: { color: '#14243c', fontSize: 14, fontWeight: '800' }, quickDescription: { color: '#586980', fontSize: 12, lineHeight: 19, marginTop: 6 },
  attention: { flexDirection: 'row', gap: 10, backgroundColor: '#edf4ff', padding: 14, borderRadius: 14, marginTop: 16 }, attentionTitle: { color: '#14243c', fontSize: 13, fontWeight: '800' },
  emptyIcon: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: '#edf4ff', borderRadius: 18, marginBottom: 4 }, center: { textAlign: 'center' }, pressed: { opacity: 0.75 },
  updateFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 }, updateText: { color: '#66768b', fontSize: 10, lineHeight: 17 },
  app: { flex: 1, backgroundColor: '#f4f7fb' }, header: { backgroundColor: '#f4f7fb', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e3eaf4' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerContext: { flex: 1, borderLeftWidth: 1, borderLeftColor: '#dce4ef', paddingLeft: 14 }, headerCaption: { color: '#66768b', fontSize: 9, fontWeight: '700', letterSpacing: 1.2 }, signature: { color: '#14243c', fontSize: 12, fontWeight: '700', marginTop: 4 }, content: { padding: 20, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' },
  avatar: { minWidth: 44, minHeight: 44, borderRadius: 14, backgroundColor: '#14243c', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#67e8f9', fontSize: 18, fontWeight: '800' },
  profileHeading: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  profileInitial: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#edf4ff', alignItems: 'center', justifyContent: 'center' },
  profileInitialText: { color: '#2266db', fontSize: 23, fontWeight: '800' },
  contactRow: { borderTopWidth: 1, borderTopColor: '#e5ebf3', paddingVertical: 13, gap: 5 },
  contactLabel: { color: '#66768b', fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  contactValue: { color: '#40536d', fontSize: 14, lineHeight: 21 },
  bookingAction: { minHeight: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2266db', borderRadius: 10, paddingHorizontal: 12, marginTop: 14 },
  bookingActionText: { color: '#fff', fontWeight: '700', fontSize: 12, textAlign: 'center', paddingVertical: 10 },
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
  eyebrow: { color: '#2266db', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 8 }, title: { color: '#14243c', fontSize: 28, fontWeight: '800', lineHeight: 35, letterSpacing: -0.7, marginTop: 8 },
  description: { color: '#586980', fontSize: 14, lineHeight: 22, marginTop: 9 }, block: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce4ef', borderRadius: 18, padding: 18, marginTop: 20 },
  overview: { backgroundColor: '#14243c', borderRadius: 24, padding: 22, marginTop: 24, borderTopWidth: 3, borderTopColor: '#08b6d4' },
  overviewLabel: { color: '#67e8f9', fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  overviewTitle: { color: '#fff', fontSize: 24, lineHeight: 31, fontWeight: '800', marginTop: 12 },
  overviewDescription: { color: '#c1cede', fontSize: 14, lineHeight: 22, marginTop: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  primaryAction: { backgroundColor: '#2563eb', borderRadius: 12, paddingHorizontal: 16, minHeight: 48, justifyContent: 'center' },
  workoutCard: { borderTopWidth: 3, borderTopColor: '#08b6d4', padding: 20 },
  workoutCaption: { color: '#66768b', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  workoutSummary: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, borderTopWidth: 1, borderTopColor: '#e5ebf3', paddingTop: 14, marginTop: 16 },
  workoutMetric: { flexDirection: 'row', alignItems: 'center', gap: 7 }, workoutMetricText: { color: '#40536d', fontSize: 12, fontWeight: '700' },
  workoutAction: { marginTop: 16 },
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
  expand: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#edf4ff', alignItems: 'center', justifyContent: 'center' },
  section: { color: '#14243c', fontWeight: '800', fontSize: 18, lineHeight: 25 }, row: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#dce4ef' },
  rowTitle: { color: '#14243c', fontWeight: '700', fontSize: 15 }, small: { color: '#586980', fontSize: 12, lineHeight: 20, marginTop: 8 }, retry: { paddingVertical: 16, minHeight: 44 },
});
