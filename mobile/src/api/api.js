import axios from 'axios';

import { API_BASE_CANDIDATES } from '../utils/apiClient';

const API_PATH = '/api';
const API_BASE_URL = `${API_BASE_CANDIDATES[0] || 'http://localhost:3000'}${API_PATH}`;

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_BASE_CANDIDATES } from '../utils/apiClient';

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
const API_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS || 2500);
const isLocalhostUrl = (url) =>
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(String(url || ''));

const baseUrlCandidates = [
    ...new Set([
        ...API_BASE_CANDIDATES.map((base) => `${base.replace(/\/+$/, '')}/api`),
        API_BASE_URL,
    ]),
];

const API_BASE_URLS =
    Platform.OS === 'android'
        ? baseUrlCandidates.filter((url) => !isLocalhostUrl(url))
        : baseUrlCandidates;

const configuredMaxRetries = Number(process.env.EXPO_PUBLIC_API_MAX_BASE_RETRIES);
const MAX_BASE_RETRIES = Number.isFinite(configuredMaxRetries) && configuredMaxRetries >= 0
    ? configuredMaxRetries
    : Math.max(0, API_BASE_URLS.length - 1);
let activeBaseIndex = 0;


const api = axios.create({
    baseURL: API_BASE_URLS[0] || API_BASE_URL,
    timeout: API_TIMEOUT_MS,
    headers: {
        'Content-Type': 'application/json',
    },
});

const shouldRetryWithNextBaseUrl = (error) => {
    const status = Number(error?.response?.status || 0);

    if (error?.code === 'ECONNABORTED') return true;
    if (String(error?.message || '').toLowerCase().includes('network error')) return true;

    return status === 503 || status >= 500 || status === 404;
};

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

        const baseIndex = Number(config._baseIndex ?? activeBaseIndex);
        const resolvedBaseUrl = API_BASE_URLS[baseIndex] || API_BASE_URLS[0] || API_BASE_URL;
        config.baseURL = resolvedBaseUrl;
        config._baseIndex = baseIndex;

        console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        console.log('[API] Auth header:', config.headers.Authorization ? 'present' : 'missing');
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response.data,
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

    (response) => {
        activeBaseIndex = Number(response?.config?._baseIndex ?? activeBaseIndex);
        return response.data;
    },
    async (error) => {
        const originalRequest = error?.config;

        if (originalRequest && shouldRetryWithNextBaseUrl(error)) {
            const currentBaseIndex = Number(originalRequest._baseIndex ?? 0);
            const nextBaseIndex = currentBaseIndex + 1;
            const retryCount = Number(originalRequest._retryCount || 0);

            if (nextBaseIndex < API_BASE_URLS.length && retryCount < MAX_BASE_RETRIES) {
                originalRequest._baseIndex = nextBaseIndex;
                originalRequest._retryCount = retryCount + 1;
                originalRequest.baseURL = API_BASE_URLS[nextBaseIndex];
                console.log(
                    `[API] Retry with fallback base URL: ${API_BASE_URLS[nextBaseIndex]}`,
                );
                return api.request(originalRequest);

            }
        }

        console.error('[API Error]', error.response?.data || error.message);
        return Promise.reject(error.response?.data || error);
=======
  (response) => {
    activeBaseIndex = Number(response?.config?._baseIndex ?? activeBaseIndex);
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;

    if (originalRequest && shouldRetryWithNextBaseUrl(error)) {
      const currentBaseIndex = Number(originalRequest._baseIndex ?? 0);
      const nextBaseIndex = currentBaseIndex + 1;
      const retryCount = Number(originalRequest._retryCount || 0);

      if (nextBaseIndex < API_BASE_URLS.length && retryCount < MAX_BASE_RETRIES) {
        originalRequest._baseIndex = nextBaseIndex;
        originalRequest._retryCount = retryCount + 1;
        originalRequest.baseURL = API_BASE_URLS[nextBaseIndex];
        console.log(
          `[API] Retry with fallback base URL: ${API_BASE_URLS[nextBaseIndex]}`,
        );
        return api.request(originalRequest);
      }
 Stashed changes
    }

    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  },
);

export default api;
export { API_BASE_URL };
