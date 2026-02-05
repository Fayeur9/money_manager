import clsx from 'clsx'
import PropTypes from 'prop-types'
import AmountDisplay from '../AmountDisplay'

/**
 * Carte de transaction récurrente.
 *
 * @param {Object} recurring - Données de la récurrente
 * @param {string} recurring.id - ID
 * @param {string} recurring.type - Type: 'income', 'expense'
 * @param {string} recurring.description - Description
 * @param {number} recurring.amount - Montant
 * @param {string} recurring.frequency - Fréquence
 * @param {string} recurring.category_icon - Icône de la catégorie
 * @param {string} recurring.category_color - Couleur de la catégorie
 * @param {number} monthlyAmount - Montant mensuel calculé (optionnel)
 * @param {function} getFrequencyLabel - Fonction pour obtenir le label de fréquence
 * @param {function} onClick - Callback au clic
 * @param {string} className - Classes CSS additionnelles
 */
function RecurringCard({
	recurring,
	monthlyAmount,
	getFrequencyLabel,
	onClick,
	className = ''
}) {
	const {
		type,
		description,
		amount,
		frequency,
		category_icon = '/default/icons/dots.png',
		category_color = '#6b7280'
	} = recurring || {}

	// Labels de fréquence par défaut
	const defaultGetFrequencyLabel = (freq) => {
		const labels = {
			daily: 'Quotidien',
			weekly: 'Hebdomadaire',
			biweekly: 'Bi-mensuel',
			monthly: 'Mensuel',
			quarterly: 'Trimestriel',
			yearly: 'Annuel'
		}
		return labels[freq] || freq
	}

	// Calcul du montant mensuel par défaut
	const defaultGetMonthlyAmount = () => {
		const amt = parseFloat(amount)
		switch (frequency) {
			case 'daily': return amt * 30
			case 'weekly': return amt * 4.33
			case 'biweekly': return amt * 2
			case 'monthly': return amt
			case 'quarterly': return amt / 3
			case 'yearly': return amt / 12
			default: return amt
		}
	}

	const frequencyLabel = getFrequencyLabel ? getFrequencyLabel(frequency) : defaultGetFrequencyLabel(frequency)
	const displayAmount = monthlyAmount !== undefined ? monthlyAmount : defaultGetMonthlyAmount()

	return (
		<div
			className={clsx(
				'flex items-center gap-2 p-2 px-3 bg-bg-secondary rounded-lg cursor-pointer hover:bg-neon-cyan/5',
				className
			)}
			onClick={onClick}
		>
			{/* Icon */}
			<div className="flex items-center gap-3 flex-1 min-w-0">
				<div
					className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
					style={{ backgroundColor: category_color }}
				>
					<img
						src={category_icon}
						alt=""
						className="w-4 h-4 object-contain brightness-0 invert"
					/>
				</div>
				<div className="flex flex-col gap-0.5 min-w-0 flex-1">
					<span className="text-sm text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
						{description}
					</span>
					<span className="text-xs text-text-secondary">
						{frequencyLabel}
					</span>
				</div>
			</div>

			{/* Amount */}
			<AmountDisplay
				amount={displayAmount}
				type={type}
				size="sm"
				className="whitespace-nowrap shrink-0"
			/>
		</div>
	)
}

RecurringCard.propTypes = {
	recurring: PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		type: PropTypes.oneOf(['income', 'expense']).isRequired,
		description: PropTypes.string.isRequired,
		amount: PropTypes.number.isRequired,
		frequency: PropTypes.string.isRequired,
		category_icon: PropTypes.string,
		category_color: PropTypes.string
	}).isRequired,
	monthlyAmount: PropTypes.number,
	getFrequencyLabel: PropTypes.func,
	onClick: PropTypes.func,
	className: PropTypes.string
}

export default RecurringCard
