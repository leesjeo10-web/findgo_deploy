import { apiRequest } from '../../../shared/api/http.js';
import { validateImageFile } from '../model/imageFile.js';
export async function uploadImage(file) {
  await validateImageFile(file);
  const body = new FormData();
  body.append('file', file, file.name || 'photo.jpg');
  const result = await apiRequest('/images', {
    method: 'POST',
    body
  });
  if (!result?.imageUrl) throw new Error('사진 업로드 응답을 확인할 수 없어요. 다시 시도해주세요.');
  return result.imageUrl;
}
