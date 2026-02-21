import axios from "axios";

axios.defaults.baseURL =
  window.__API_BASE_URL__ ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:3001";

axios.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("authToken") || // ✅ student
    localStorage.getItem("adminToken");  // fallback

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("adminToken");
    }
    return Promise.reject(err);
  }
);

export default axios;
