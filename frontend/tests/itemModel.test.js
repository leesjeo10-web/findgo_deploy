import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyItem, normalizeItem, validateItem, MAX_IMAGE_BYTES } from '../src/features/items/model/itemModel.js';
import { todayLocal } from '../src/shared/lib/date.js';
import { validateImageFile } from '../src/features/items/model/imageFile.js';
const valid = () => ({
  ...emptyItem(),
  name: '검정 우산',
  description: '파란 스티커',
  location: '도서관',
  storageLocation: '학생부실'
});
test('습득물 보관 장소는 필수이고 분실물에는 필요 없다', () => {
  assert.ok(validateItem({
    ...valid(),
    storageLocation: ''
  }).storageLocation);
  assert.deepEqual(validateItem({
    ...valid(),
    type: 'LOST',
    storageLocation: ''
  }), {});
  assert.equal(normalizeItem({
    ...valid(),
    type: 'LOST'
  }).storageLocation, null);
});
test('빈 칸과 공백만 있는 필수 항목을 거부한다', () => {
  assert.ok(validateItem({
    ...valid(),
    name: '   '
  }).name);
  assert.equal(validateItem({
    ...valid(),
    location: ''
  }).location, '장소를 입력해주세요.');
  assert.equal(normalizeItem({
    ...valid(),
    name: ' 검정 우산 '
  }).name, '검정 우산');
});
test('이름·장소 100자, 설명 2000자의 경계를 검사한다', () => {
  assert.deepEqual(validateItem({
    ...valid(),
    name: '가'.repeat(100),
    description: '가'.repeat(2000)
  }), {});
  assert.ok(validateItem({
    ...valid(),
    name: '가'.repeat(101)
  }).name);
  assert.ok(validateItem({
    ...valid(),
    description: '가'.repeat(2001)
  }).description);
  assert.ok(validateItem({
    ...valid(),
    location: '가'.repeat(101)
  }).location);
});
test('미래 날짜와 존재하지 않는 날짜를 거부한다', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  assert.ok(validateItem({
    ...valid(),
    lostFoundAt: todayLocal(tomorrow)
  }).lostFoundAt);
  assert.ok(validateItem({
    ...valid(),
    lostFoundAt: '2025-02-31'
  }).lostFoundAt);
  assert.deepEqual(validateItem(valid()), {});
});
test('다른 형식과 5MB 초과 사진은 변환하지 않고 거부한다', async () => {
  await assert.rejects(validateImageFile(new Blob(['test'], {
    type: 'image/webp'
  })), /JPG\/PNG/);
  await assert.rejects(validateImageFile(new Blob([new Uint8Array(MAX_IMAGE_BYTES + 1)], {
    type: 'image/png'
  })), /5MB/);
  await assert.rejects(validateImageFile(new Blob([], {
    type: 'image/png'
  })), /JPG\/PNG/);
});
test('확장자·MIME만 이미지인 파일도 실제 헤더로 거부한다', async () => {
  await assert.rejects(validateImageFile(new Blob(['not an image'], {
    type: 'image/png'
  })), /사진 파일을 확인/);
});
