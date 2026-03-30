import http from './http';

export const reportsApi = {
  async sales(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return http.get(`/sales/report?${params.toString()}`);
  },
};
