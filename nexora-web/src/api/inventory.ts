import http from './http';

export const inventoryApi = {
  kardex(itemId: number) {
    return http.get(`/inventory/kardex?itemId=${itemId}`);
  },
  transfer(payload: { itemId: number; fromBranchId: number; toBranchId: number; quantity: number }) {
    return http.post('/inventory/transfer', payload);
  },
};
