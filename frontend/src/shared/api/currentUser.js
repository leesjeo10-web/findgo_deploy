import { apiRequest } from './http.js';
export const getCurrentUser = () => apiRequest('/auth/me');
