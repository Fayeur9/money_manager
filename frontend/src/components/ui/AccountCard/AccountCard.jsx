import clsx from 'clsx'
import PropTypes from 'prop-types'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import AmountDisplay from '../AmountDisplay'

/**
 * Carte de compte avec header, actions et contenu expandable.
 *
 * @param {Object} account - Données du compte
 * @param {string} account.id - ID du compte
 * @param {string} account.name - Nom du compte
 * @param {string} account.type - Type de compte
 * @param {string} account.color - Couleur du compte
 * @param {string} account.icon - Icône du compte
 * @param {number} account.balance - Solde du compte
 * @param {boolean} expanded - État d'expansion
 * @param {function} onToggleExpand - Callback pour toggle expand
 * @param {function} onEdit - Callback pour édition
 * @param {function} onDelete - Callback pour suppression
 * @param {function} getTypeLabel - Fonction pour obtenir le label du type
 * @param {React.ReactNode} children - Contenu expandable
 * @param {string} className - Classes CSS additionnelles
 */
function AccountCard({
	account,
	expanded = false,
	onToggleExpand,
	onEdit,
	onDelete,
	getTypeLabel,
	children,
	className = ''
}) {
	const {
		name,
		type,
		color = '#3b82f6',
		icon = '/default/icons/wallet.png',
		balance = 0
	} = account || {}

	// Label du type par défaut
	const defaultGetTypeLabel = (t) => {
		const labels = {
			checking: 'Compte courant',
			savings: 'Épargne',
			cash: 'Espèces',
			investment: 'Investissement',
			credit: 'Crédit'
		}
		return labels[t] || t
	}

	const typeLabel = getTypeLabel ? getTypeLabel(type) : defaultGetTypeLabel(type)

	const handleEditClick = (e) => {
		e.stopPropagation()
		onEdit?.(account)
	}

	const handleDeleteClick = (e) => {
		e.stopPropagation()
		onDelete?.(account)
	}

	return (
		<div className={clsx(
			'rounded-xl overflow-hidden bg-bg-card border border-border transition-all duration-300 hover:border-neon-cyan/30',
			className
		)}>
			{/* Header */}
			<div
				className={clsx(
					'flex items-center justify-between p-4 px-6 bg-gradient-to-br from-neon-cyan/10 to-neon-cyan/[0.02] border-l-4 cursor-pointer transition-all duration-300',
					'hover:from-neon-cyan/15 hover:to-neon-cyan/5',
					'max-md:flex-wrap max-md:gap-4',
					expanded && 'border-b border-border'
				)}
				onClick={onToggleExpand}
				style={{ borderLeftColor: color }}
			>
				{/* Icon + Name + Type */}
				<div className="flex items-center gap-4 flex-1">
					<div
						className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
						style={{ backgroundColor: color }}
					>
						<img src={icon} alt="" className="w-6 h-6" />
					</div>
					<div className="flex flex-col gap-1">
						<span className="font-semibold text-lg text-text-primary">{name}</span>
						<span className="text-sm text-text-secondary">{typeLabel}</span>
					</div>
				</div>

				{/* Balance */}
				<div className="px-8 max-md:px-0 max-md:order-3 max-md:w-full max-md:text-right">
					<AmountDisplay
						amount={balance}
						type={balance >= 0 ? 'positive' : 'negative'}
						size="xl"
						showSign={false}
					/>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2 max-md:order-2">
					{onEdit && (
						<button
							className="w-9 h-9 rounded-lg border border-border bg-bg-secondary text-text-secondary cursor-pointer flex items-center justify-center transition-all duration-300 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/10"
							onClick={handleEditClick}
							title="Modifier"
						>
							<EditIcon fontSize="small" />
						</button>
					)}
					{onDelete && (
						<button
							className="w-9 h-9 rounded-lg border border-border bg-bg-secondary text-text-secondary cursor-pointer flex items-center justify-center transition-all duration-300 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
							onClick={handleDeleteClick}
							title="Supprimer"
						>
							<DeleteIcon fontSize="small" />
						</button>
					)}
					{onToggleExpand && (
						<button
							className="w-9 h-9 rounded-lg border-none bg-transparent text-neon-cyan cursor-pointer flex items-center justify-center transition-all duration-300 hover:bg-neon-cyan/10"
							title={expanded ? 'Replier' : 'Déplier'}
						>
							{expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
						</button>
					)}
				</div>
			</div>

			{/* Expandable content */}
			{expanded && children && (
				<div className="p-4 px-6 pb-6 bg-bg-secondary animate-[slideDown_0.3s_ease]">
					{children}
				</div>
			)}
		</div>
	)
}

AccountCard.propTypes = {
	account: PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		name: PropTypes.string.isRequired,
		type: PropTypes.string.isRequired,
		color: PropTypes.string,
		icon: PropTypes.string,
		balance: PropTypes.number
	}).isRequired,
	expanded: PropTypes.bool,
	onToggleExpand: PropTypes.func,
	onEdit: PropTypes.func,
	onDelete: PropTypes.func,
	getTypeLabel: PropTypes.func,
	children: PropTypes.node,
	className: PropTypes.string
}

export default AccountCard
