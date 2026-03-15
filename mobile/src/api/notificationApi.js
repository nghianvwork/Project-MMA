import api from './api';

export const savePushToken = (expo_push_token, device_id, platform) => {
    return api.post('/notifications/push-token', {
        expo_push_token,
        device_id,
        platform,
    });
};

export const removePushToken = (expo_push_token) => {
    return api.delete('/notifications/push-token', {
        data: { expo_push_token },
    });
};

export const getNotificationSettings = () => {
    return api.get('/notifications');
};

export const updateNotificationSettings = (settings) => {
    return api.put('/notifications', settings);
};
