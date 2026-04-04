import http from './http';

export const taxesApi = {
  list: async () => {
    const res = await http.get('/taxes');
    return res.data ?? res;
  },
  get: async (id: number) => {
    const res = await http.get(`/taxes/${id}`);
    return res.data ?? res;
  },
  create: async (data: any) => {
    const res = await http.post('/taxes', data);
    return res.data ?? res;
  },
  update: async (id: number, data: any) => {
    const res = await http.patch(`/taxes/${id}`, data);
    return res.data ?? res;
  },
  remove: async (id: number) => {
    const res = await http.delete(`/taxes/${id}`);
    return res.data ?? res;
  },
};