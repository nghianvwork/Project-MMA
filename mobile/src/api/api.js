import axios from 'axios';

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
export { API_BASE_URL, USER_ID };
