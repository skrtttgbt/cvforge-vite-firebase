import { useId } from 'react'


export default function FormField({
  label,
  type = "text",
  as = "input",
  children,
  rightIcon,
  error,
  id,
  'aria-describedby': describedBy,
  ...props
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const errorId = `${fieldId}-error`;
  const fieldProps = {
    ...props,
    id: fieldId,
    'aria-invalid': error ? true : props['aria-invalid'],
    'aria-describedby': [describedBy, error ? errorId : null].filter(Boolean).join(' ') || undefined,
  };
  const common =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-forge focus:ring-4 focus:ring-blue-100";

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      {as === "textarea" ? (
        <textarea className={common} rows={4} {...fieldProps} />
      ) : as === "select" ? (
        <select className={common} {...fieldProps}>
          {children}
        </select>
      ) : (
        <div className="relative">
          <input
            type={type}
            className={`${common} ${rightIcon ? "pr-10" : ""}`}
            {...fieldProps}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-3 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
      )}
      {error && <span id={errorId} role="alert" className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
