import http from './http';

export interface PaymentMethod {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export const paymentMethodsApi = {
  getAll: async () => {
    const { data } = await http.get<PaymentMethod[]>('/payment-methods');
    return data;
  },
  create: async (payload: { name: string; isActive?: boolean }) => {
    const { data } = await http.post<PaymentMethod>('/payment-methods', payload);
    return data;
  },
  update: async (id: number, payload: { name?: string; isActive?: boolean }) => {
    const { data } = await http.patch<PaymentMethod>(`/payment-methods/${id}`, payload);
    return data;
  },
  delete: async (id: number) => {
    await http.delete(`/payment-methods/${id}`);
  },
};
