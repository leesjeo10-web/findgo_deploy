import { withItemsStore } from '../../../shared/lib/browserDatabase.js'
import { normalizeItem, selectItems, validateItem } from '../model/itemModel.js'

export class ItemNotFoundError extends Error {
  constructor() {
    super(
      '해당 물품을 찾을 수 없어요. 삭제되었거나 주소가 잘못되었을 수 있어요.',
    )
    this.name = 'ItemNotFoundError'
  }
}
export function listItems(options) {
  return withItemsStore('readonly', (store, done) => {
    const request = store.getAll()
    request.onsuccess = () => done(selectItems(request.result, options))
  })
}
export function getItem(id) {
  return withItemsStore('readonly', (store, done, fail) => {
    const request = store.get(id)
    request.onsuccess = () =>
      request.result ? done(request.result) : fail(new ItemNotFoundError())
  })
}
function checked(values) {
  const errors = validateItem(values)
  if (Object.keys(errors).length)
    throw Object.assign(new Error('입력한 내용을 확인해주세요.'), {
      fields: errors,
    })
  return normalizeItem(values)
}
export function createItem(values, id = crypto.randomUUID()) {
  const item = {
    ...checked(values),
    status: 'OPEN',
    id,
    createdAt: new Date().toISOString(),
  }
  return withItemsStore('readwrite', (store, done) => {
    // 같은 제출을 재시도하면 같은 id를 이용해 중복 등록을 피한다.
    const request = store.get(id)
    request.onsuccess = () => {
      if (request.result) return done(request.result)
      store.add(item)
      done(item)
    }
  })
}
export function updateItem(id, values) {
  const next = checked(values)
  return withItemsStore('readwrite', (store, done, fail) => {
    const request = store.get(id)
    request.onsuccess = () => {
      if (!request.result) return fail(new ItemNotFoundError())
      const item = { ...request.result, ...next }
      store.put(item)
      done(item)
    }
  })
}
export function deleteItem(id) {
  return withItemsStore('readwrite', (store, done) => {
    store.delete(id)
    done(id)
  })
}
export function getItemCounts() {
  return withItemsStore('readonly', (store, done) => {
    const request = store.getAll()
    request.onsuccess = () =>
      done(
        request.result.reduce(
          (counts, item) => {
            counts[item.type] += 1
            return counts
          },
          { FOUND: 0, LOST: 0 },
        ),
      )
  })
}
