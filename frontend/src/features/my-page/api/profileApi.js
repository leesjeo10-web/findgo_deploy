import { apiRequest } from '../../../shared/api/http.js';
export const updateContact = ({
  phone,
  officePhone
}) => apiRequest('/auth/me', {
  method: 'PATCH',
  body: {
    phone,
    ...(officePhone !== undefined ? {
      officePhone
    } : {})
  }
});
export const changePassword = ({
  currentPassword,
  newPassword
}) => apiRequest('/auth/me/password', {
  method: 'PATCH',
  body: {
    currentPassword,
    newPassword
  }
});
