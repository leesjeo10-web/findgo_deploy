import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContact, validatePassword } from '../src/features/my-page/model/profileValidation.js';
import { updateContact, changePassword } from '../src/features/my-page/api/profileApi.js';
test('전화번호 필수·관리자 교무실 번호·비밀번호 길이와 확인', () => {
  assert.ok(validateContact({
    phone: ''
  }, 'STUDENT').phone);
  assert.deepEqual(validateContact({
    phone: '01012345678'
  }, 'STUDENT'), {});
  assert.ok(validateContact({
    phone: '010-1234-5678'
  }, 'ADMIN').officePhone);
  assert.deepEqual(validateContact({
    phone: '010-1234-5678',
    officePhone: '02-123-4567'
  }, 'ADMIN'), {});
  assert.ok(validateContact({
    phone: '010-1234-5678',
    officePhone: '099-123-4567'
  }, 'ADMIN').officePhone);
  assert.ok(validatePassword({
    currentPassword: '',
    newPassword: 'short',
    confirmPassword: 'other'
  }).newPassword);
  assert.ok(validatePassword({
    currentPassword: 'old',
    newPassword: 'a'.repeat(65),
    confirmPassword: 'a'.repeat(65)
  }).newPassword);
  assert.deepEqual(validatePassword({
    currentPassword: 'old',
    newPassword: '12345678',
    confirmPassword: '12345678'
  }), {});
});
test('연락처 PATCH와 비밀번호 PATCH 204 계약', async () => {
  const previous = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({
      url,
      ...init
    });
    return url.endsWith('/password') ? new Response(null, {
      status: 204
    }) : new Response('{"id":1,"phone":"010-1234-5678"}');
  };
  try {
    await updateContact({
      phone: '010-1234-5678'
    });
    assert.equal(new URL(calls[0].url).pathname, '/api/auth/me');
    assert.equal(calls[0].method, 'PATCH');
    assert.deepEqual(JSON.parse(calls[0].body), {
      phone: '010-1234-5678'
    });
    assert.equal(await changePassword({
      currentPassword: 'old',
      newPassword: '12345678'
    }), null);
    assert.equal(new URL(calls[1].url).pathname, '/api/auth/me/password');
    assert.equal(calls[1].method, 'PATCH');
  } finally {
    globalThis.fetch = previous;
  }
});
