import * as SecureStore from 'expo-secure-store';
import { createClient } from './client';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://cfit-api.vercel.app/api').replace(/\/$/, '');
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://cfit-web.vercel.app').replace(/\/$/, '');
if (!API_URL.startsWith('https://') || !WEB_URL.startsWith('https://')) throw new Error('Configure URLs HTTPS para o Cfit.');
const key = 'cfit_mobile_session';
export const api = createClient(API_URL, {
  read: () => SecureStore.getItemAsync(key),
  write: value => SecureStore.setItemAsync(key, value),
  clear: () => SecureStore.deleteItemAsync(key),
});
