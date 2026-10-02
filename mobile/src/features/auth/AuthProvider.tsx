import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { api } from '../../services/api';
import type { Profile } from '../../services/client';
const Context = createContext<{ profile: Profile | null; setProfile: (profile: Profile | null) => void; logout: () => Promise<void> } | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const attempt = useRef(0);
  async function restore() {
    const version = ++attempt.current;
    setLoading(true); setError('');
    try { const next = await api.restore(); if (version === attempt.current) setProfile(next); }
    catch (e) { if (version === attempt.current) setError(e instanceof Error ? e.message : 'Não foi possível restaurar a sessão.'); }
    finally { if (version === attempt.current) setLoading(false); }
  }
  useEffect(() => {
    api.setOnExpired(() => setProfile(null));
    const version = ++attempt.current;
    void api.restore().then(next => { if (version === attempt.current) setProfile(next); }).catch(e => { if (version === attempt.current) setError(e instanceof Error ? e.message : 'Não foi possível restaurar a sessão.'); }).finally(() => { if (version === attempt.current) setLoading(false); });
    return () => { attempt.current += 1; api.setOnExpired(() => {}); };
  }, []);
  async function logout() {
    try { await api.clear(); } finally { setProfile(null); }
  }
  if (loading || error) return <View style={{ flex: 1, backgroundColor: '#f4f7fb', justifyContent: 'center', padding: 28, gap: 20 }}>
    {loading ? <ActivityIndicator color="#2563eb" /> : <><Text accessibilityRole="alert">{error}</Text><Pressable onPress={() => void restore()} style={{ padding: 16 }}><Text>Tentar novamente</Text></Pressable><Pressable onPress={() => { void logout().then(() => setError('')).catch(() => setError('Não foi possível limpar a sessão. Tente novamente.')); }} style={{ padding: 16 }}><Text>Voltar ao login</Text></Pressable></>}
  </View>;
  return <Context.Provider value={{ profile, setProfile, logout }}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error('AuthProvider ausente'); return value; }
