import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Logo from '../../components/Logo';
import { useAuth } from './AuthProvider';
import { api } from '../../services/api';
export default function PasswordForm({ firstAccess = true }: { firstAccess?: boolean }) {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  async function submit() {
    if (working.current) return;
    if (!current || !next || next !== confirmation) { setError('Preencha as senhas e confirme a nova senha corretamente.'); return; }
    working.current = true; setBusy(true); setError('');
    try { await api.authenticated('/users/password/change/', { current_password: current, new_password: next }); setCurrent(''); setNext(''); setConfirmation(''); await logout(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível trocar a senha.'); }
    finally { working.current = false; setBusy(false); }
  }
  return <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <StatusBar style="dark" />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }]}>
      <View style={s.brand}><Logo width={112} /></View>
      <View style={s.card}>
        <Text style={s.eyebrow}>{firstAccess ? 'PRIMEIRO ACESSO' : 'SEGURANÇA DA CONTA'}</Text>
        <Text style={s.title}>{firstAccess ? 'Prepare seu acesso.' : 'Alterar minha senha.'}</Text>
        <Text style={s.description}>{firstAccess ? 'Troque sua senha inicial para continuar. ' : 'Informe a senha atual e escolha uma nova. '}Use pelo menos oito caracteres, letras maiúsculas e minúsculas, número e símbolo. Depois, entre com a nova senha.</Text>
        {([['Senha atual', current, setCurrent], ['Nova senha', next, setNext], ['Confirmar nova senha', confirmation, setConfirmation]] as const).map(([label, value, setter]) => <View key={label} style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} placeholder={label} placeholderTextColor="#66768b" value={value} onChangeText={setter} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!busy} style={s.input} /></View>)}
        {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={busy} onPress={submit} style={[s.button, busy ? s.disabled : null]}><Text style={s.buttonText}>{busy ? 'Salvando…' : 'Salvar nova senha'}</Text></Pressable>
        <Text style={s.caption}>Você entrará novamente com a senha atualizada.</Text>
      </View>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => { if (!firstAccess) { if (router.canGoBack()) router.back(); else router.replace('/(app)/perfil'); return; } void logout().catch(() => setError('Não foi possível limpar a sessão. Tente novamente.')); }} style={s.back}><Text style={s.backText}>{firstAccess ? 'Voltar ao login' : 'Voltar ao perfil'}</Text></Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f4f7fb' },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, width: '100%', maxWidth: 480, alignSelf: 'center' },
  brand: { alignItems: 'center', marginBottom: 24 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce4ef', borderRadius: 22, padding: 22 },
  eyebrow: { color: '#2266db', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#14243c', fontSize: 26, lineHeight: 34, fontWeight: '800', letterSpacing: -0.6, marginTop: 10 },
  description: { color: '#586980', fontSize: 14, lineHeight: 22, marginTop: 12, marginBottom: 6 },
  field: { marginTop: 16, gap: 8 },
  label: { color: '#40536d', fontSize: 12, fontWeight: '700' },
  input: { minHeight: 52, backgroundColor: '#f4f7fb', borderWidth: 1, borderColor: '#dce4ef', borderRadius: 12, padding: 14, color: '#14243c', fontSize: 14 },
  error: { color: '#b91c1c', fontSize: 13, lineHeight: 21, marginTop: 16 },
  button: { backgroundColor: '#2563eb', minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 22, padding: 14 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  caption: { color: '#66768b', fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 12 },
  back: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  backText: { color: '#2266db', fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.55 },
});
