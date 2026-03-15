import api from './api';

export const getMedicationLogs = (params = {}) => {
    return api.get('/medication-logs', { params });
};

export const getMedicationSummary = (params = {}) => {
    return api.get('/medication-logs/summary', { params });
};

export const createMedicationLog = (data) => {
    return api.post('/medication-logs', data);
};

export const updateMedicationLog = (id, data) => {
    return api.put(`/medication-logs/${id}`, data);
};

export const deleteMedicationLog = (id) => {
    return api.delete(`/medication-logs/${id}`);
};
