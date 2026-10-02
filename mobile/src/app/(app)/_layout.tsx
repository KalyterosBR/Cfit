import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  return <>
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2266db', tabBarInactiveTintColor: '#586980', tabBarLabelStyle: { fontSize: 12, fontWeight: '700' }, tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#dce4ef', paddingTop: 8 } }}>
      <Tabs.Screen name="inicio" options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="treinos" options={{ title: 'Treinos', tabBarIcon: ({ color, size }) => <Ionicons name="barbell-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tabs>
  </>;
}
