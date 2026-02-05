import clsx from 'clsx'
import PropTypes from 'prop-types'

/**
 * Barre de progression spécialisée pour les budgets.
 * Affiche le pourcentage consommé avec une couleur adaptative.
 *
 * @param {number} spent - Montant dépensé
 * @param {number} total - Montant total du budget
 * @param {string} size - Taille: 'sm', 'md', 'lg' (défaut: 'md')
 * @param {boolean} showPercentage - Afficher le pourcentage (défaut: true)
 * @param {boolean} showAmounts - Afficher les montants spent/total (défaut: false)
 * @param {string} locale - Locale pour le formatage (défaut: 'fr-FR')
 * @param {string} currency - Devise (défaut: 'EUR')
 * @param {string} className - Classes CSS additionnelles
 */
function BudgetProgressBar({
	spent = 0,
	total = 0,
	size = 'md',
	showPercentage = true,
	showAmounts = false,
	locale = 'fr-FR',
	currency = 'EUR',
	className = ''
}) {
	// Calcul du pourcentage
	const percentage = total > 0 ? (spent / total) * 100 : 0
	const isOverBudget = spent > total
	const isWarning = percentage > 70 && percentage <= 100

	// Configuration des tailles
	const sizeConfig = {
		sm: {
			bar: 'h-1',
			text: 'text-xs',
			barWidth: 'w-16'
		},
		md: {
			bar: 'h-1.5',
			text: 'text-xs',
			barWidth: 'w-20'
		},
		lg: {
			bar: 'h-2',
			text: 'text-sm',
			barWidth: 'w-24'
		}
	}

	const config = sizeConfig[size] || sizeConfig.md

	// Couleur de la barre selon le pourcentage
	const getBarColor = () => {
		if (isOverBudget) return 'bg-red-500'
		if (isWarning) return 'bg-amber-500'
		return 'bg-neon-cyan'
	}

	// Couleur du texte selon le pourcentage
	const getTextColor = () => {
		if (isOverBudget) return 'text-red-500'
		return 'text-text-secondary'
	}

	// Formatage des montants
	const formatCurrency = (amount) => {
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency: currency
		}).format(amount)
	}

	return (
		<div className={clsx('flex items-center gap-2', className)}>
			{/* Barre de progression */}
			<div className={clsx(
				config.barWidth,
				config.bar,
				'bg-bg-secondary rounded-full overflow-hidden'
			)}>
				<div
					className={clsx(
						'h-full rounded-full transition-all duration-300',
						getBarColor()
					)}
					style={{ width: `${Math.min(percentage, 100)}%` }}
				/>
			</div>

			{/* Pourcentage */}
			{showPercentage && (
				<span className={clsx(config.text, 'whitespace-nowrap', getTextColor())}>
					{Math.round(percentage)}%
				</span>
			)}

			{/* Montants */}
			{showAmounts && (
				<span className={clsx(config.text, 'whitespace-nowrap text-text-secondary')}>
					{formatCurrency(spent)} / {formatCurrency(total)}
				</span>
			)}
		</div>
	)
}

BudgetProgressBar.propTypes = {
	spent: PropTypes.number,
	total: PropTypes.number,
	size: PropTypes.oneOf(['sm', 'md', 'lg']),
	showPercentage: PropTypes.bool,
	showAmounts: PropTypes.bool,
	locale: PropTypes.string,
	currency: PropTypes.string,
	className: PropTypes.string
}

export default BudgetProgressBar
