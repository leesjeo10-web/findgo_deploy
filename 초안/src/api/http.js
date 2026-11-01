import axios from 'axios';
export const isDemo = import.meta.env.VITE_USE_MOCK === 'true' ||
  (import.meta.env.VITE_USE_MOCK !== 'false' && !import.meta.env.VITE_API_BASE_URL);
export const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 15000, withCredentials: true });
let accessToken = null;
export function setAccessToken(token) { accessToken = token; }
http.interceptors.request.use(config => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
http.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !/\/auth\/(login|signup)$/.test(error.config?.url || '')) window.dispatchEvent(new Event('chatgo:unauthorized'));
  return Promise.reject(error);
});
export function errorMessage(error) {
  if (error.response?.status === 401) return '이메일 또는 비밀번호를 확인해 주세요.';
  if (error.response?.status === 403) return '이 작업을 할 수 있는 권한이 없어요.';
  if (error.response?.status === 404) return '물건을 찾을 수 없어요.';
  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') return '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.';
  return error.response?.data?.message || error.message || '요청을 처리하지 못했어요. 다시 시도해 주세요.';
}
