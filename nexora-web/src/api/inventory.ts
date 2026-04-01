import http from './http';

export const inventoryApi = {
  kardex(itemId: number) {
    return http.get(`/inventory/kardex?itemId=${itemId}`);
  },
  transfer(payload: { itemId: number; fromBranchId: number; toBranchId: number; quantity: number }) {
    return http.post('/inventory/transfer', payload);
  },
  listAdjustments(status?: string) {
    const params = status ? `?status=${encodeURIComponent(status)}` : '';
    return http.get(`/inventory/adjustments${params}`);
  },
  createAdjustment(payload: {itemId:number; branchId?:number; quantity:number; reason?:string; notes?:string}) {
    return http.post('/inventory/adjustments', payload);
  },
  approveAdjustment(id:number, payload: { approved?: boolean; notes?: string }) {
    return http.post(`/inventory/adjustments/${id}/approve`, payload);
  },
};
