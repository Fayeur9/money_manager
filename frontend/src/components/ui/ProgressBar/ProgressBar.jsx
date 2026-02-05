import clsx from 'clsx'

/**
 * Barre de progression réutilisable
 * @param {Object} props
 * @param {number} props.value - Valeur actuelle (0-100)
 * @param {string} props.variant - Variante de couleur (default, success, warning, danger)
 * @param {string} props.size - Taille (sm, md, lg)
 * @param {boolean} props.inverted - Afficher ce qui reste au lieu de ce qui est consommé
 * @param {string} props.className - Classes additionnelles
 */
function ProgressBar({
  value = 0,
  variant = 'default',
  size = 'md',
  inverted = false,
  className
}) {
  // Limiter la valeur entre 0 et 100
  const clampedValue = Math.min(100, Math.max(0, value))
  const displayValue = inverted ? 100 - clampedValue : clampedValue

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const variantClasses = {
    default: 'bg-gradient-to-r from-neon-cyan to-neon-blue',
    success: 'bg-gradient-to-r from-green-500 to-green-400',
    warning: 'bg-gradient-to-r from-amber-500 to-amber-400',
    danger: 'bg-gradient-to-r from-red-500 to-red-400'
  }

  const bgClasses = {
    default: 'bg-border',
    success: 'bg-red-500/30',
    warning: 'bg-red-500/30',
    danger: 'bg-red-500/30'
  }

  return (
    <div
      className={clsx(
        'rounded-full overflow-hidden',
        sizeClasses[size],
        bgClasses[variant],
        className
      )}
    >
      <div
        className={clsx(
          'h-full rounded-full transition-all duration-500',
          variantClasses[variant]
        )}
        style={{ width: `${displayValue}%` }}
      />
    </div>
  )
}

export default ProgressBar
