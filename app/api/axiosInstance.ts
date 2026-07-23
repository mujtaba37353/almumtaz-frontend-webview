import axios from 'axios';
import Constants from 'expo-constants';

// Prefer explicit IPv4 — `localhost` can resolve to ::1 and fail against an IPv4-only API.
const API_URL =
  Constants?.expoConfig?.extra?.API_URL ||
  (Constants as any)?.manifest?.extra?.API_URL ||
  'http://127.0.0.1:5000/api';

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

if (__DEV__) {
  console.log('[api] baseURL =', API_URL);
}

export default instance;
