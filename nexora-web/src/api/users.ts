import { http } from "./http";

export type UserRow = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  role: { name: string };
  userBranches: { branchId: number; isActive: boolean; branch: { name: string } }[];
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  branchIds: number[];
};

export async function listUsers() {
  const { data } = await http.get<UserRow[]>("/users");
  return data;
}

export async function createUser(payload: CreateUserPayload) {
  const { data } = await http.post<UserRow>("/users", payload);
  return data;
}

export async function updateUser(id: number, payload: { name?: string; isActive?: boolean }) {
  const { data } = await http.patch(`/users/${id}`, payload);
  return data;
}

export async function replaceUserBranches(id: number, branchIds: number[]) {
  const { data } = await http.put(`/users/${id}/branches`, { branchIds });
  return data;
}
