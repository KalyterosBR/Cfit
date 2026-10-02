import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  return <>
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2266db', tabBarInactiveTintColor: '#586980', tabBarLabelStyle: { fontSize: 11, fontWeight: '700' }, tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#dce4ef', paddingTop: 6 } }}>
      <Tabs.Screen name="inicio" options={{ title: 'Início', tabBarIcon: ({ color, focused }) => <View style={{ width: 48, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? '#edf4ff' : 'transparent' }}><Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={22} /></View> }} />
      <Tabs.Screen name="treinos" options={{ title: 'Treinos', tabBarIcon: ({ color, focused }) => <View style={{ width: 48, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? '#edf4ff' : 'transparent' }}><Ionicons name={focused ? 'barbell' : 'barbell-outline'} color={color} size={22} /></View> }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarIcon: ({ color, focused }) => <View style={{ width: 48, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? '#edf4ff' : 'transparent' }}><Ionicons name={focused ? 'calendar' : 'calendar-outline'} color={color} size={22} /></View> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color, focused }) => <View style={{ width: 48, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? '#edf4ff' : 'transparent' }}><Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={22} /></View> }} />
    </Tabs>
  </>;
}
