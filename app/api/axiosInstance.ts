import axios from 'axios';
import Constants from 'expo-constants';

// تحميل المتغير من .env عبر expo-constants
const API_URL = Constants?.expoConfig?.extra?.API_URL;

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;
