import api from './api';

const unwrapResponse = (response) => ({
    ...response,
    data: response?.data?.data ?? response?.data ?? [],
    meta: response?.data,
});

export const getMedicines = (params = {}) => {
    return api.get('/medicines', { params }).then(unwrapResponse);
};

export const getMedicineById = (id) => {
    return api.get(`/medicines/${id}`).then(unwrapResponse);
};

export const createMedicine = (data) => {
    return api.post('/medicines', data).then(unwrapResponse);
};

export const updateMedicine = (id, data) => {
    return api.put(`/medicines/${id}`, data).then(unwrapResponse);
};

export const deleteMedicine = (id) => {
    return api.delete(`/medicines/${id}`).then(unwrapResponse);
};

export const updateStock = (id, stock_quantity) => {
    return api.patch(`/medicines/${id}/stock`, { stock_quantity }).then(unwrapResponse);
};

export const getLowStockMedicines = () => {
    return api.get('/medicines/low-stock').then(unwrapResponse);
};
