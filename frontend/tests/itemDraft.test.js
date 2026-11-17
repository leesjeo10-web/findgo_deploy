import test from 'node:test';
import assert from 'node:assert/strict';
import { draftKey, saveDraft, readDraft, DRAFT_TTL } from '../src/features/items/model/itemDraft.js';
test('3시간 TTL·계정/글별 분리·비밀값 제외·손상 데이터 제거', () => {
  const data = new Map();
  const storage = {
    setItem: (k, v) => data.set(k, v),
    getItem: k => data.get(k) || null,
    removeItem: k => data.delete(k)
  };
  const key = draftKey(1);
  saveDraft(storage, key, {
    type: 'FOUND',
    name: '우산',
    description: '',
    location: '',
    storageLocation: '',
    lostFoundAt: '2026-11-14',
    status: 'OPEN',
    imageUrl: '/api/images/a.jpg',
    password: 'never',
    accessToken: 'never'
  }, 100);
  assert.equal(readDraft(storage, key, 101).name, '우산');
  assert.equal(readDraft(storage, draftKey(2), 101), null);
  assert.equal(readDraft(storage, draftKey(1, 99), 101), null);
  assert.ok(!storage.getItem(key).includes('never'));
  assert.equal(readDraft(storage, key, 100 + DRAFT_TTL), null);
  assert.equal(storage.getItem(key), null);
  storage.setItem(key, 'broken');
  assert.equal(readDraft(storage, key), null);
});
