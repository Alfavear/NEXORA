import http from "./http";

export type LoginPayload = { email: string; password: string; branchId?: number };
export type LoginResponse = { access_token: string };

export type MeResponse = {
  sub: number;
  email: string;
  role: "ADMIN" | "VENDEDOR";
  branchId: number;
  name: string;
  companyId: number;
  branchName: string | null;
  branches: { branchId: number; name: string }[];
};

export async function login(payload: LoginPayload) {
  const { data } = await http.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function me() {
  const { data } = await http.get<MeResponse>("/auth/me");
  return data;
}

export async function switchBranch(branchId: number) {
  const { data } = await http.post<LoginResponse>("/auth/switch-branch", { branchId });
  return data;
}