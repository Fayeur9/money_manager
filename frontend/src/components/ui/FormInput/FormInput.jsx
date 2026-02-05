import clsx from 'clsx'

/**
 * Composant FormInput réutilisable
 * @param {Object} props
 * @param {string} props.label - Label du champ
 * @param {string} props.type - Type d'input (text, password, email, etc.)
 * @param {string} props.name - Nom du champ
 * @param {string} props.placeholder - Placeholder
 * @param {string} props.value - Valeur du champ
 * @param {Function} props.onChange - Handler de changement
 * @param {Function} props.onBlur - Handler de blur
 * @param {string} props.error - Message d'erreur
 * @param {boolean} props.required - Champ obligatoire
 * @param {string} props.className - Classes additionnelles
 */
function FormInput({
  label,
  type = 'text',
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  className,
  ...props
}) {
  // Workaround pour un bug de crash sur Brave avec type="password"
  // On utilise type="text" avec -webkit-text-security pour masquer visuellement
  const isPassword = type === 'password'
  const inputType = isPassword ? 'text' : type

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium text-text-secondary"
        >
          {label}
          {required && <span className="text-red-500 font-semibold ml-1">*</span>}
        </label>
      )}
      <input
        type={inputType}
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={clsx(
          'w-full px-4 py-3 bg-bg-primary border rounded-lg text-text-primary text-base',
          'transition-all duration-300 placeholder:text-text-secondary placeholder:opacity-60',
          'focus:outline-none',
          error
            ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
            : 'border-border focus:border-neon-cyan focus:shadow-[0_0_0_3px_rgba(0,240,255,0.1)]'
        )}
        style={isPassword ? { WebkitTextSecurity: 'disc' } : undefined}
        {...props}
      />
      {error && (
        <span className="text-red-400 text-xs mt-0.5">{error}</span>
      )}
    </div>
  )
}

export default FormInput
