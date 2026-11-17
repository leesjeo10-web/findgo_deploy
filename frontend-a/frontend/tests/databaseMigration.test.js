import 'fake-indexeddb/auto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  openDatabase,
  withItemsStore,
} from '../src/shared/lib/browserDatabase.js'

test('기존 버전의 물품·사진을 유지하면서 계정·세션 저장소를 추가한다', async () => {
  await new Promise((resolve, reject) => {
    const request = indexedDB.open('chatgo-items-v1', 1)
    request.onupgradeneeded = () =>
      request.result.createObjectStore('items', { keyPath: 'id' })
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result,
        tx = db.transaction('items', 'readwrite')
      tx.objectStore('items').put({
        id: 'legacy-item',
        name: '기존 물품',
        imageBlob: new Blob(['legacy-photo'], { type: 'image/png' }),
      })
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
    }
  })
  const database = await openDatabase()
  assert.equal(database.version, 2)
  assert.ok(database.objectStoreNames.contains('members'))
  assert.ok(database.objectStoreNames.contains('sessions'))
  const legacy = await withItemsStore('readonly', (store, done) => {
    const request = store.get('legacy-item')
    request.onsuccess = () => done(request.result)
  })
  assert.equal(legacy.name, '기존 물품')
  assert.equal(await legacy.imageBlob.text(), 'legacy-photo')
})
