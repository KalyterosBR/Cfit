import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../features/auth/AuthProvider';
import { api } from '../services/api';
export default function PasswordAccess() {
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
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f4f7fb' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24, gap: 16 }}>
    <Text style={{ fontSize: 28, fontWeight: '800', color: '#14243c' }}>Prepare seu acesso.</Text>
    <Text>Troque sua senha inicial para continuar. Use pelo menos oito caracteres, letras maiúsculas e minúsculas, número e símbolo. Depois, entre com a nova senha.</Text>
    {([['Senha atual', current, setCurrent], ['Nova senha', next, setNext], ['Confirmar nova senha', confirmation, setConfirmation]] as const).map(([label, value, setter]) => <TextInput key={label} accessibilityLabel={label} placeholder={label} value={value} onChangeText={setter} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!busy} style={{ minHeight: 52, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 14 }} />)}
    {error ? <Text accessibilityRole="alert" style={{ color: '#b91c1c' }}>{error}</Text> : null}
    <Pressable disabled={busy} onPress={submit} style={{ backgroundColor: '#2563eb', padding: 18, borderRadius: 12 }}><Text style={{ color: '#fff', fontWeight: '700' }}>{busy ? 'Salvando…' : 'Salvar nova senha e entrar novamente'}</Text></Pressable>
    <Pressable disabled={busy} onPress={() => { void logout().catch(() => setError('Não foi possível limpar a sessão. Tente novamente.')); }} style={{ padding: 16 }}><Text>Voltar ao login</Text></Pressable>
  </ScrollView></KeyboardAvoidingView>;
}
