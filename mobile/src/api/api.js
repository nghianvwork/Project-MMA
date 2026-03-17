import axios from 'axios';

import { API_BASE_CANDIDATES } from '../utils/apiClient';

const API_PATH = '/api';
const API_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS || 2500);

const appendApiPath = (baseUrl) => `${String(baseUrl || '').replace(/\/+$/, '')}${API_PATH}`;

const API_BASE_URLS = [
  ...new Set(API_BASE_CANDIDATES.map(appendApiPath).filter(Boolean)),
];

const API_BASE_URL = API_BASE_URLS[0] || 'http://localhost:3000/api';

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
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    console.log('[Auth] Token set');
  } else {
    delete api.defaults.headers.common.Authorization;
    console.log('[Auth] Token cleared');
  }
};

api.interceptors.request.use(
  (config) => {
    const baseIndex = Number(config._baseIndex ?? activeBaseIndex);
    const resolvedBaseUrl = API_BASE_URLS[baseIndex] || API_BASE_URL;

    config.baseURL = resolvedBaseUrl;
    config._baseIndex = baseIndex;

    // Ensure Authorization header from defaults is included if not already set
    if (!config.headers.Authorization && !config.headers.authorization) {
      const authHeader = api.defaults.headers.common.Authorization;
      if (authHeader) {
        config.headers.Authorization = authHeader;
      }
    }

    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log(
      '[API] Auth header:',
      config.headers?.Authorization || config.headers?.authorization ? 'present' : 'missing',
    );

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
  },
);

export default api;
export { API_BASE_URL };