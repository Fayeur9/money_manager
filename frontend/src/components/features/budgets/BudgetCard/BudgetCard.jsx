import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import WarningIcon from '@mui/icons-material/Warning'
import ProgressBar from '../../../ui/ProgressBar'
import clsx from 'clsx'

/**
 * Card d'affichage d'un budget
 * @param {Object} props
 * @param {Object} props.budget - Données du budget
 * @param {Function} props.onEdit - Callback édition
 * @param {Function} props.onDelete - Callback suppression
 * @param {Function} props.formatCurrency - Fonction de formatage monétaire
 * @param {boolean} props.isChild - Si c'est un sous-budget (affichage réduit)
 */
function BudgetCard({ budget, onEdit, onDelete, formatCurrency, isChild = false }) {
  const remainingPercent = Math.max(0, 100 - budget.percentage)
  const isExceeded = budget.is_exceeded
  const isWarning = budget.percentage >= 80 && !isExceeded

  // Déterminer la variante de la barre de progression
  const progressVariant = isExceeded ? 'danger' : isWarning ? 'warning' : 'success'

  return (
    <div
      className={clsx(
        'bg-bg-card border rounded-2xl p-6 transition-all duration-300 group',
        'hover:border-neon-cyan hover:shadow-[0_4px_20px_rgba(0,240,255,0.1)]',
        isExceeded && 'border-red-500 bg-gradient-to-br from-bg-card to-red-500/5',
        isWarning && 'border-amber-500',
        !isExceeded && !isWarning && 'border-border'
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: budget.category_color }}
          >
            <img
              src={budget.category_icon || '/default/icons/dots.png'}
              alt=""
              className="w-6 h-6 brightness-0 invert"
            />
          </div>
          <span className="text-lg font-semibold text-text-primary">
            {budget.category_name}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(budget)}
            title="Modifier"
            className="p-2 bg-transparent border-none rounded-lg cursor-pointer text-text-secondary transition-all duration-200 hover:bg-white/10 hover:text-neon-cyan"
          >
            <EditIcon fontSize="small" />
          </button>
          <button
            onClick={() => onDelete(budget)}
            title="Supprimer"
            className="p-2 bg-transparent border-none rounded-lg cursor-pointer text-text-secondary transition-all duration-200 hover:bg-white/10 hover:text-red-500"
          >
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* Montants */}
      <div className="flex justify-between mb-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary uppercase tracking-wide">Dépensé</span>
          <span className="text-xl font-semibold text-text-primary">{formatCurrency(budget.spent)}</span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-xs text-text-secondary uppercase tracking-wide">Plafond</span>
          <span className="text-xl font-semibold text-text-primary">{formatCurrency(budget.budget_amount)}</span>
        </div>
      </div>

      {/* Barre de progression inversée */}
      <div className="mt-2">
        <ProgressBar
          value={budget.percentage}
          variant={progressVariant}
          size="md"
          inverted={!isExceeded}
        />

        <div className="mt-2 text-sm text-right">
          {isExceeded ? (
            <span className="text-red-500 flex items-center justify-end gap-1 font-medium">
              <WarningIcon fontSize="small" />
              Dépassé de {formatCurrency(Math.abs(budget.remaining))}
            </span>
          ) : (
            <span className={isWarning ? 'text-amber-500' : 'text-text-secondary'}>
              {formatCurrency(budget.remaining)} restants
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default BudgetCard
