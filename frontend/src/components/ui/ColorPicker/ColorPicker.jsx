import clsx from 'clsx'

/**
 * Sélecteur de couleur
 * @param {Object} props
 * @param {string} props.value - Couleur sélectionnée
 * @param {Function} props.onChange - Callback de changement
 * @param {string[]} props.colors - Liste des couleurs disponibles
 * @param {string} props.label - Label optionnel
 * @param {string} props.className - Classes additionnelles
 */
function ColorPicker({
  value,
  onChange,
  colors = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#ef4444', '#f97316',
    '#eab308', '#84cc16', '#22c55e', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6'
  ],
  label,
  className
}) {
  return (
    <div className={clsx('text-center', className)}>
      {label && (
        <p className="text-sm text-text-secondary mb-2">{label}</p>
      )}
      <div className="flex flex-wrap gap-1.5 justify-center max-w-[180px] mx-auto">
        {colors.map((color, index) => (
          <button
            key={`${color}-${index}`}
            type="button"
            className={clsx(
              'w-7 h-7 rounded-full border-2 cursor-pointer transition-all duration-200 p-0',
              'hover:scale-115 hover:shadow-[0_0_10px_currentColor]',
              value === color
                ? 'border-white scale-110 shadow-[0_0_15px_currentColor]'
                : 'border-transparent'
            )}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </div>
  )
}

export default ColorPicker
