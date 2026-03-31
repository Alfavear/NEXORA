import http from './http';

export interface Role {
  id: number;
  name: string;
}

export interface CreateRoleDto {
  name: string;
}

export interface UpdateRoleDto {
  name?: string;
}

export const rolesApi = {
  list: () => http.get<Role[]>('/roles'),
  create: (data: CreateRoleDto) => http.post<Role>('/roles', data),
  update: (id: number, data: UpdateRoleDto) => http.patch<Role>(`/roles/${id}`, data),
  remove: (id: number) => http.delete(`/roles/${id}`),
};
