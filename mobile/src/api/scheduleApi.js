import api from './api';

const unwrapResponse = (response) => ({
    ...response,
    data: response?.data?.data ?? response?.data ?? [],
    meta: response?.data,
});

export const getSchedules = (params = {}) => {
    return api.get('/schedules', { params }).then(unwrapResponse);
};

export const getScheduleById = (id) => {
    return api.get(`/schedules/${id}`).then(unwrapResponse);
};

export const getSchedulesByDate = (date) => {
    return api.get(`/schedules/date/${date}`).then(unwrapResponse);
};

export const createSchedule = (data) => {
    return api.post('/schedules', data).then(unwrapResponse);
};

export const updateSchedule = (id, data) => {
    return api.put(`/schedules/${id}`, data).then(unwrapResponse);
};

export const deleteSchedule = (id) => {
    return api.delete(`/schedules/${id}`).then(unwrapResponse);
};
