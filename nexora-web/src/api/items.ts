import http from './http';

export const itemsApi = {
  async list() {
    return http.get('/items?isActive=true');
  },
  async create(data: any) {
    return http.post('/items', data);
  },
};
