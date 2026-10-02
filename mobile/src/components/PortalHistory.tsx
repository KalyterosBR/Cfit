import { useState, type ComponentProps, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type PortalHistoryData = {
  charges: { id: string; description: string; amount: string; due_date: string; status: string; operational_category: string }[];
  checkins: { id: string; checked_in_at: string; access_result_label: string; source_label: string }[];
  assessments: { id: string; assessed_at: string; next_assessment_at: string | null; goal: string; notes: string; weight_kg: string | null; body_fat_percentage: string | null }[];
  documents: { id: string; title: string; version: string; content_snapshot: string; accepted_at: string | null; requires_acceptance: boolean; expires_at: string | null }[];
};
const calendarDate = (value: string) => new Date(value.length === 10 ? value + 'T12:00:00' : value).toLocaleDateString('pt-BR');
const categories: Record<string, string> = { overdue: 'Vencida', upcoming: 'A vencer', future: 'Futura', paid: 'Paga', canceled: 'Cancelada', inconsistent: 'Em análise', pending: 'Pendente' };
const money = (value: string) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function Section({ title, icon, children, count, note }: { title: string; icon: ComponentProps<typeof Ionicons>['name']; children: ReactNode; count: number; note?: string }) {
  const [open, setOpen] = useState(false);
  return <View style={s.section}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} style={s.heading}>
      <View style={s.icon}><Ionicons name={icon} size={20} color="#2266db" /></View>
      <View style={s.grow}><Text style={s.title}>{title}</Text><Text style={s.muted}>{count ? `${count} registro${count === 1 ? '' : 's'} disponível${count === 1 ? '' : 's'}` : 'Nenhum registro disponível'}</Text></View>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} color="#66768b" size={18} />
    </Pressable>
    {open ? <View style={s.body}>{note ? <Text style={s.note}>{note}</Text> : null}{count ? children : <Text style={s.empty}>Sua academia ainda não disponibilizou registros aqui.</Text>}</View> : null}
  </View>;
}

