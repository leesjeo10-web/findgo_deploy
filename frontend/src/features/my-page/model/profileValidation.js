export function validateContact({
  phone,
  officePhone
}, role) {
  const errors = {};
  if (!/^01[016789]\d{7,8}$/.test((phone || '').replace(/\D/g, ''))) errors.phone = '휴대전화 번호를 010-0000-0000 형식으로 입력해주세요. 삭제는 할 수 없어요.';
  if (role === 'ADMIN' && !/^(02|0(?:3[1-3]|4[1-4]|5[1-5]|6[1-4]|70))\d{7,8}$/.test((officePhone || '').replace(/\D/g, ''))) errors.officePhone = '교무실 번호를 02-123-4567 형식으로 입력해주세요.';
  return errors;
}
export function validatePassword({
  currentPassword,
  newPassword,
  confirmPassword
}) {
  const errors = {};
  if (!currentPassword) errors.currentPassword = '현재 비밀번호를 입력해주세요.';
  if (!newPassword || newPassword.length < 8 || newPassword.length > 64) errors.newPassword = '새 비밀번호는 8~64자로 입력해주세요.';
  if (newPassword !== confirmPassword) errors.confirmPassword = '새 비밀번호가 일치하지 않아요.';
  return errors;
}
