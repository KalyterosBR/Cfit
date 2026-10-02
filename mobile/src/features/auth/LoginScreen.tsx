import { useRef, useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Logo from '../../components/Logo';
import { useAuth } from './AuthProvider';
import { api, WEB_URL } from '../../services/api';
import { ApiError } from '../../services/client';
import { colors } from '../../theme/colors';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const passwordInput = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepConnected, setKeepConnected] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [error, setError] = useState('');

  const { setProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [code, setCode] = useState('');

  async function submit(resend = false) {
    if (submitting.current) return;
    if (!email.trim() || !password) {
      setError('Informe seu e-mail e senha.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (twoFactor && !resend && !/^\d{6}$/.test(code)) { setError('Informe o código de seis dígitos enviado ao seu e-mail.'); return; }
    submitting.current = true; setBusy(true); setError('');
    try {
      const profile = await api.login({ email: email.trim(), password, ...(twoFactor && !resend ? { two_factor_code: code } : {}) }, keepConnected);
      setPassword(''); setCode(''); setProfile(profile);
    } catch (e) {
      if (e instanceof ApiError && e.data.two_factor_required) setTwoFactor(true);
      setError(e instanceof Error ? e.message : 'Não foi possível entrar. Tente novamente.');
    } finally { submitting.current = false; setBusy(false); }

  }

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
      >
        <View style={s.container}>
          <View style={s.brand}>
            <Logo width={152} />
            <Text style={s.brandLabel}>PERFORMANCE PARA SUA ROTINA.</Text>
          </View>

          <View style={s.card}>
            <LinearGradient colors={[colors.blue, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.topLine} />
            <View style={s.cardContent}>
              <View style={s.context}>
                <View style={s.contextCopy}>
                  <Text style={s.environment}>AMBIENTE CFIT</Text>
                  <Text style={s.environmentDescription}>Sua academia com você</Text>
                </View>
                <View style={s.previewBadge}><Text style={s.previewBadgeText}>SEGURO</Text></View>
              </View>

              <Text style={s.eyebrow}>ÁREA DO ALUNO</Text>
              <Text accessibilityRole="header" style={s.title}>Bem-vindo de volta.</Text>
              <Text style={s.description}>Acesse seus treinos e continue acompanhando sua evolução.</Text>

              <View style={s.form}>
                <Text nativeID="email-label" style={s.label}>E-MAIL</Text>
                <View style={[s.inputRow, focused === 'email' && s.inputFocused]}>
                  <Feather name="mail" size={17} color={colors.secondary} accessible={false} />
                  <TextInput
                    accessibilityLabel="E-mail"
                    accessibilityLabelledBy="email-label"
                    style={s.input}
                    value={email}
                    editable={!busy}
                    onChangeText={value => { setEmail(value); setError(''); setTwoFactor(false); setCode(''); }}
                    placeholder="seu@email.com"
                    placeholderTextColor={colors.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInput.current?.focus()}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    selectionColor={colors.cyanText}
                  />
                </View>

                <Text nativeID="password-label" style={[s.label, s.passwordLabel]}>SENHA</Text>
                <View style={[s.inputRow, focused === 'password' && s.inputFocused]}>
                  <Feather name="lock" size={17} color={colors.secondary} accessible={false} />
                  <TextInput
                    ref={passwordInput}
                    accessibilityLabel="Senha"
                    accessibilityLabelledBy="password-label"
                    style={s.input}
                    value={password}
                    editable={!busy}
                    onChangeText={value => { setPassword(value); setError(''); setTwoFactor(false); setCode(''); }}
                    secureTextEntry={!showPassword}
                    placeholder="Digite sua senha"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={() => void submit()}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    selectionColor={colors.cyanText}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onPress={() => setShowPassword(current => !current)}
                    style={s.eyeButton}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.secondary} />
                  </Pressable>
                </View>

                <View style={s.options}>
                  <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: keepConnected }} onPress={() => setKeepConnected(current => !current)} style={s.keepConnected}>
                    <View style={[s.checkbox, keepConnected && s.checkboxChecked]}>
                      {keepConnected ? <Feather name="check" size={12} color={colors.white} /> : null}
                    </View>
                    <Text style={s.optionText}>Manter conectado</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => { void Linking.openURL(`${WEB_URL}/forgot-password`).catch(() => Alert.alert('Recuperação de senha', 'Não foi possível abrir o navegador. Tente novamente.')); }} style={s.recovery}>
                    <Text style={s.recoveryText}>Esqueci minha senha</Text>
                  </Pressable>
                </View>

                <View style={s.security}>
                  <Feather name="shield" size={17} color={colors.cyanText} accessible={false} />
                  <View style={s.securityCopy}>
                    <Text style={s.securityTitle}>ACESSO PROTEGIDO</Text>
                    <Text style={s.securityText}>Seu acesso é protegido. Nunca compartilhe sua senha.</Text>
                  </View>
                </View>

                {twoFactor ? <View style={{ marginTop: 16 }}><Text style={s.label}>CÓDIGO ENVIADO POR E-MAIL</Text><TextInput accessibilityLabel="Código de verificação" value={code} onChangeText={setCode} editable={!busy} keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} style={[s.inputRow, s.input, { paddingHorizontal: 14 }]} /><Pressable disabled={busy} onPress={() => { setCode(''); void submit(true); }} style={s.recovery}><Text style={s.recoveryText}>Reenviar código</Text></Pressable></View> : null}
                {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={s.error}>{error}</Text> : null}

                <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => void submit()} style={({ pressed }) => [s.submit, (busy) && { opacity: 0.55 }, pressed && s.pressed]}>
                  <LinearGradient colors={[colors.blue, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitContent}>
                    <Text style={s.submitText}>{busy ? 'Entrando…' : twoFactor ? 'Confirmar acesso' : 'Acessar o Cfit'}</Text>
                    <Feather name="arrow-right" size={17} color={colors.white} />
                  </LinearGradient>
                </Pressable>
                <Text style={s.cardFooter}>Treino, rotina e evolução em um único ambiente.</Text>
              </View>
            </View>
          </View>

          <Text style={s.previewNotice}>Acesse com a conta do portal do aluno fornecida pela sua academia.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
  container: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  brand: { alignItems: 'center', marginBottom: 24 },
  brandLabel: { color: '#64748b', fontSize: 9, letterSpacing: 1.6, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: 26, overflow: 'hidden' },
  topLine: { height: 3 },
  cardContent: { padding: 24 },
  context: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  contextCopy: { flex: 1 },
  environment: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.8 },
  environmentDescription: { color: '#e2e8f0', fontSize: 12, fontWeight: '600', marginTop: 6 },
  previewBadge: { borderWidth: 1, borderColor: '#334155', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  previewBadgeText: { color: colors.secondary, fontSize: 8, letterSpacing: 1, fontWeight: '700' },
  eyebrow: { color: colors.cyanText, fontSize: 10, letterSpacing: 1.8, fontWeight: '700', marginTop: 26 },
  title: { color: colors.white, fontSize: 27, fontWeight: '800', letterSpacing: -0.8, marginTop: 12 },
  description: { color: colors.secondary, fontSize: 14, lineHeight: 22, marginTop: 9 },
  form: { marginTop: 26 },
  label: { color: colors.secondary, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 4, backgroundColor: colors.input, borderColor: '#3a4658', borderWidth: 1, borderRadius: 12, marginTop: 8, minHeight: 50, gap: 10 },
  inputFocused: { borderColor: colors.cyanText },
  input: { flex: 1, minWidth: 0, color: colors.white, fontSize: 14, paddingVertical: 13, paddingHorizontal: 0 },
  passwordLabel: { marginTop: 18 },
  eyeButton: { minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', columnGap: 8, marginTop: 8 },
  keepConnected: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  checkbox: { width: 16, height: 16, borderWidth: 1, borderColor: '#64748b', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.blue, borderColor: colors.blue },
  optionText: { color: colors.secondary, fontSize: 11 },
  recovery: { minHeight: 44, justifyContent: 'center' },
  recoveryText: { color: '#93c5fd', fontSize: 11, fontWeight: '600' },
  security: { backgroundColor: '#101d30', borderColor: '#263247', borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  securityCopy: { flex: 1 },
  securityTitle: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1.1 },
  securityText: { color: colors.secondary, fontSize: 11, lineHeight: 17, marginTop: 5 },
  error: { color: colors.error, backgroundColor: '#3b2030', borderRadius: 10, fontSize: 12, lineHeight: 18, padding: 12, marginTop: 12 },
  submit: { borderRadius: 12, overflow: 'hidden', marginTop: 18 },
  submitContent: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14 },
  submitText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  cardFooter: { color: colors.muted, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 12 },
  previewNotice: { color: '#64748b', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 18, paddingHorizontal: 12 },
  pressed: { opacity: 0.8 },
});
