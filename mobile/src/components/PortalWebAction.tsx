import { useState } from 'react';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WEB_URL } from '../services/api';

export default function PortalWebAction({ title = 'Abrir portal da academia', description = 'Reservas, aceites e dados cadastrais no portal web.' }: { title?: string; description?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function open() {
    if (busy) return;
    setBusy(true); setError('');
    try { await Linking.openURL(`${WEB_URL}/portal`); }
    catch { setError('Não foi possível abrir o navegador. Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <View style={s.container}><Pressable accessibilityRole="link" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => void open()} style={({ pressed }) => [s.action, pressed ? s.pressed : null]}><View style={s.icon}><Ionicons name="globe-outline" size={22} color="#2266db" /></View><View style={s.copy}><Text style={s.title}>{busy ? 'Abrindo…' : title}</Text><Text style={s.description}>{description} Pode ser necessário entrar novamente no navegador.</Text></View><Ionicons name="open-outline" size={18} color="#2266db" /></Pressable>{error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}</View>;
}
const s = StyleSheet.create({
  container: { marginTop: 20 }, action: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 72, backgroundColor: '#edf4ff', borderRadius: 16 },
  icon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 },
  title: { color: '#14243c', fontSize: 14, fontWeight: '800' }, description: { color: '#586980', fontSize: 12, lineHeight: 19, marginTop: 5 },
  pressed: { opacity: 0.75 }, error: { color: '#b91c1c', fontSize: 12, lineHeight: 19, marginTop: 8 },
});
