import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PortalHistory, { type PortalHistoryData } from '../components/PortalHistory';
import PortalWebAction from '../components/PortalWebAction';
import { api } from '../services/api';
const sections = {
  financeiro: { title: 'Meu financeiro', description: 'Consulte suas cobranças e os pagamentos registrados.' },
  acessos: { title: 'Meus acessos', description: 'Acompanhe suas entradas registradas pela academia.' },
  avaliacoes: { title: 'Minhas avaliações', description: 'Resultados e orientações disponibilizados pela academia.' },
  documentos: { title: 'Meus documentos', description: 'Consulte documentos, versões e situação dos aceites.' },
} as const;
export default function HistoryScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const selected = section && Object.hasOwn(sections, section) ? section as keyof typeof sections : null;
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<PortalHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const version = useRef(0);
  const load = useCallback(async () => {
    const current = ++version.current;
    setLoading(true); setError('');
    try { const result = await api.authenticated<PortalHistoryData>('/users/portal/me/'); if (version.current === current) setData(result); }
    catch (e) { if (version.current === current) setError(e instanceof Error ? e.message : 'Não foi possível carregar seus registros.'); }
    finally { if (version.current === current) setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { if (selected) void load(); else setLoading(false); return () => { version.current += 1; }; }, [load, selected]));
  return <View style={s.page}><StatusBar style="dark" /><View style={[s.header, { paddingTop: insets.top + 8 }]}><Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/inicio')} style={s.back}><Ionicons name="chevron-back" size={22} color="#2266db" /><Text style={s.backText}>Voltar</Text></Pressable><Text style={s.eyebrow}>ACOMPANHAMENTO</Text></View><ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 28 }]} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { if (selected) void load(); }} tintColor="#2266db" />}>
    <Text style={s.title}>{selected ? sections[selected].title : 'Escolha um acompanhamento'}</Text><Text style={s.description}>{selected ? sections[selected].description : 'Abra uma das opções pela página inicial.'}</Text>
    {loading && !data ? <ActivityIndicator accessibilityLabel="Carregando registros" color="#2266db" style={s.loading} /> : null}
    {error ? <View style={s.error}><Text accessibilityRole="alert" style={s.errorText}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void load()} style={s.back}><Text style={s.backText}>Tentar novamente</Text></Pressable></View> : null}
    {data && selected ? <PortalHistory key={selected} data={data} section={selected} /> : null}
    {selected === 'documentos' ? <PortalWebAction title="Aceites no portal web" description="Os aceites são realizados no portal da academia." /> : null}
  </ScrollView></View>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f4f7fb' }, header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, borderBottomColor: '#e3eaf4' },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 }, backText: { color: '#2266db', fontSize: 14, fontWeight: '700' }, eyebrow: { color: '#66768b', fontSize: 9, letterSpacing: 1.5, fontWeight: '800' },
  content: { padding: 20, maxWidth: 640, width: '100%', alignSelf: 'center' }, title: { color: '#14243c', fontSize: 28, lineHeight: 36, fontWeight: '800', letterSpacing: -0.6 }, description: { color: '#586980', fontSize: 14, lineHeight: 22, marginTop: 10 }, loading: { marginTop: 32 },
  error: { padding: 16, backgroundColor: '#fff1f2', borderRadius: 14, marginTop: 20 }, errorText: { color: '#b91c1c', fontSize: 13, lineHeight: 21 },
});
