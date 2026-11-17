import { IMAGE_ERROR, MAX_IMAGE_BYTES } from './itemModel.js'

export async function validateImageFile(file) {
  if (
    !file ||
    !['image/jpeg', 'image/png'].includes(file.type) ||
    file.size > MAX_IMAGE_BYTES ||
    file.size === 0
  ) {
    throw new Error(IMAGE_ERROR)
  }
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every(
    (byte, index) => bytes[index] === byte,
  )
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (
    (file.type === 'image/png' && !png) ||
    (file.type === 'image/jpeg' && !jpeg)
  ) {
    throw new Error(
      '사진 파일을 확인할 수 없어요. 다른 JPG/PNG 사진을 선택해주세요.',
    )
  }
  try {
    if (globalThis.createImageBitmap) {
      const bitmap = await createImageBitmap(file)
      bitmap.close()
    } else {
      await new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const image = new Image()
        image.onload = () => {
          URL.revokeObjectURL(url)
          resolve()
        }
        image.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error())
        }
        image.src = url
      })
    }
  } catch {
    throw new Error('사진을 처리하지 못했어요. 다른 사진을 선택해주세요.')
  }
}
