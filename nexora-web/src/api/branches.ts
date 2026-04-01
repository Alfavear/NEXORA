import http from './http';

export interface Branch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  createdAt: string;
  companyId: number;
}

export interface CreateBranchDto {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateBranchDto {
  name?: string;
  address?: string;
  phone?: string;
}

export const branchesApi = {
  list: () => http.get<Branch[]>('/branches'),
  create: (data: CreateBranchDto) => http.post<Branch>('/branches', data),
  update: (id: number, data: UpdateBranchDto) => http.patch<Branch>(`/branches/${id}`, data),
  remove: (id: number) => http.delete(`/branches/${id}`),
};
