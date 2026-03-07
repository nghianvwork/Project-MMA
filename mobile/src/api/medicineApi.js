import api from './api';

export const getMedicines = (params = {}) => {
    return api.get('/medicines', { params });
};

export const getMedicineById = (id) => {
    return api.get(`/medicines/${id}`);
};

export const createMedicine = (data) => {
    return api.post('/medicines', data);
};

export const updateMedicine = (id, data) => {
    return api.put(`/medicines/${id}`, data);
};

export const deleteMedicine = (id) => {
    return api.delete(`/medicines/${id}`);
};

export const updateStock = (id, stock_quantity) => {
    return api.patch(`/medicines/${id}/stock`, { stock_quantity });
};

export const getLowStockMedicines = () => {
    return api.get('/medicines/low-stock');
};
