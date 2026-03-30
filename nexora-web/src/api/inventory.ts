import http from './http';

export const inventoryApi = {
  kardex(itemId: number) {
    return http.get(`/inventory/kardex?itemId=${itemId}`);
  },
};
