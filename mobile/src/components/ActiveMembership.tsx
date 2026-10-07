import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type Membership = { id: string; plan: string; status: string; start_date: string; due_date?: string; contracted_price?: string; billing_method?: string; duration_months?: number; modalities?: string; benefits?: string; frozen_until?: string | null };
const date = (value: string) => new Date(value + 'T12:00:00').toLocaleDateString('pt-BR');
function MembershipDetails({ item }: { item: Membership }) {
  const [expanded, setExpanded] = useState(false);
  const details = [
    ['Valor contratado', item.contracted_price !== undefined ? Number(item.contracted_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null],
    ['Duração do plano', item.duration_months !== undefined ? `${item.duration_months} ${item.duration_months === 1 ? 'mês' : 'meses'}` : null],
    ['Forma de cobrança', item.billing_method === 'monthly' ? 'Mensal' : item.billing_method === 'full' ? 'À vista' : null],
    ['Primeiro vencimento', item.due_date ? date(item.due_date) : null],
    ['Congelamento', item.status === 'frozen' ? item.frozen_until ? `Até ${date(item.frozen_until)}` : 'Matrícula congelada' : 'Matrícula ativa'],
    ['Modalidades', item.modalities], ['Benefícios', item.benefits],
  ].filter(([, value]) => value);
  return <View style={s.details}>
    <View style={s.plan}><Text style={s.name}>{item.plan}</Text><Text style={[s.badge, item.status === 'frozen' ? s.frozen : null]}>{item.status === 'frozen' ? 'Congelada' : 'Ativa'}</Text></View>
    <Text style={s.description}>Início da matrícula: {item.start_date ? date(item.start_date) : 'Não informado'}</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={s.action}><Text style={s.link}>{expanded ? 'Recolher detalhes' : 'Detalhes do meu plano'}</Text><Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#2266db" /></Pressable>
    {expanded ? <View>{details.map(([label, value]) => <View key={label} style={s.row}><Text style={s.label}>{label}</Text><Text style={s.value}>{value}</Text></View>)}{item.contracted_price === undefined ? <Text style={s.description}>Os detalhes contratuais ainda não foram disponibilizados pela academia.</Text> : null}</View> : null}
  </View>;
}
export default function ActiveMembership({ enrollments }: { enrollments: Membership[] }) {
  const current = enrollments.filter(item => item.status === 'active' || item.status === 'frozen');
  return <View style={s.block}><View style={s.heading}><Ionicons name="ribbon-outline" size={22} color="#2266db" /><Text style={s.title}>{current.length > 1 ? 'Minhas matrículas' : 'Minha matrícula'}</Text></View>{current.length ? current.map(item => <MembershipDetails key={item.id} item={item} />) : <Text style={s.description}>Você não possui uma matrícula ativa no momento. Consulte a academia para verificar seu vínculo.</Text>}</View>;
}
const s = StyleSheet.create({
  block: { backgroundColor: '#edf4ff', borderWidth: 1, borderColor: '#d5e3f8', borderTopWidth: 3, borderTopColor: '#08b6d4', borderRadius: 18, padding: 20, marginTop: 20 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, title: { color: '#14243c', fontSize: 18, fontWeight: '800' },
  details: { borderTopWidth: 1, borderTopColor: '#d5e3f8', marginTop: 18, paddingTop: 18 }, plan: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }, name: { flexGrow: 1, flexBasis: '65%', color: '#14243c', fontSize: 22, lineHeight: 29, fontWeight: '800' },
  badge: { color: '#047857', backgroundColor: '#ecfdf5', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 6, fontSize: 11, fontWeight: '700' }, frozen: { color: '#92400e', backgroundColor: '#fffbeb' },
  description: { color: '#586980', fontSize: 13, lineHeight: 21, marginTop: 12 }, action: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }, link: { color: '#2266db', fontSize: 13, fontWeight: '700' },
  row: { borderTopWidth: 1, borderTopColor: '#d5e3f8', paddingVertical: 12, gap: 5 }, label: { color: '#66768b', fontSize: 11 }, value: { color: '#14243c', fontSize: 13, lineHeight: 21, fontWeight: '600' },
});
