import 'fake-indexeddb/auto'
import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { signInAdmin } from './helpers/auth.js'
import { withItemsStore } from '../src/shared/lib/browserDatabase.js'
import {
  createItem,
  deleteItem,
  getItem,
  getItemCounts,
  listItems,
  updateItem,
} from '../src/features/items/api/itemRepository.js'
import { emptyItem } from '../src/features/items/model/itemModel.js'

// Node 프로세스의 메모리 DB만 사용한다. 사용자의 브라우저 데이터에는 접근하지 않는다.
beforeEach(async () => {
  await signInAdmin()
  return withItemsStore('readwrite', (store, done) => {
    store.clear()
    done()
  })
})
const valid = () => ({
  ...emptyItem(),
  name: '검정 우산',
  description: '파란 스티커',
  location: '도서관',
  storageLocation: '학생부실',
})

test('등록 후 다시 조회해도 데이터와 사진 Blob이 남는다', async () => {
  const image = new Blob(['photo bytes'], { type: 'image/png' })
  const item = await createItem({ ...valid(), imageBlob: image }, 'saved-item')
  const loaded = await getItem(item.id)
  assert.equal(loaded.name, '검정 우산')
  assert.equal(loaded.status, 'OPEN')
  assert.equal(await loaded.imageBlob.text(), 'photo bytes')
})
test('동일 제출을 동시에 재시도해도 한 건만 등록한다', async () => {
  await Promise.all([
    createItem(valid(), 'same-request'),
    createItem(valid(), 'same-request'),
  ])
  assert.equal((await listItems()).totalElements, 1)
})
test('잘못된 입력은 저장하지 않는다', async () => {
  assert.throws(
    () => createItem({ ...valid(), storageLocation: '' }),
    /입력한 내용/,
  )
  assert.equal((await listItems()).totalElements, 0)
})
test('수정은 id·등록일을 보존하고 상태·사진·구분을 함께 갱신한다', async () => {
  const original = await createItem({
    ...valid(),
    imageBlob: new Blob(['before'], { type: 'image/png' }),
  })
  const changed = await updateItem(original.id, {
    ...original,
    type: 'LOST',
    status: 'RESOLVED',
    imageBlob: null,
    name: '수정한 우산',
  })
  assert.equal(changed.id, original.id)
  assert.equal(changed.createdAt, original.createdAt)
  assert.equal(changed.storageLocation, null)
  assert.equal(changed.imageBlob, null)
  assert.equal(changed.status, 'RESOLVED')
  assert.equal((await getItem(original.id)).name, '수정한 우산')
})
test('삭제하면 사진을 포함한 항목과 집계에서도 제거된다', async () => {
  const item = await createItem({
    ...valid(),
    imageBlob: new Blob(['image'], { type: 'image/png' }),
  })
  await deleteItem(item.id)
  await assert.rejects(getItem(item.id), { name: 'ItemNotFoundError' })
  assert.deepEqual(await getItemCounts(), { FOUND: 0, LOST: 0 })
  await deleteItem(item.id)
})
test('전체 개수는 현재 페이지·상태 필터와 별도로 집계한다', async () => {
  for (let i = 0; i < 23; i++)
    await createItem(
      { ...valid(), type: i < 21 ? 'FOUND' : 'LOST' },
      'item-' + i,
    )
  assert.equal((await listItems()).content.length, 20)
  assert.equal((await listItems({ type: 'LOST' })).totalElements, 2)
  assert.deepEqual(await getItemCounts(), { FOUND: 21, LOST: 2 })
})
test('없는 항목의 수정은 오류이며 새 항목을 만들지 않는다', async () => {
  await assert.rejects(updateItem('missing', valid()), {
    name: 'ItemNotFoundError',
  })
  assert.equal((await listItems()).totalElements, 0)
})
test('트랜잭션 실패 시 저장 중이던 변경이 취소된다', async () => {
  await assert.rejects(
    withItemsStore('readwrite', (store, done, fail) => {
      store.put({
        ...valid(),
        id: 'aborted',
        createdAt: new Date().toISOString(),
      })
      fail(new Error('test storage failure'))
    }),
    /test storage failure/,
  )
  await assert.rejects(getItem('aborted'), { name: 'ItemNotFoundError' })
})
