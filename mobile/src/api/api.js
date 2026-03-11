import axios from 'axios';
import Constants from 'expo-constants';

// Physical device: use LAN IP
// Android emulator: 10.0.2.2
// iOS simulator: localhost
const API_BASE_URL =
    Constants.expoConfig?.extra?.apiBaseUrl ||
    process.env.EXPO_PUBLIC_API_BASE_URL
        ? `${process.env.EXPO_PUBLIC_API_BASE_URL}/api`
        : 'http://10.33.59.167:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
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
