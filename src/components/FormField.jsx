import { useId } from 'react'


export default function FormField({
  label,
  type = "text",
  as = "input",
  children,
  rightIcon,
  ...props
}) { const common =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-forge focus:ring-4 focus:ring-blue-100";

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      {as === "textarea" ? (
        <textarea className={common} rows={4} {...props} />
      ) : as === "select" ? (
        <select className={common} {...props}>
          {children}
        </select>
      ) : (
        <div className="relative">
          <input
            type={type}
            className={`${common} ${rightIcon ? "pr-10" : ""}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-3 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
      )}
    </label>
  );
}