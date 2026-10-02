import { Redirect } from 'expo-router';
import { useAuth } from '../features/auth/AuthProvider';
export default function Index() {
  const { profile } = useAuth();
  return <Redirect href={!profile ? '/login' : profile.must_change_password ? '/password-access' : '/inicio'} />;
}
