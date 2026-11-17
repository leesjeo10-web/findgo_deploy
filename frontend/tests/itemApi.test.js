import test from 'node:test';
import assert from 'node:assert/strict';
import { listItems, createItem, updateItem, deleteItem, getItemCounts, updateItemStatus } from '../src/features/items/api/itemRepository.js';
import { emptyItem } from '../src/features/items/model/itemModel.js';
import { uploadImage } from '../src/features/items/api/imageApi.js';
test('서버 페이지·내 물품·집계와 쓰기 payload, 업로드 계약', async () => {
  const previous = globalThis.fetch;
  const previousBitmap = globalThis.createImageBitmap;
  // Node에는 이미지 디코더가 없어서 경계만 대체한다. 실제 파일 디코딩은 브라우저 확인 대상이다.
  globalThis.createImageBitmap = async () => ({
    close() {}
  });
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({
      url,
      ...init
    });
    if (init.method === 'DELETE') return new Response(null, {
      status: 204
    });
    return new Response(JSON.stringify(url.endsWith('/images') ? {
      imageUrl: '/api/images/new.jpg'
    } : url.includes('type=FOUND') ? {
      totalElements: 8
    } : url.includes('type=LOST') ? {
      totalElements: 3
    } : {
      content: [],
      page: 0,
      last: true,
      totalElements: 0,
      id: 12
    }));
  };
  try {
    await listItems({
      mine: true,
      keyword: '우산',
      itemCategory: '기타',
      page: 2,
      sort: 'oldest'
    });
    const url = new URL(calls.at(-1).url);
    assert.equal(url.pathname, '/api/me/items');
    assert.equal(url.searchParams.get('page'), '2');
    assert.equal(url.searchParams.get('itemCategory'), '기타');
    const values = {
      ...emptyItem(),
      name: ' 우산 ',
      description: '검정',
      location: '도서관',
      storageLocation: '행정실',
      imageUrl: '/api/images/new.jpg',
      itemCategory: '기타',
      userId: 999
    };
    await createItem(values);
    const sent = JSON.parse(calls.at(-1).body);
    assert.equal(sent.name, '우산');
    assert.equal(sent.imageUrl, '/api/images/new.jpg');
    assert.equal(sent.userId, undefined);
    assert.equal(sent.imageBlob, undefined);
    await updateItem(12, {
      ...values,
      status: 'RESOLVED'
    });
    assert.equal(calls.at(-1).method, 'PUT');
    await updateItemStatus(12, 'RESOLVED');
    assert.equal(calls.at(-1).method, 'PATCH');
    await deleteItem(12);
    assert.equal(calls.at(-1).method, 'DELETE');
    assert.deepEqual(await getItemCounts(), {
      FOUND: 8,
      LOST: 3
    });
    const file = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0])], 'test.png', {
      type: 'image/png'
    });
    assert.equal(await uploadImage(file), '/api/images/new.jpg');
    assert.equal(calls.at(-1).body.get('file').name, 'test.png');
  } finally {
    globalThis.fetch = previous;
    globalThis.createImageBitmap = previousBitmap;
  }
});
