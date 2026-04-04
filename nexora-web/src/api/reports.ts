import http from './http';

export interface SalesReportFilter {
  startDate?: string;
  endDate?: string;
}

export const reportsApi = {
  getSales: async (filters?: SalesReportFilter) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await http.get(`/reports/sales?${params.toString()}`);
    return response.data;
  },

  getSalesBySeller: async (filters?: { startDate?: string; endDate?: string; sellerId?: number }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.sellerId) params.append('sellerId', String(filters.sellerId));
    
    const response = await http.get(`/reports/sales-by-seller?${params.toString()}`);
    return response.data;
  },

  getCustomerStatement: async (customerId: number) => {
    const response = await http.get(`/reports/customer-statement?customerId=${customerId}`);
    return response.data;
  },

  getCollections: async (filters?: { startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await http.get(`/reports/collections?${params.toString()}`);
    return response.data;
  },

  getKardex: async (filters?: { itemId?: number; branchId?: number; startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();
    if (filters?.itemId) params.append('itemId', String(filters.itemId));
    if (filters?.branchId) params.append('branchId', String(filters.branchId));
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await http.get(`/reports/kardex?${params.toString()}`);
    return response.data;
  },
  
  getInventory: async () => {
    const response = await http.get('/reports/inventory');
    return response.data;
  },
  
  getCustomers: async () => {
    const response = await http.get('/reports/customers');
    return response.data;
  },
  
  getInvoiceReprints: async (filters?: { from?: string; to?: string; customerId?: number; systemNumber?: string }) => {
    const params = new URLSearchParams();
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.customerId) params.append('customerId', String(filters.customerId));
    if (filters?.systemNumber) params.append('systemNumber', filters.systemNumber);
    const response = await http.get(`/reports/invoice-reprints?${params.toString()}`);
    return response.data;
  },

  getReturnReprints: async (filters?: { from?: string; to?: string; customerId?: number; systemNumber?: string }) => {
    const params = new URLSearchParams();
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.customerId) params.append('customerId', String(filters.customerId));
    if (filters?.systemNumber) params.append('systemNumber', filters.systemNumber);
    const response = await http.get(`/reports/return-reprints?${params.toString()}`);
    return response.data;
  },

  getSalesVolume: async (filters?: { year?: number; month?: number; startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', String(filters.year));
    if (filters?.month) params.append('month', String(filters.month));
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await http.get(`/reports/sales-volume?${params.toString()}`);
    return response.data;
  }
};
