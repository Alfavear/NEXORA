import http from './http';

export const itemsApi = {
  async list() {
    return http.get('/items?isActive=true');
  },
};
