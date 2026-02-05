import clsx from 'clsx'

/**
 * Sélecteur de type (revenu/dépense)
 * @param {Object} props
 * @param {string} props.value - Type sélectionné (income/expense)
 * @param {Function} props.onChange - Callback de changement
 * @param {string} props.className - Classes additionnelles
 */
function TypeSelector({ value, onChange, className }) {
  return (
    <div className={clsx('flex gap-2', className)}>
      <button
        type="button"
        className={clsx(
          'flex-1 py-3 px-4 rounded-lg border-2 bg-bg-secondary text-base font-medium cursor-pointer transition-all duration-200',
          value === 'income'
            ? 'border-green-500 bg-green-500/15 text-green-500'
            : 'border-border text-text-secondary hover:border-white/20'
        )}
        onClick={() => onChange('income')}
      >
        Revenu
      </button>
      <button
        type="button"
        className={clsx(
          'flex-1 py-3 px-4 rounded-lg border-2 bg-bg-secondary text-base font-medium cursor-pointer transition-all duration-200',
          value === 'expense'
            ? 'border-red-500 bg-red-500/15 text-red-500'
            : 'border-border text-text-secondary hover:border-white/20'
        )}
        onClick={() => onChange('expense')}
      >
        Dépense
      </button>
    </div>
  )
}

export default TypeSelector
