import api from './api';

export const getProfile = (token) => {
    return api.get('/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const updateProfile = (token, data) => {
    return api.put('/user/profile', data, {
        headers: { Authorization: `Bearer ${token}` },
    });
};
