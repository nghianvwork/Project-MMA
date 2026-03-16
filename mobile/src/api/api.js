import axios from 'axios';
<<<<<<< Updated upstream

// For iOS simulator, localhost works directly
// For Android emulator, use 10.0.2.2
// For physical device, use your computer's IP address
const API_BASE_URL = 'http://localhost:3000/api';

// Hardcoded user ID for development
const USER_ID = 'user123';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'x-user-id': USER_ID,
    },
});

// Request interceptor for logging
api.interceptors.request.use(
    (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => Promise.reject(error)
=======
import { Platform } from 'react-native';
import { API_BASE_CANDIDATES } from '../utils/apiClient';

const API_PATH = '/api';
const API_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS || 2500);

const DEFAULT_BASE =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const normalizeBase = (value) => String(value || '').trim().replace(/\/+$/, '');

const isLocalhostUrl = (url) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(String(url || ''));

const baseCandidates =
  Array.isArray(API_BASE_CANDIDATES) && API_BASE_CANDIDATES.length
    ? API_BASE_CANDIDATES
    : [DEFAULT_BASE];

const baseUrlCandidates = [
  ...new Set(
    baseCandidates.map((base) => `${normalizeBase(base)}${API_PATH}`),
  ),
].filter(Boolean);

const API_BASE_URLS =
  Platform.OS === 'android'
    ? baseUrlCandidates.filter((url) => !isLocalhostUrl(url))
    : baseUrlCandidates;

const API_BASE_URL =
  API_BASE_URLS[0] || `${normalizeBase(DEFAULT_BASE)}${API_PATH}`;

const configuredMaxRetries = Number(process.env.EXPO_PUBLIC_API_MAX_BASE_RETRIES);
const MAX_BASE_RETRIES =
  Number.isFinite(configuredMaxRetries) && configuredMaxRetries >= 0
    ? configuredMaxRetries
    : Math.max(0, API_BASE_URLS.length - 1);

let activeBaseIndex = 0;

const api = axios.create({
  baseURL: API_BASE_URL,
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

api.interceptors.request.use(
  (config) => {
    const baseIndex = Number(config._baseIndex ?? activeBaseIndex);
    const resolvedBaseUrl = API_BASE_URLS[baseIndex] || API_BASE_URL;
    config.baseURL = resolvedBaseUrl;
    config._baseIndex = baseIndex;

    console.log(
      `[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    );
    console.log(
      '[API] Auth header:',
      config.headers.Authorization ? 'present' : 'missing',
    );

    return config;
  },
  (error) => Promise.reject(error),
>>>>>>> Stashed changes
);

api.interceptors.response.use(
<<<<<<< Updated upstream
    (response) => response.data,
    (error) => {
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
>>>>>>> Stashed changes
    }

    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  },
);

export default api;
export { API_BASE_URL, USER_ID };
