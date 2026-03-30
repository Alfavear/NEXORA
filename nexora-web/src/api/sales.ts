import http from './http';

export const salesApi = {
  async list() {
    return http.get('/sales');
  },

  async create(data: any) {
    return http.post('/sales', data);
  },

  async get(id: number) {
    return http.get(`/sales/${id}`);
  },

  async createReturn(id: number, data: any) {
    return http.post(`/sales/${id}/returns`, data);
  },
};
