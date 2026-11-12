// 이 버전은 브라우저 안에서만 저장한다. 인증이나 서버 저장을 흉내 내지 않는다.
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
      const request = indexedDB.open(DATABASE_NAME, 1)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('items')) {
          request.result.createObjectStore('items', { keyPath: 'id' })
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
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('items', mode)
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
        transaction.objectStore('items'),
        (value) => {
          result = value
        },
        (error) => {
          failure = error
          transaction.abort()
        },
      )
    } catch (error) {
      failure = error
      transaction.abort()
    }
  })
}
