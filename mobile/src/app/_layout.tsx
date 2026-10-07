import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TrainingProvider } from '../features/workouts/TrainingProvider';
import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
function Navigation() {
  const { profile } = useAuth();
  return <TrainingProvider key={profile?.email || 'anonymous'}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f4f7fb' } }}>
    <Stack.Screen name="index" />
    <Stack.Protected guard={!profile}><Stack.Screen name="login" /></Stack.Protected>
    <Stack.Protected guard={!!profile?.must_change_password}><Stack.Screen name="password-access" /></Stack.Protected>
    <Stack.Protected guard={!!profile && !profile.must_change_password}><Stack.Screen name="(app)" /><Stack.Screen name="treinar" /><Stack.Screen name="acompanhamento" /><Stack.Screen name="seguranca" /></Stack.Protected>
  </Stack></TrainingProvider>;
}
export default function RootLayout() { return <SafeAreaProvider><AuthProvider><Navigation /></AuthProvider></SafeAreaProvider>; }
