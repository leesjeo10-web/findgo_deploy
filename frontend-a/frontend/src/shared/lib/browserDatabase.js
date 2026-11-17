// 로컬 프론트엔드 저장소. 실제 서비스의 서버 인증·권한 검사를 대체하지 않는다.
let databasePromise
const DATABASE_NAME = 'chatgo-items-v1'

export function openDatabase() {
  if (!globalThis.indexedDB)
    return Promise.reject(
      new Error(
        '이 브라우저에서는 저장 기능을 사용할 수 없어요. 다른 브라우저에서 다시 열어 주세요.',
      ),
    )
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 2)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('items')) {
          request.result.createObjectStore('items', { keyPath: 'id' })
        }
        for (const name of ['members', 'sessions']) {
          if (!request.result.objectStoreNames.contains(name))
            request.result.createObjectStore(name, { keyPath: 'id' })
        }
      }
      request.onsuccess = () => {
        const database = request.result
        database.onversionchange = () => {
          database.close()
          databasePromise = undefined
        }
        resolve(database)
      }
      request.onerror = () =>
        reject(
          new Error(
            '저장 공간을 열지 못했어요. 브라우저 설정을 확인한 뒤 다시 시도해 주세요.',
          ),
        )
      request.onblocked = () =>
        reject(new Error('다른 탭을 닫은 뒤 다시 시도해 주세요.'))
    }).catch((error) => {
      databasePromise = undefined
      throw error
    })
  }
  return databasePromise
}

export async function withItemsStore(mode, operation) {
  return withStores(['items'], mode, (stores, done, fail) =>
    operation(stores.items, done, fail),
  )
}

export async function withStores(names, mode, operation) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(names, mode)
    let result
    let failure
    transaction.oncomplete = () => resolve(result)
    transaction.onabort = () =>
      reject(
        failure ||
          new Error(
            '저장하지 못했어요. 저장 공간을 확인하고 다시 시도해 주세요.',
          ),
      )
    transaction.onerror = () => {
      failure ||= transaction.error
    }
    try {
      operation(
        Object.fromEntries(
          names.map((name) => [name, transaction.objectStore(name)]),
        ),
        (value) => {
          result = value
        },
        (error) => {
          failure ||= error
          try {
            transaction.abort()
          } catch {
            /* 이미 취소한 트랜잭션 */
          }
        },
      )
    } catch (error) {
      failure = error
      transaction.abort()
    }
  })
}
