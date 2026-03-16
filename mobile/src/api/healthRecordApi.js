import api from "./api";

const unwrapResponse = (response) => ({
  ...response,
  data: response?.data?.data ?? response?.data ?? [],
  meta: response?.data,
});

export const createHealthRecord = (payload) => {
  return api.post("/health-records", payload).then(unwrapResponse);
};

export const updateHealthRecord = (id, payload) => {
  return api.put(`/health-records/${id}`, payload).then(unwrapResponse);
};

export const deleteHealthRecord = (id) => {
  return api.delete(`/health-records/${id}`).then(unwrapResponse);
};