export default function PortalHistory({ data }: { data: PortalHistoryData }) {
  const [openedDocuments, setOpenedDocuments] = useState<Record<string, boolean>>({});
  const [chargeFilter, setChargeFilter] = useState<'all' | 'open' | 'paid'>('all');
  const charges = data.charges.filter(item => chargeFilter === 'all' || (chargeFilter === 'paid' ? item.status === 'paid' : ['pending', 'overdue'].includes(item.status)));
  return <View style={s.container}>
    <Text style={s.eyebrow}>MEU ACOMPANHAMENTO</Text>
    <View style={s.historyPanel}>
    <Section title="Financeiro" icon="wallet-outline" count={data.charges.length} note="Últimas 20 cobranças disponibilizadas pela academia.">
      <View style={s.filters}>{([['all', 'Todas'], ['open', 'Em aberto'], ['paid', 'Pagas']] as const).map(([value, label]) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: chargeFilter === value }} style={[s.filter, chargeFilter === value ? s.filterActive : null]} onPress={() => setChargeFilter(value)}><Text style={[s.filterText, chargeFilter === value ? s.filterTextActive : null]}>{label}</Text></Pressable>)}</View>
      {!charges.length ? <Text style={s.empty}>Nenhuma cobrança neste filtro.</Text> : null}
      {charges.map(item => <View style={s.row} key={item.id}>
        <View style={s.line}><Text style={[s.rowTitle, s.grow]}>{item.description}</Text><Text style={s.amount}>{money(item.amount)}</Text></View>
        <Text style={s.muted}>Vencimento: {calendarDate(item.due_date)}</Text>
        <Text style={[s.status, item.operational_category === 'overdue' ? s.danger : item.status === 'paid' ? s.success : null]}>{categories[item.operational_category] || categories[item.status] || item.status}</Text>
      </View>)}
    </Section>
    <Section title="Histórico de acessos" icon="footsteps-outline" count={data.checkins.length} note="Últimos 20 acessos registrados.">
      {data.checkins.map(item => <View style={s.row} key={item.id}><Text style={s.rowTitle}>{new Date(item.checked_in_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Text><Text style={s.muted}>{item.source_label} · {item.access_result_label}</Text></View>)}
    </Section>
    <Section title="Avaliações" icon="fitness-outline" count={data.assessments.length} note="Últimas 10 avaliações disponibilizadas.">
      {data.assessments.map(item => <View style={s.row} key={item.id}>
        <Text style={s.rowTitle}>Avaliação de {calendarDate(item.assessed_at)}</Text>
        {item.goal ? <Text style={s.muted}>Objetivo: {item.goal}</Text> : null}
        {item.weight_kg !== null ? <Text style={s.muted}>Peso: {item.weight_kg} kg</Text> : null}
        {item.body_fat_percentage !== null ? <Text style={s.muted}>Gordura corporal: {item.body_fat_percentage}%</Text> : null}
        {item.next_assessment_at ? <Text style={s.status}>Próxima avaliação: {calendarDate(item.next_assessment_at)}</Text> : null}
        {item.notes ? <Text style={s.muted}>{item.notes}</Text> : null}
      </View>)}
    </Section>
    <Section title="Documentos" icon="document-text-outline" count={data.documents.length} note="Últimos 20 documentos disponibilizados.">
      {data.documents.map(item => <View style={s.row} key={item.id}>
        <Text style={s.rowTitle}>{item.title}</Text>
        <Text style={s.muted}>Versão {item.version}</Text>
        <Text style={s.status}>{item.accepted_at ? `Aceito em ${calendarDate(item.accepted_at)}` : item.requires_acceptance ? 'Aguardando aceite no portal web' : 'Sem aceite obrigatório'}</Text>
        {item.expires_at ? <Text style={s.muted}>Validade: {calendarDate(item.expires_at)}</Text> : null}
        {item.content_snapshot ? <><Pressable accessibilityRole="button" accessibilityState={{ expanded: !!openedDocuments[item.id] }} accessibilityLabel={`${openedDocuments[item.id] ? 'Fechar' : 'Ler'} conteúdo de ${item.title}`} style={s.readDocument} onPress={() => setOpenedDocuments(current => ({ ...current, [item.id]: !current[item.id] }))}><Text style={s.readDocumentText}>{openedDocuments[item.id] ? 'Fechar conteúdo' : 'Ler documento'}</Text></Pressable>{openedDocuments[item.id] ? <Text selectable style={s.document}>{item.content_snapshot}</Text> : null}</> : <Text style={s.muted}>Consulte o arquivo no portal web.</Text>}
      </View>)}
    </Section>
    </View>
  </View>;
}
const s = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filter: { minHeight: 44, borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: '#f4f7fb' },
  filterActive: { backgroundColor: '#2266db' },
  filterText: { color: '#586980', fontWeight: '700', fontSize: 12 }, filterTextActive: { color: '#fff' },
  container: { marginTop: 28, gap: 12 },
  eyebrow: { color: '#66768b', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 2 },
  historyPanel: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce4ef', borderRadius: 18, overflow: 'hidden' }, section: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#dce4ef' },
  heading: { padding: 16, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 36, height: 36, backgroundColor: '#edf4ff', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 }, title: { color: '#14243c', fontSize: 15, fontWeight: '800' },
  muted: { color: '#586980', fontSize: 12, lineHeight: 20, marginTop: 4 },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  note: { color: '#66768b', fontSize: 11, lineHeight: 18, marginBottom: 8 },
  row: { borderTopColor: '#e5ebf3', borderTopWidth: 1, paddingVertical: 14 },
  line: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  rowTitle: { color: '#14243c', fontSize: 14, fontWeight: '700', lineHeight: 21 },
  amount: { color: '#14243c', fontSize: 15, fontWeight: '800' },
  status: { color: '#2266db', fontSize: 12, fontWeight: '700', marginTop: 7, lineHeight: 19 },
  danger: { color: '#b45309' }, success: { color: '#047857' },
  empty: { color: '#586980', fontSize: 13, lineHeight: 21 },
  readDocument: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, marginTop: 8, borderRadius: 10, backgroundColor: '#edf4ff' },
  readDocumentText: { color: '#2266db', fontSize: 12, fontWeight: '700' },
  document: { backgroundColor: '#f4f7fb', borderRadius: 10, padding: 12, marginTop: 12, color: '#40536d', fontSize: 13, lineHeight: 22 },
});
