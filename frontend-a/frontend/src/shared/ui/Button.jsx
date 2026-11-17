import { Link } from 'react-router-dom'
export default function Button({
  children,
  to,
  variant = 'primary',
  size = '',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const classes = [
    'button',
    'button--' + variant,
    size && 'button--' + size,
    className,
  ]
    .filter(Boolean)
    .join(' ')
  if (to)
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}
