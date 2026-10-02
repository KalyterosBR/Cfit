import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
function Navigation() {
  const { profile } = useAuth();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f4f7fb' } }}>
    <Stack.Screen name="index" />
    <Stack.Protected guard={!profile}><Stack.Screen name="login" /></Stack.Protected>
    <Stack.Protected guard={!!profile?.must_change_password}><Stack.Screen name="password-access" /></Stack.Protected>
    <Stack.Protected guard={!!profile && !profile.must_change_password}><Stack.Screen name="(app)" /></Stack.Protected>
  </Stack>;
}
export default function RootLayout() { return <SafeAreaProvider><AuthProvider><Navigation /></AuthProvider></SafeAreaProvider>; }
