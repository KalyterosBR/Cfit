import { useCallback, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Logo from './Logo';
import { useAuth } from '../features/auth/AuthProvider';
import { api } from '../services/api';

type Tab = 'Início' | 'Treinos' | 'Agenda' | 'Perfil';
type Portal = {
  student: { id: string; name: string; email: string; phone: string };
  enrollments: { id: string; plan: string; status: string; start_date: string }[];
  workouts: { id: string; name: string; objective: string; review_date: string | null; exercises: { name: string; sets: number; repetitions: string; load: string; rest_seconds: number }[] }[];
  classes: { id: string; title: string; starts_at: string; location: string; my_booking: { id: string; status: string } | null }[];
};
const statuses: Record<string, string> = { active: 'Ativa', inactive: 'Inativa', canceled: 'Cancelada', frozen: 'Congelada', expired: 'Encerrada', confirmed: 'Confirmada', waitlist: 'Lista de espera', attended: 'Presença registrada', absent: 'Ausência registrada' };
const date = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
export default function StudentPortal({ tab }: { tab: Tab }) {
  const insets = useSafeAreaInsets();
  const { profile, logout } = useAuth();
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
    void load();
    return () => { version.current += 1; };
  }, [load]));
  return <View style={s.app}>
    <StatusBar style="light" />
    <View style={[s.header, { paddingTop: insets.top + 20 }]}>
      <View style={s.headerRow}><Logo variant="light" width={112} /><Pressable accessibilityRole="button" onPress={() => { void logout().catch(() => setError('Não foi possível limpar a sessão. Tente novamente.')); }} style={s.logout}><Text style={s.logoutText}>Sair</Text></Pressable></View>
      <Text style={s.signature}>{profile?.academy?.name || 'SEU RITMO. SUA EVOLUÇÃO.'}</Text>
    </View>
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor="#2563eb" />}>
      <Text style={s.eyebrow}>ÁREA DO ALUNO</Text>
      <Text style={s.title}>{tab === 'Início' ? `Olá, ${profile?.name.split(' ')[0] || 'aluno'}.` : tab}</Text>
      <Text style={s.description}>{tab === 'Início' ? 'Sua academia, seu treino e sua rotina.' : tab === 'Treinos' ? 'As orientações da sua academia, no seu ritmo.' : tab === 'Agenda' ? 'Acompanhe as turmas e suas reservas.' : 'Seu vínculo com a academia.'}</Text>
      {loading && !data ? <ActivityIndicator color="#2563eb" style={{ marginTop: 32 }} accessibilityLabel="Carregando seus dados" /> : null}
      {error ? <View style={s.block}><Text accessibilityRole="alert" style={{ color: '#b91c1c' }}>{error}</Text><Pressable style={s.retry} onPress={() => void load()}><Text style={{ color: '#2563eb', fontWeight: '700' }}>Tentar novamente</Text></Pressable></View> : null}
      {data ? <>
        {tab === 'Início' || tab === 'Perfil' ? <View style={s.block}>
          <Text style={s.section}>{tab === 'Perfil' ? data.student.name : 'Sua matrícula'}</Text>
          {tab === 'Perfil' ? <><Text style={s.description}>{data.student.email || profile?.email}</Text><Text style={s.description}>{data.student.phone || 'Telefone não informado'}</Text><Text style={s.description}>{profile?.active_unit?.name || 'Unidade não informada'}</Text></> : null}
          {data.enrollments.length ? data.enrollments.map(item => <View key={item.id} style={s.row}><Text style={s.rowTitle}>{item.plan}</Text><Text style={s.description}>{statuses[item.status] || item.status}</Text></View>) : <Text style={s.description}>Nenhuma matrícula disponível.</Text>}
        </View> : null}
        {tab === 'Treinos' || tab === 'Início' ? <>
          {tab === 'Início' ? <Text style={s.section}>Seu treino</Text> : null}
          {data.workouts.length ? data.workouts.map(workout => <View key={workout.id} style={s.block}><Text style={s.section}>{workout.name}</Text>{workout.objective ? <Text style={s.description}>{workout.objective}</Text> : null}
            {workout.exercises.length ? workout.exercises.map((exercise, index) => <View key={`${workout.id}-${index}`} style={s.row}><Text style={s.rowTitle}>{exercise.name}</Text><Text style={s.description}>{exercise.sets} séries · {exercise.repetitions} repetições{exercise.load ? ` · ${exercise.load}` : ''}</Text><Text style={s.small}>Descanso: {exercise.rest_seconds} segundos</Text></View>) : <Text style={s.description}>Exercícios ainda não informados.</Text>}
          </View>) : <Text style={s.description}>Nenhum treino ativo foi disponibilizado pela sua academia.</Text>}
        </> : null}
        {tab === 'Agenda' ? data.classes.length ? data.classes.map(item => <View key={item.id} style={s.block}><Text style={s.section}>{item.title}</Text><Text style={s.description}>{date(item.starts_at)}</Text><Text style={s.description}>{item.location || 'Local não informado'}</Text><Text style={s.small}>{item.my_booking ? `Sua reserva: ${statuses[item.my_booking.status] || item.my_booking.status}` : 'Sem reserva nesta turma'}</Text></View>) : <Text style={s.description}>Nenhuma turma disponível para sua unidade.</Text> : null}
      </> : null}
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#f4f7fb' }, header: { backgroundColor: '#101f36', paddingHorizontal: 24, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, logout: { minHeight: 44, minWidth: 44, justifyContent: 'center' }, logoutText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  signature: { color: '#9eafc5', fontSize: 11, letterSpacing: 1, marginTop: 8 }, content: { padding: 24, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' },
  eyebrow: { color: '#2266db', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 8 }, title: { color: '#14243c', fontSize: 32, fontWeight: '800', lineHeight: 40, letterSpacing: -1, marginTop: 12 },
  description: { color: '#586980', fontSize: 14, lineHeight: 22, marginTop: 9 }, block: { borderTopWidth: 1, borderTopColor: '#dce4ef', paddingTop: 20, marginTop: 24 },
  section: { color: '#14243c', fontWeight: '800', fontSize: 20, marginTop: 12 }, row: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#dce4ef' },
  rowTitle: { color: '#14243c', fontWeight: '700', fontSize: 15 }, small: { color: '#586980', fontSize: 12, lineHeight: 20, marginTop: 8 }, retry: { paddingVertical: 16, minHeight: 44 },
});
