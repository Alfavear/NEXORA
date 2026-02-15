import http from './http';

export interface Customer {
  id: number;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  companyId: number;
}

export interface CreateCustomerDto {
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

export const customersApi = {
  getAll: (isActive?: boolean) => {
    const params = isActive !== undefined ? { isActive } : {};
    return http.get<Customer[]>('/customers', { params });
  },

  getOne: (id: number) => {
    return http.get<Customer>(`/customers/${id}`);
  },

  create: (data: CreateCustomerDto) => {
    return http.post<Customer>('/customers', data);
  },

  update: (id: number, data: UpdateCustomerDto) => {
    return http.patch<Customer>(`/customers/${id}`, data);
  },

  delete: (id: number) => {
    return http.delete<Customer>(`/customers/${id}`);
  },
};