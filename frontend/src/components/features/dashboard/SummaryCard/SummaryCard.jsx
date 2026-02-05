import clsx from 'clsx'
import PropTypes from 'prop-types'

/**
 * Card de résumé flexible pour afficher des statistiques
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icône MUI
 * @param {string} props.label - Label de la card
 * @param {string} props.value - Valeur affichée
 * @param {string} props.variant - Variante de couleur prédéfinie (balance, income, expense, info)
 * @param {string} props.color - Couleur personnalisée (ex: 'neon-cyan', 'yellow-500') - prioritaire sur variant
 * @param {string} props.size - Taille: 'sm' (dashboard) ou 'md' (pages)
 * @param {boolean} props.loading - État de chargement
 * @param {boolean} props.hover - Activer l'effet hover
 * @param {string} props.className - Classes CSS additionnelles
 */
function SummaryCard({
  icon,
  label,
  value,
  variant = 'info',
  color,
  size = 'sm',
  loading = false,
  hover = true,
  className
}) {
  // Variantes prédéfinies
  const variantStyles = {
    balance: { bg: 'bg-indigo-500/15', text: 'text-indigo-500' },
    income: { bg: 'bg-green-500/15', text: 'text-green-500' },
    expense: { bg: 'bg-red-500/15', text: 'text-red-500' },
    info: { bg: 'bg-sky-500/15', text: 'text-sky-500' }
  }

  // Si une couleur personnalisée est fournie, l'utiliser
  const styles = color
    ? { bg: `bg-${color}/20`, text: `text-${color}` }
    : variantStyles[variant] || variantStyles.info

  // Configuration des tailles
  const sizeConfig = {
    sm: {
      container: 'p-3',
      icon: 'w-9 h-9 [&_svg]:text-xl',
      label: 'text-[0.7rem]',
      value: 'text-base'
    },
    md: {
      container: 'p-4',
      icon: 'w-10 h-10',
      label: 'text-xs',
      value: 'text-xl'
    }
  }

  const sizeStyles = sizeConfig[size] || sizeConfig.sm

  return (
    <div className={clsx(
      'bg-bg-card border border-border rounded-xl flex items-center gap-3 transition-all duration-200',
      sizeStyles.container,
      hover && 'hover:border-neon-cyan/30 hover:translate-y-[-2px]',
      className
    )}>
      <div className={clsx(
        'rounded-lg flex items-center justify-center shrink-0',
        sizeStyles.icon,
        styles.bg,
        styles.text
      )}>
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className={clsx('text-text-secondary', sizeStyles.label)}>{label}</span>
        {loading ? (
          <div className="h-5 w-20 bg-border rounded animate-pulse" />
        ) : (
          <span className={clsx(
            'font-semibold whitespace-nowrap overflow-hidden text-ellipsis',
            sizeStyles.value,
            color ? styles.text : (
              variant === 'income' ? 'text-green-500' :
              variant === 'expense' ? 'text-red-500' :
              'text-text-primary'
            )
          )}>
            {value}
          </span>
        )}
      </div>
    </div>
  )
}

SummaryCard.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  variant: PropTypes.oneOf(['balance', 'income', 'expense', 'info']),
  color: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md']),
  loading: PropTypes.bool,
  hover: PropTypes.bool,
  className: PropTypes.string
}

export default SummaryCard
