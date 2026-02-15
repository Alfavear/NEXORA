import axios from "axios";

const http = axios.create({
  baseURL: "http://localhost:3000",
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default http;