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

  async listReturns() {
    return http.get('/sales/returns');
  },

  async getCredits() {
    return http.get('/sales/credits');
  },

  async getCreditReport(
    from?: string,
    to?: string,
    customerId?: number,
    branchId?: number,
    status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED',
  ) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (customerId) params.set('customerId', String(customerId));
    if (branchId) params.set('branchId', String(branchId));
    if (status) params.set('status', status);
    return http.get(`/sales/credits/report?${params.toString()}`);
  },

  async createPayment(id: number, data: any) {
    return http.post(`/sales/${id}/payments`, data);
  },

  async getPayments(id: number) {
    return http.get(`/sales/${id}/payments`);
  },
};
