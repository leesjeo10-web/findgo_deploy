import { todayLocal } from '../../../shared/lib/date.js';
export const ITEM_TYPES = [{
  value: '',
  label: '전체'
}, {
  value: 'FOUND',
  label: '습득물'
}, {
  value: 'LOST',
  label: '분실물'
}];
export const ITEM_STATUSES = [{
  value: '',
  label: '전체 상태'
}, {
  value: 'OPEN',
  label: '찾는 중'
}, {
  value: 'RESOLVED',
  label: '해결 완료'
}];
export const ITEM_CATEGORIES = ['전자기기', '지갑/카드', '의류', '가방', '필기구', '기타'];
export const PAGE_SIZE = 20;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_ERROR = 'JPG/PNG, 5MB 이하 사진 1장만 올릴 수 있어요.';
export function emptyItem(type = 'FOUND') {
  return {
    type: type === 'LOST' ? 'LOST' : 'FOUND',
    name: '',
    description: '',
    location: '',
    storageLocation: '',
    lostFoundAt: todayLocal(),
    status: 'OPEN',
    imageBlob: null,
    imageUrl: null,
    itemCategory: ''
  };
}
export function normalizeItem(values) {
  return {
    type: values.type,
    name: values.name.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    storageLocation: values.type === 'FOUND' ? values.storageLocation.trim() : null,
    lostFoundAt: values.lostFoundAt,
    status: values.status || 'OPEN',
    imageBlob: values.imageBlob || null,
    imageUrl: values.imageUrl || null,
    itemCategory: values.itemCategory || null
  };
}
export function validateItem(values) {
  const errors = {};
  if (values.itemCategory && !ITEM_CATEGORIES.includes(values.itemCategory)) errors.itemCategory = '물품 종류를 확인해주세요.';
  for (const [key, label, limit] of [['name', '이름', 100], ['description', '설명', 2000], ['location', '장소', 100]]) {
    const value = values[key]?.trim() || '';
    if (!value) errors[key] = label + (key === 'location' ? '를' : '을') + ' 입력해주세요.';else if (value.length > limit) errors[key] = label + (key === 'location' ? '는' : '은') + ' ' + limit + '자 이하로 입력해주세요.';
  }
  if (!['FOUND', 'LOST'].includes(values.type)) errors.type = '구분을 선택해주세요.';
  if (!['OPEN', 'RESOLVED'].includes(values.status)) errors.status = '상태를 선택해주세요.';
  const date = new Date(values.lostFoundAt + 'T00:00:00');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.lostFoundAt || '') || Number.isNaN(date.getTime()) || todayLocal(date) !== values.lostFoundAt) errors.lostFoundAt = '올바른 날짜를 입력해주세요.';else if (values.lostFoundAt > todayLocal()) errors.lostFoundAt = '오늘 이후 날짜는 고를 수 없어요.';
  if (values.type === 'FOUND') {
    if (!values.storageLocation?.trim()) errors.storageLocation = '보관 장소를 입력해주세요.';else if (values.storageLocation.trim().length > 100) errors.storageLocation = '보관 장소는 100자 이하로 입력해주세요.';
  }
  if (values.imageBlob && (!['image/jpeg', 'image/png'].includes(values.imageBlob.type) || values.imageBlob.size > MAX_IMAGE_BYTES)) errors.imageBlob = IMAGE_ERROR;
  return errors;
}
