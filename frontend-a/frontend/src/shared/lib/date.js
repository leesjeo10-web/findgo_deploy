export function todayLocal(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}
export function formatDate(value, short = false) {
  if (!value) return ''
  const date = value.slice(0, 10)
  return (short ? date.slice(5) : date).replaceAll('-', '.')
}
