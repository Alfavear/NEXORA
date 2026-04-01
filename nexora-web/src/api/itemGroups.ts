import http from './http';

export const itemGroupsApi = {
  async list() {
    return http.get('/item-groups');
  },
  async create(data: any) {
    return http.post('/item-groups', data);
  },
  async update(id: number, data: any) {
    return http.patch(`/item-groups/${id}`, data);
  },
  async remove(id: number) {
    return http.delete(`/item-groups/${id}`);
  },
};
