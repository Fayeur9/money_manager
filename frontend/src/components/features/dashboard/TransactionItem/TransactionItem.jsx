import clsx from 'clsx'

/**
 * Item de transaction pour les listes du dashboard
 * @param {Object} props
 * @param {Object} props.transaction - Données de la transaction
 * @param {string} props.type - Type (income, expense)
 * @param {Function} props.formatCurrency - Fonction de formatage monétaire
 * @param {Function} props.formatDate - Fonction de formatage date
 */
function TransactionItem({ transaction, type, formatCurrency, formatDate }) {
  const isIncome = type === 'income'
  const defaultIcon = isIncome ? '/default/icons/plus.png' : '/default/icons/money.png'
  const defaultColor = isIncome ? '#22c55e' : '#6b7280'

  return (
    <li className="flex items-center gap-2.5 px-4 py-2 transition-colors duration-200 border-b border-white/[0.03] mx-2 my-0.5 last:border-b-0 hover:bg-neon-cyan/[0.03]">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: transaction.category_color || defaultColor }}
      >
        <img
          src={transaction.category_icon || defaultIcon}
          alt=""
          className="w-4 h-4 object-contain"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-sm text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
          {transaction.description || transaction.category_name || (isIncome ? 'Revenu' : 'Dépense')}
        </span>
        <span className="text-[0.7rem] text-text-secondary">
          {formatDate(transaction.date)}
        </span>
      </div>
      <span className={clsx(
        'text-sm font-semibold whitespace-nowrap',
        isIncome ? 'text-green-500' : 'text-red-500'
      )}>
        {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
      </span>
    </li>
  )
}

export default TransactionItem
