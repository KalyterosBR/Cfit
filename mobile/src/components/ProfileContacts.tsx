import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../services/api';

export type ContactData = { phone: string | null; emergency_contact?: string | null; emergency_phone?: string | null };
export default function ProfileContacts({ student, onSaved }: { student: ContactData; onSaved: (values: ContactData) => void }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({ phone: '', emergency_contact: '', emergency_phone: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const operation = useRef(false);
  const hasEmergencyData = Object.hasOwn(student, 'emergency_contact') && Object.hasOwn(student, 'emergency_phone');
  function begin() {
    setValues({ phone: student.phone || '', emergency_contact: student.emergency_contact || '', emergency_phone: student.emergency_phone || '' });
    setError(''); setMessage(''); setEditing(true);
  }
  async function save() {
    if (operation.current) return;
    const payload = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])) as typeof values;
    for (const value of [payload.phone, payload.emergency_phone]) {
      if (value && (!/^[+\d\s().-]+$/.test(value) || ![10, 11].includes(value.replace(/\D/g, '').length))) {
        setError('Informe os telefones com DDD e 10 ou 11 dígitos.'); return;
      }
    }
    operation.current = true; setBusy(true); setError('');
    try {
      const availableValues = hasEmergencyData ? payload : { phone: payload.phone };
      await api.authenticated('/users/portal/me/', availableValues, 'PATCH');
      onSaved(availableValues); setEditing(false); setMessage('Contatos atualizados.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar seus contatos.'); }
    finally { operation.current = false; setBusy(false); }
  }
  return <View style={s.container}>
    <Text style={s.heading}>Meus contatos</Text>
    {editing ? <>
      <Text style={s.description}>Atualize seu telefone e quem a academia pode contatar em uma emergência.</Text>
      {([['phone', 'Meu telefone', 20], ['emergency_contact', 'Contato de emergência', 100], ['emergency_phone', 'Telefone de emergência', 20]] as const).filter(([key]) => key === 'phone' || hasEmergencyData).map(([key, label, maxLength]) => <View key={key}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} style={s.input} value={values[key]} onChangeText={value => setValues(current => ({ ...current, [key]: value }))} maxLength={maxLength} keyboardType={key === 'emergency_contact' ? 'default' : 'phone-pad'} editable={!busy} placeholder={key === 'emergency_contact' ? 'Nome do contato' : '(00) 00000-0000'} placeholderTextColor="#66768b" /></View>)}
      <View style={s.actions}><Pressable accessibilityRole="button" disabled={busy} onPress={() => void save()} style={[s.button, busy ? s.disabled : null]}><Text style={s.buttonText}>{busy ? 'Salvando…' : 'Salvar contatos'}</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} onPress={() => { setEditing(false); setError(''); }} style={s.cancel}><Text style={s.link}>Cancelar</Text></Pressable></View>
    </> : <>
      <Text style={s.description}>Telefone: {student.phone || 'Não informado'}</Text>
      {hasEmergencyData ? <Text style={s.description}>{student.emergency_contact || student.emergency_phone ? `Emergência: ${[student.emergency_contact, student.emergency_phone].filter(Boolean).join(' · ')}` : 'Contato de emergência não informado.'}</Text> : null}
      <Pressable accessibilityRole="button" onPress={begin} style={s.cancel}><Text style={s.link}>Editar contatos →</Text></Pressable>
    </>}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    {message ? <Text accessibilityLiveRegion="polite" style={s.success}>{message}</Text> : null}
  </View>;
}
const s = StyleSheet.create({
  container: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce4ef', borderRadius: 18, padding: 18, marginTop: 20 }, heading: { color: '#14243c', fontSize: 18, fontWeight: '800' },
  description: { color: '#586980', fontSize: 13, lineHeight: 21, marginTop: 10 }, label: { color: '#40536d', fontSize: 12, fontWeight: '700', marginTop: 18 },
  input: { color: '#14243c', backgroundColor: '#f4f7fb', borderWidth: 1, borderColor: '#dce4ef', borderRadius: 12, minHeight: 48, padding: 12, marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 18 }, button: { backgroundColor: '#2266db', borderRadius: 12, minHeight: 48, paddingHorizontal: 16, justifyContent: 'center' }, buttonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cancel: { minHeight: 44, justifyContent: 'center', marginTop: 4 }, link: { color: '#2266db', fontSize: 13, fontWeight: '700' }, disabled: { opacity: 0.5 }, error: { color: '#b91c1c', fontSize: 13, lineHeight: 21, marginTop: 12 }, success: { color: '#047857', fontSize: 13, marginTop: 10 },
});
