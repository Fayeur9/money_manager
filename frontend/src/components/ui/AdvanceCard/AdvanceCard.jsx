import clsx from 'clsx'
import PropTypes from 'prop-types'
import PersonIcon from '@mui/icons-material/Person'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import ProgressBar from '../ProgressBar'

/**
 * Carte d'avance en attente de remboursement.
 *
 * @param {Object} advance - Données de l'avance
 * @param {string} advance.person - Personne qui doit rembourser
 * @param {number} advance.amount - Montant avancé
 * @param {number} advance.amount_received - Montant déjà reçu
 * @param {string} advance.status - Statut: 'pending', 'partial', 'paid'
 * @param {string} advance.date - Date de l'avance
 * @param {string} advance.due_date - Date limite (optionnel)
 * @param {string} advance.description - Description
 * @param {string} advance.direction - Direction: 'given' ou 'received'
 * @param {string} accountName - Nom du compte (optionnel)
 * @param {function} onClick - Callback au clic
 * @param {string} className - Classes CSS additionnelles
 */
function AdvanceCard({
	advance,
	accountName,
	onClick,
	className = ''
}) {
	const {
		person,
		amount,
		amount_received = 0,
		status = 'pending',
		date,
		due_date,
		description,
		direction = 'given'
	} = advance || {}

	// Labels et couleurs selon la direction
	const isGiven = direction === 'given'
	const accentColor = isGiven ? 'text-neon-cyan' : 'text-neon-purple'
	const accentBg = isGiven ? 'bg-neon-cyan/20' : 'bg-neon-purple/20'
	const hoverBg = isGiven ? 'hover:bg-neon-cyan/5' : 'hover:bg-neon-purple/5'
	const labels = {
		amount: isGiven ? 'Prêté' : 'Emprunté',
		remaining: isGiven ? 'Reste à recevoir' : 'Reste à rembourser',
		completed: isGiven ? 'Reçu' : 'Remboursé'
	}

	const remaining = amount - amount_received
	const progress = amount > 0 ? (amount_received / amount) * 100 : 0

	// Couleurs selon le statut
	const statusConfig = {
		pending: { label: 'En attente', color: '#f59e0b', bgColor: 'bg-yellow-500/10' },
		partial: { label: 'Partiel', color: '#3b82f6', bgColor: 'bg-blue-500/10' },
		paid: { label: 'Remboursé', color: '#22c55e', bgColor: 'bg-green-500/10' }
	}

	const { label: statusLabel, color: statusColor, bgColor } = statusConfig[status] || statusConfig.pending

	// Vérifier si en retard
	const isOverdue = due_date && new Date(due_date) < new Date() && status !== 'paid'

	// Avance remboursée = grisée
	const isPaid = status === 'paid'

	return (
		<div
			className={clsx(
				'p-4 bg-bg-secondary rounded-xl cursor-pointer transition-colors',
				isPaid ? 'opacity-50 hover:opacity-70' : hoverBg,
				className
			)}
			onClick={onClick}
		>
			{/* Header: Personne + Statut */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className={clsx('w-8 h-8 rounded-full flex items-center justify-center', accentBg)}>
						<PersonIcon className={clsx('w-4 h-4', accentColor)} />
					</div>
					<span className="font-medium text-text-primary">{person}</span>
				</div>
				<span
					className={clsx('text-xs px-2 py-1 rounded-full', bgColor)}
					style={{ color: statusColor }}
				>
					{statusLabel}
				</span>
			</div>

			{/* Description */}
			{description && (
				<p className="text-sm text-text-secondary mb-3 line-clamp-1">
					{description}
				</p>
			)}

			{/* Montants */}
			<div className="flex items-center justify-between mb-2">
				<span className="text-xs text-text-secondary">{labels.amount}</span>
				<span className="text-sm font-medium text-text-primary">
					{formatCurrency(amount)}
				</span>
			</div>

			{/* Barre de progression */}
			{status !== 'pending' && (
				<div className="mb-2">
					<ProgressBar
						value={progress}
						max={100}
						color={statusColor}
						showLabel={false}
						size="sm"
					/>
				</div>
			)}

			{/* Reste à recevoir/rembourser */}
			<div className="flex items-center justify-between">
				<span className="text-xs text-text-secondary">
					{status === 'paid' ? labels.completed : labels.remaining}
				</span>
				<span
					className={clsx(
						'text-sm font-bold',
						status === 'paid' ? 'text-green-500' : accentColor
					)}
				>
					{formatCurrency(status === 'paid' ? amount : remaining)}
				</span>
			</div>

			{/* Dates et compte */}
			<div className="flex items-center justify-between mt-3 pt-3 border-t border-border-primary">
				<span className="text-xs text-text-secondary">
					{formatDate(date)}
				</span>
				<div className="flex items-center gap-2">
					{due_date && (
						<span className={clsx(
							'text-xs',
							isOverdue ? 'text-red-500 font-medium' : 'text-text-secondary'
						)}>
							{isOverdue ? 'En retard' : `Échéance: ${formatDate(due_date)}`}
						</span>
					)}
					{accountName && (
						<span className="text-xs text-text-secondary">
							{accountName}
						</span>
					)}
				</div>
			</div>
		</div>
	)
}

AdvanceCard.propTypes = {
	advance: PropTypes.shape({
		id: PropTypes.string,
		person: PropTypes.string.isRequired,
		amount: PropTypes.number.isRequired,
		amount_received: PropTypes.number,
		status: PropTypes.oneOf(['pending', 'partial', 'paid']),
		date: PropTypes.string.isRequired,
		due_date: PropTypes.string,
		description: PropTypes.string,
		direction: PropTypes.oneOf(['given', 'received'])
	}).isRequired,
	accountName: PropTypes.string,
	onClick: PropTypes.func,
	className: PropTypes.string
}

export default AdvanceCard
