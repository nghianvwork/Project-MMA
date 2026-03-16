import api from './api';

const unwrapResponse = (response) => ({
    ...response,
    data: response?.data?.data ?? response?.data ?? [],
    meta: response?.data,
});

export const getMedicationLogs = (params = {}) => {
    return api.get('/medication-logs', { params }).then(unwrapResponse);
};

export const getMedicationSummary = (params = {}) => {
    return api.get('/medication-logs/summary', { params }).then(unwrapResponse);
};

export const createMedicationLog = (data) => {
    return api.post('/medication-logs', data).then(unwrapResponse);
};
