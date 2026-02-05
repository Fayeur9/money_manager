import clsx from 'clsx'
import PropTypes from 'prop-types'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CategoryBadge from '../CategoryBadge'
import BudgetProgressBar from '../BudgetProgressBar'

/**
 * Carte de budget pour la sidebar.
 * Affiche un budget avec sa catégorie, progression et indicateurs.
 *
 * @param {Object} budget - Données du budget
 * @param {string} budget.id - ID du budget
 * @param {string} budget.category_name - Nom de la catégorie
 * @param {string} budget.category_color - Couleur de la catégorie
 * @param {string} budget.category_icon - Icône de la catégorie
 * @param {number} budget.budget_amount - Montant total du budget
 * @param {number} budget.totalSpent - Montant dépensé
 * @param {Array} budget.children - Sous-budgets (optionnel)
 * @param {boolean} selected - Budget sélectionné
 * @param {boolean} showChevron - Afficher la flèche (défaut: true)
 * @param {function} onClick - Callback au clic
 * @param {string} className - Classes CSS additionnelles
 */
function BudgetCard({
	budget,
	selected = false,
	showChevron = true,
	onClick,
	className = ''
}) {
	const {
		category_name,
		category_color = '#6b7280',
		category_icon = '/default/icons/dots.png',
		budget_amount = 0,
		totalSpent = 0,
		children = []
	} = budget || {}

	const childCount = children?.length || 0

	return (
		<div
			className={clsx(
				'group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200',
				selected
					? 'bg-neon-cyan/20 border border-neon-cyan/50'
					: 'border border-transparent hover:bg-white/5',
				className
			)}
			onClick={onClick}
		>
			<CategoryBadge
				color={category_color}
				icon={category_icon}
				size="sm"
			/>

			<div className="flex-1 min-w-0">
				<div className="text-sm font-medium text-text-primary truncate">
					{category_name}
				</div>
				<BudgetProgressBar
					spent={totalSpent}
					total={budget_amount}
					size="sm"
					className="mt-0.5"
				/>
				{childCount > 0 && (
					<div className="text-xs text-text-secondary mt-0.5">
						{childCount} sous-budget{childCount > 1 ? 's' : ''}
					</div>
				)}
			</div>

			{showChevron && (
				<ChevronRightIcon
					style={{ fontSize: 18 }}
					className={clsx(
						'shrink-0 transition-colors',
						selected ? 'text-neon-cyan' : 'text-text-secondary'
					)}
				/>
			)}
		</div>
	)
}

BudgetCard.propTypes = {
	budget: PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		category_name: PropTypes.string.isRequired,
		category_color: PropTypes.string,
		category_icon: PropTypes.string,
		budget_amount: PropTypes.number,
		totalSpent: PropTypes.number,
		children: PropTypes.array
	}).isRequired,
	selected: PropTypes.bool,
	showChevron: PropTypes.bool,
	onClick: PropTypes.func,
	className: PropTypes.string
}

export default BudgetCard
