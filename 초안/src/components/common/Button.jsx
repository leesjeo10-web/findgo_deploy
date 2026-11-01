import { Link } from 'react-router-dom';
export default function Button({ to, variant = 'primary', loading = false, className = '', children, disabled, ...props }) {
  const classes = `button button-${variant} ${className}`;
  if (to) return <Link to={to} className={classes} {...props}>{children}</Link>;
  return <button type="button" className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {loading && <span className="spinner" aria-hidden="true" />}{children}
  </button>;
}
