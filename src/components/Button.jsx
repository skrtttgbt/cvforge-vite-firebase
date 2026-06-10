export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = variant === 'outline' ? 'border border-forge bg-white text-forge hover:bg-blue-50' : variant === 'danger' ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-forge text-white hover:bg-blue-700'
  return <button className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${styles} ${className}`} {...props}>{children}</button>
}
