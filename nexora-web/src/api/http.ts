import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.trim() ||
  "http://localhost:3000";

const http = axios.create({
  baseURL,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default http;
