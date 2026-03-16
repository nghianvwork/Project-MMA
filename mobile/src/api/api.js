import axios from 'axios';
import { API_BASE_CANDIDATES } from '../utils/apiClient';

const API_PATH = '/api';
const API_BASE_URL = `${API_BASE_CANDIDATES[0] || 'http://localhost:3000'}${API_PATH}`;

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
        if (!config.baseURL) {
            config.baseURL = API_BASE_URL;
        }
        console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        console.log('[API] Auth header:', config.headers.Authorization ? 'present' : 'missing');
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const config = error.config || {};
        const shouldRetry =
            !error.response &&
            !config.__fallbackRetry &&
            Array.isArray(API_BASE_CANDIDATES) &&
            API_BASE_CANDIDATES.length > 1;

        if (shouldRetry) {
            const currentBase = String(config.baseURL || '').replace(/\/+$/, '');
            const nextBase = API_BASE_CANDIDATES.find(
                (candidate) => `${candidate}${API_PATH}` !== currentBase
            );

            if (nextBase) {
                const authHeader =
                    config.headers?.Authorization ||
                    config.headers?.authorization ||
                    api.defaults.headers.common?.Authorization ||
                    api.defaults.headers.common?.authorization;

                console.warn(`[API] Network error. Retrying with ${nextBase}${API_PATH}`);
                return api.request({
                    ...config,
                    __fallbackRetry: true,
                    baseURL: `${nextBase}${API_PATH}`,
                    headers: {
                        ...(config.headers || {}),
                        ...(authHeader ? { Authorization: authHeader } : {}),
                    },
                });
            }
        }

        console.error('[API Error]', error.response?.data || error.message);
        return Promise.reject(error.response?.data || error);
    }
);

export default api;
export { API_BASE_URL };
