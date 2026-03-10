import api from './api';

export const getSchedules = (params = {}) => {
    return api.get('/schedules', { params });
};

export const getScheduleById = (id) => {
    return api.get(`/schedules/${id}`);
};

export const getSchedulesByDate = (date) => {
    return api.get(`/schedules/date/${date}`);
};

export const createSchedule = (data) => {
    return api.post('/schedules', data);
};

export const updateSchedule = (id, data) => {
    return api.put(`/schedules/${id}`, data);
};

export const deleteSchedule = (id) => {
    return api.delete(`/schedules/${id}`);
};
