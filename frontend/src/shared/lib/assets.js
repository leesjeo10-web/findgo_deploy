import logo from '../assets/brand/chatgo-logo-service.png'
const illustrations = import.meta.glob('../assets/illustrations/*.png', {
  eager: true,
  import: 'default',
})
export { logo }
export function illustration(name) {
  const filename = name.toLowerCase().replaceAll(' ', '_') + '_3d.png'
  return (
    illustrations['../assets/illustrations/' + filename] ||
    illustrations['../assets/illustrations/package_3d.png']
  )
}
