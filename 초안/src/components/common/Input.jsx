import { useId } from 'react';
export default function Input({ label, error, className = '', id, ...props }) {
  const generated = useId();
  const fieldId = id || generated;
  return <div className={`field ${className}`}>
    <label htmlFor={fieldId}>{label}</label>
    <input id={fieldId} className="text-input" aria-invalid={!!error} aria-describedby={error ? `${fieldId}-error` : undefined} {...props} />
    {error && <p className="field-error" id={`${fieldId}-error`}>{error}</p>}
  </div>;
}
