import http from './http';

export const categoriesApi = {
  async list() {
    return http.get('/categories?isActive=true');
  },
};
