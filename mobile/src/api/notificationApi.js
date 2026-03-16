import api from './api';


const ENDPOINT_MISSING_MESSAGE = 'Backend chưa có route /api/notifications. Hãy restart BE bằng bản code mới.';

const unwrapResponse = (response) => ({
    ...response,
    data: response?.data?.data ?? response?.data ?? {},
    meta: response?.data,
});

const normalizeNotificationError = (error) => {
    if (error?.message === 'Không tìm thấy endpoint') {
        const nextError = new Error(ENDPOINT_MISSING_MESSAGE);
        nextError.code = 'NOTIFICATION_ENDPOINT_MISSING';
        return nextError;
    }

    if (error?.response?.data?.message === 'Không tìm thấy endpoint') {
        const nextError = new Error(ENDPOINT_MISSING_MESSAGE);
        nextError.code = 'NOTIFICATION_ENDPOINT_MISSING';
        return nextError;
    }

    return error;
};

export const getNotificationSettings = () => {
    return api.get('/notifications').then(unwrapResponse).catch((error) => {
        throw normalizeNotificationError(error);
    });
};

export const updateNotificationSettings = (data) => {
    return api.put('/notifications', data).then(unwrapResponse).catch((error) => {
        throw normalizeNotificationError(error);
    });

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
