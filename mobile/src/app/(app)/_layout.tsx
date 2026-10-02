import { Tabs } from 'expo-router';

export default function RootLayout() {
  return <>
    <Tabs screenOptions={{ headerShown: false, tabBarIcon: () => null, tabBarActiveTintColor: '#2266db', tabBarInactiveTintColor: '#586980', tabBarLabelStyle: { fontSize: 12, fontWeight: '700' }, tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#dce4ef' } }}>
      <Tabs.Screen name="inicio" options={{ title: 'Início' }} />
      <Tabs.Screen name="treinos" options={{ title: 'Treinos' }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  </>;
}
