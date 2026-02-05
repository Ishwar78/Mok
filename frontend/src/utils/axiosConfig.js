import axios from "axios";

axios.defaults.baseURL =
  window.__API_BASE_URL__ ||
  process.env.REACT_APP_API_URL ||
  "";

axios.interceptors.request.use((config) => {
  const isLogin = config.url?.includes("/admin-users/login");

  if (!isLogin) {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("adminToken");
    }
    return Promise.reject(err);
  }
);

export default axios;
