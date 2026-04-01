import http from './http';

export const itemBrandsApi = {
  async list() {
    return http.get('/item-brands');
  },
  async create(data: any) {
    return http.post('/item-brands', data);
  },
  async update(id: number, data: any) {
    return http.patch(`/item-brands/${id}`, data);
  },
  async remove(id: number) {
    return http.delete(`/item-brands/${id}`);
  },
};
