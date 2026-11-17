export default function FormField({
  id,
  label,
  required,
  count,
  error,
  hint,
  children,
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>
        <span>
          {label}
          {required && (
            <span className="required" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </span>
        {count && (
          <span className="field-count" aria-hidden="true">
            {count}
          </span>
        )}
      </label>
      {children}
      {hint && (
        <p className="field-hint" id={id + '-hint'}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={id + '-error'} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
