import http from './http';

export const itemOwnersApi = {
  async list() {
    return http.get('/item-owners');
  },
  async create(data: any) {
    return http.post('/item-owners', data);
  },
  async update(id: number, data: any) {
    return http.patch(`/item-owners/${id}`, data);
  },
  async remove(id: number) {
    return http.delete(`/item-owners/${id}`);
  },
};
