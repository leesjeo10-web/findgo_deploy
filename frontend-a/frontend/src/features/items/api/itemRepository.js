import { normalizeItem, selectItems, validateItem } from '../model/itemModel.js'
import { AccessError, withUser } from '../../auth/api/authRepository.js'
import { canDeleteItem, canEditItem } from '../../auth/model/authModel.js'

export class ItemNotFoundError extends Error {
  constructor() {
    super(
      '해당 물품을 찾을 수 없어요. 삭제되었거나 주소가 잘못되었을 수 있어요.',
    )
    this.name = 'ItemNotFoundError'
  }
}
export function listItems({ mine = false, ...options } = {}) {
  return withUser(['items'], 'readonly', ({ items }, done, fail, user) => {
    const request = items.getAll()
    request.onsuccess = () =>
      done(
        selectItems(
          mine
            ? request.result.filter((item) => item.userId === user.id)
            : request.result,
          options,
        ),
      )
  })
}
export function getItem(id) {
  return withUser(['items'], 'readonly', ({ items, members }, done, fail) => {
    const request = items.get(id)
    request.onsuccess = () => {
      const item = request.result
      if (!item) return fail(new ItemNotFoundError())
      if (!item.userId) return done(item)
      const owner = members.get(item.userId)
      owner.onsuccess = () =>
        done({
          ...item,
          userName: owner.result?.name || '',
          userPhone: owner.result?.phone || '',
        })
    }
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
  const next = checked(values)
  return withUser(['items'], 'readwrite', ({ items }, done, fail, user) => {
    const request = items.get(id)
    request.onsuccess = () => {
      if (request.result) {
        if (!canEditItem(user, request.result))
          return fail(
            new AccessError('다른 계정의 물품을 덮어쓸 수 없어요.', 403),
          )
        return done(request.result)
      }
      const item = {
        ...next,
        status: 'OPEN',
        id,
        userId: user.id,
        createdAt: new Date().toISOString(),
      }
      items.add(item)
      done(item)
    }
  })
}
export function updateItem(id, values) {
  const next = checked(values)
  return withUser(['items'], 'readwrite', ({ items }, done, fail, user) => {
    const request = items.get(id)
    request.onsuccess = () => {
      if (!request.result) return fail(new ItemNotFoundError())
      if (!canEditItem(user, request.result))
        return fail(
          new AccessError('본인이 등록한 물품만 수정할 수 있어요.', 403),
        )
      const item = { ...request.result, ...next }
      items.put(item)
      done(item)
    }
  })
}
export function deleteItem(id) {
  return withUser(['items'], 'readwrite', ({ items }, done, fail, user) => {
    const request = items.get(id)
    request.onsuccess = () => {
      if (!request.result) return done(id)
      if (!canDeleteItem(user, request.result))
        return fail(
          new AccessError('본인이 등록한 물품만 삭제할 수 있어요.', 403),
        )
      items.delete(id)
      done(id)
    }
  })
}
export function getItemCounts({ mine = false } = {}) {
  return withUser(['items'], 'readonly', ({ items }, done, fail, user) => {
    const request = items.getAll()
    request.onsuccess = () =>
      done(
        request.result
          .filter((item) => !mine || item.userId === user.id)
          .reduce(
            (counts, item) => {
              counts[item.type] += 1
              return counts
            },
            { FOUND: 0, LOST: 0 },
          ),
      )
  })
}
