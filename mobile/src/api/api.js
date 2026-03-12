import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Physical device: use LAN IP
// Android emulator: 10.0.2.2
// iOS simulator: localhost
const getBaseUrl = () => {
    const expoExtra = Constants.expoConfig?.extra?.apiBaseUrl;
    if (expoExtra) return expoExtra.replace(/\/+$/, '') + '/api';

    const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (envUrl) return envUrl.replace(/\/+$/, '') + '/api';

    // Fallback per platform
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api';
    return 'http://localhost:3000/api';
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('[Auth] Token set');
    } else {
        delete api.defaults.headers.common['Authorization'];
        console.log('[Auth] Token cleared');
    }
};

// Request interceptor for logging
api.interceptors.request.use(
    (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        console.log('[API] Auth header:', config.headers.Authorization ? 'present' : 'missing');
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error('[API Error]', error.response?.data || error.message);
        return Promise.reject(error.response?.data || error);
    }
);

export default api;
export { API_BASE_URL };
