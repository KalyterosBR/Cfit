import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { sessionSummary, type CompletedSession } from './session';
export default function SessionHistory({ sessions, initiallyOpen = false }: { sessions: CompletedSession[]; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [selected, setSelected] = useState<string | null>(null);
  const latest = sessions[0];
  return <View style={s.block}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} style={s.heading}><View style={s.grow}><Text style={s.title}>Minha evolução</Text><Text style={s.description}>{latest ? `Último treino: ${new Date(latest.scheduled_for + 'T12:00:00').toLocaleDateString('pt-BR')} · ${latest.duration_minutes ?? '—'} min` : 'Seu histórico começa ao salvar o primeiro treino.'}</Text></View><Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color="#2266db" /></Pressable>
    {open ? <>
      <Text style={s.description}>Até 20 sessões desta ficha. Abra uma sessão para consultar as cargas registradas.</Text>
      {sessions.map(session => { const summary = sessionSummary(session); return <View key={session.id} style={s.row}><Pressable accessibilityRole="button" accessibilityState={{ expanded: selected === session.id }} onPress={() => setSelected(current => current === session.id ? null : session.id)} style={s.heading}><View style={s.grow}><Text style={s.name}>{new Date(session.scheduled_for + 'T12:00:00').toLocaleDateString('pt-BR')}</Text><Text style={s.description}>{summary.duration ?? '—'} min · {summary.exercises} exercícios · {summary.sets} séries</Text></View><Ionicons name={selected === session.id ? 'chevron-up' : 'chevron-down'} size={18} color="#2266db" /></Pressable>{selected === session.id ? session.exercises.length ? session.exercises.map(item => <View key={item.id} style={s.result}><Text style={s.name}>{item.name}</Text><Text style={s.description}>{item.sets} × {item.repetitions} · {item.load === null ? 'Sem carga informada' : `${item.load} kg`}</Text></View>) : <Text style={s.description}>Sessão registrada pela academia sem detalhes de cargas.</Text> : null}</View>; })}
    </> : null}
  </View>;
}
const s = StyleSheet.create({
  block: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce4ef', borderRadius: 18, padding: 18, marginTop: 24 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }, grow: { flex: 1 }, title: { color: '#14243c', fontSize: 18, fontWeight: '800' },
  description: { color: '#66768b', fontSize: 12, lineHeight: 20, marginTop: 8 }, name: { color: '#14243c', fontSize: 14, fontWeight: '700', lineHeight: 22 }, row: { borderTopWidth: 1, borderTopColor: '#e5ebf3', paddingTop: 14, marginTop: 14 }, result: { paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#d5e3f8', marginTop: 16 },
});
