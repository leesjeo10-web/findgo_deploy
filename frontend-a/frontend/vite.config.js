import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 업로드 소스에서는 PNG를 한 파일로 보관하고, 배포할 때는 개별 이미지로 복원합니다.
function unpackImages() {
  return {
    name: 'unpack-images',
    apply: 'build',
    transform(code, id) {
      if (!id.replaceAll('\\', '/').endsWith('/shared/lib/assets.js')) return null
      const unpacked = code.replace(
        /"([^"\n]+\.png)": "data:image\/png;base64,([A-Za-z0-9+/=]+)"/g,
        (_, name, encoded) => {
          const reference = this.emitFile({
            type: 'asset',
            name,
            source: Buffer.from(encoded, 'base64'),
          })
          return `${JSON.stringify(name)}: import.meta.ROLLUP_FILE_URL_${reference}`
        },
      )
      return { code: unpacked, map: null }
    },
  }
}

export default defineConfig({
  plugins: [react(), unpackImages()],
})
