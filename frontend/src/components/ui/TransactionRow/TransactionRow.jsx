import clsx from 'clsx'
import PropTypes from 'prop-types'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import CategoryBadge from '../CategoryBadge'
import AmountDisplay from '../AmountDisplay'

/**
 * Ligne de transaction réutilisable.
 *
 * @param {Object} transaction - Données de la transaction
 * @param {string} transaction.id - ID de la transaction
 * @param {string} transaction.type - Type: 'income', 'expense', 'transfer'
 * @param {string} transaction.description - Description
 * @param {number} transaction.amount - Montant
 * @param {string} transaction.date - Date ISO
 * @param {string} transaction.account_name - Nom du compte
 * @param {string} transaction.target_account_name - Nom du compte cible (transfert)
 * @param {string} transaction.category_name - Nom de la catégorie
 * @param {string} transaction.category_color - Couleur de la catégorie
 * @param {string} transaction.category_icon - Icône de la catégorie
 * @param {function} formatDate - Fonction de formatage de date
 * @param {function} onClick - Callback au clic
 * @param {string} className - Classes CSS additionnelles
 */
function TransactionRow({
	transaction,
	formatDate,
	onClick,
	className = ''
}) {
	const {
		type,
		description,
		amount,
		date,
		account_name,
		target_account_name,
		category_name,
		category_color = '#6b7280',
		category_icon = '/default/icons/dots.png'
	} = transaction || {}

	// Formatage de la date par défaut
	const defaultFormatDate = (dateStr) => {
		return new Date(dateStr).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short'
		})
	}

	const displayDate = formatDate ? formatDate(date) : defaultFormatDate(date)
	const displayDescription = type === 'transfer'
		? (description || 'Transfert')
		: (description || category_name || 'Sans description')
	const accountInfo = type === 'transfer'
		? `${account_name} → ${target_account_name}`
		: account_name

	return (
		<div
			className={clsx(
				'flex items-center gap-4 py-2.5 px-6 my-1 mx-2 rounded-lg cursor-pointer transition-colors duration-200',
				'hover:bg-neon-cyan/[0.03] border-b border-white/[0.03] last:border-b-0',
				'max-md:py-3 max-md:px-4',
				className
			)}
			onClick={onClick}
		>
			{/* Icône catégorie ou transfert */}
			{type === 'transfer' ? (
				<div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-neon-cyan to-neon-purple">
					<SwapHorizIcon className="w-5 h-5 text-white" />
				</div>
			) : (
				<CategoryBadge
					color={category_color}
					icon={category_icon}
					size="md"
					invertIcon={false}
				/>
			)}

			{/* Description et infos */}
			<div className="flex-1 min-w-0">
				<span className="block text-base text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
					{displayDescription}
				</span>
				<span className="text-xs text-text-secondary">
					{displayDate} • {accountInfo}
				</span>
			</div>

			{/* Montant */}
			<div className="text-right px-4 max-md:px-2">
				<AmountDisplay
					amount={amount}
					type={type}
					size="md"
				/>
			</div>
		</div>
	)
}

TransactionRow.propTypes = {
	transaction: PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		type: PropTypes.oneOf(['income', 'expense', 'transfer']).isRequired,
		description: PropTypes.string,
		amount: PropTypes.number.isRequired,
		date: PropTypes.string.isRequired,
		account_name: PropTypes.string,
		target_account_name: PropTypes.string,
		category_name: PropTypes.string,
		category_color: PropTypes.string,
		category_icon: PropTypes.string
	}).isRequired,
	formatDate: PropTypes.func,
	onClick: PropTypes.func,
	className: PropTypes.string
}

export default TransactionRow
