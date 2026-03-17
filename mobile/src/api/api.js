import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_BASE_CANDIDATES } from '../utils/apiClient';

const normalizeBase = (value) => String(value || '').replace(/\/+$/, '');

const getConfiguredBaseUrl = () => {
    const expoExtra = Constants?.expoConfig?.extra?.apiBaseUrl;
    if (expoExtra) return normalizeBase(expoExtra);

    const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (envUrl) return normalizeBase(envUrl);

    if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
    return 'http://localhost:3000';
};

const API_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS || 2500);
const API_PATH = '/api';

const candidateBases = [
    ...new Set([
        ...((API_BASE_CANDIDATES || []).map(normalizeBase)),
        getConfiguredBaseUrl(),
    ].filter(Boolean)),
];

const isLocalhost = (url) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url);

const availableBases =
    Platform.OS === 'android'
        ? candidateBases.filter((base) => !isLocalhost(base))
        : candidateBases;

const baseUrls = availableBases.length > 0 ? availableBases.map((base) => `${base}${API_PATH}`) : [`${getConfiguredBaseUrl()}${API_PATH}`];

const configuredMaxRetries = Number(process.env.EXPO_PUBLIC_API_MAX_BASE_RETRIES);
const MAX_BASE_RETRIES = Number.isFinite(configuredMaxRetries) && configuredMaxRetries >= 0
    ? configuredMaxRetries
    : Math.max(0, baseUrls.length - 1);

let activeBaseIndex = 0;

const api = axios.create({
    baseURL: baseUrls[0],
    timeout: API_TIMEOUT_MS,
    headers: {
        'Content-Type': 'application/json',
    },
});

const shouldRetryWithNextBase = (error) => {
    const status = Number(error?.response?.status || 0);
    if (error?.code === 'ECONNABORTED') return true;
    if (String(error?.message || '').toLowerCase().includes('network error')) return true;
    return status === 404 || status === 503 || status >= 500;
};

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        return;
    }

    delete api.defaults.headers.common.Authorization;
};

api.interceptors.request.use(
    (config) => {
        const baseIndex = Number(config._baseIndex ?? activeBaseIndex);
        config._baseIndex = baseIndex;
        config.baseURL = baseUrls[baseIndex] || baseUrls[0];
        return config;
    },
    (error) => Promise.reject(error),
);

api.interceptors.response.use(
    (response) => {
        activeBaseIndex = Number(response?.config?._baseIndex ?? activeBaseIndex);
        return response.data;
    },
    async (error) => {
        const originalRequest = error?.config;

        if (originalRequest && shouldRetryWithNextBase(error)) {
            const currentBaseIndex = Number(originalRequest._baseIndex ?? 0);
            const nextBaseIndex = currentBaseIndex + 1;
            const retryCount = Number(originalRequest._retryCount || 0);

            if (nextBaseIndex < baseUrls.length && retryCount < MAX_BASE_RETRIES) {
                originalRequest._baseIndex = nextBaseIndex;
                originalRequest._retryCount = retryCount + 1;
                originalRequest.baseURL = baseUrls[nextBaseIndex];
                return api.request(originalRequest);
            }
        }

        return Promise.reject(error?.response?.data || error);
    },
);

const API_BASE_URL = baseUrls[0];

export default api;
export { API_BASE_URL };
