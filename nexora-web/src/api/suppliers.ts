import http from './http';

export interface Supplier {
  id: number;
  name: string;
  ruc?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  companyId: number;
}

export interface CreateSupplierDto {
  name: string;
  ruc?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  ruc?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

export const suppliersApi = {
  getAll: (isActive?: boolean) => {
    const params = isActive !== undefined ? { isActive } : {};
    return http.get<Supplier[]>('/suppliers', { params });
  },

  getOne: (id: number) => {
    return http.get<Supplier>(`/suppliers/${id}`);
  },

  create: (data: CreateSupplierDto) => {
    return http.post<Supplier>('/suppliers', data);
  },

  update: (id: number, data: UpdateSupplierDto) => {
    return http.patch<Supplier>(`/suppliers/${id}`, data);
  },

  delete: (id: number) => {
    return http.delete<Supplier>(`/suppliers/${id}`);
  },
};