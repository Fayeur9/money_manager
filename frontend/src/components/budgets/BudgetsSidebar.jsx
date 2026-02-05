import clsx from 'clsx'
import AddIcon from '@mui/icons-material/Add'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { formatCurrency } from '../../utils/formatters'

/**
 * Sidebar des budgets - Affiche la liste des budgets parents avec progression
 *
 * @param {Array} parentHierarchy - Liste des budgets parents avec leurs enfants
 * @param {Object} selectedParent - Budget parent actuellement sélectionné
 * @param {function} onSelectParent - Callback pour sélectionner un parent
 * @param {number} totalBudget - Total des budgets
 * @param {number} totalSpent - Total dépensé
 * @param {string} currentMonth - Mois courant formaté
 * @param {boolean} showAddButton - Afficher le bouton d'ajout
 * @param {function} onAddClick - Callback pour le bouton d'ajout
 */
function BudgetsSidebar({
	parentHierarchy = [],
	selectedParent,
	onSelectParent,
	totalBudget = 0,
	totalSpent = 0,
	currentMonth,
	showAddButton = false,
	onAddClick
}) {
	const globalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

	return (
		<div className="w-80 shrink-0 bg-bg-card border border-border rounded-2xl flex flex-col overflow-hidden max-md:w-full max-md:max-h-[40vh]">
			{/* Header */}
			<div className="p-4 border-b border-border">
				<div className="flex items-center justify-between mb-1">
					<h2 className="text-lg font-semibold text-text-primary m-0">Budgets</h2>
					<span className="text-xs text-text-secondary capitalize">{currentMonth}</span>
				</div>
				<div className="text-sm text-text-secondary">
					{formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
				</div>
				{totalBudget > 0 && (
					<div className="mt-2 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
						<div
							className={clsx(
								'h-full rounded-full transition-all duration-500',
								globalPercentage > 90 ? 'bg-red-500' :
								globalPercentage > 70 ? 'bg-amber-500' : 'bg-neon-cyan'
							)}
							style={{ width: `${Math.min(globalPercentage, 100)}%` }}
						/>
					</div>
				)}
			</div>

			{/* Liste des budgets parents */}
			<div className="flex-1 overflow-y-auto p-1.5">
				{parentHierarchy.length === 0 ? (
					<div className="text-center py-8 text-text-secondary text-sm">
						Aucun budget
					</div>
				) : (
					parentHierarchy.map(parent => {
						const percentage = parent.budget_amount > 0
							? (parent.totalSpent / parent.budget_amount) * 100
							: 0
						const isSelected = selectedParent?.id === parent.id
						const isOverBudget = parent.totalSpent > parent.budget_amount
						const childCount = parent.children?.length || 0

						return (
							<div
								key={parent.id}
								className={clsx(
									'group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200',
									isSelected
										? 'bg-neon-cyan/20 border border-neon-cyan/50'
										: 'border border-transparent hover:bg-white/5'
								)}
								onClick={() => onSelectParent(parent)}
							>
								<div
									className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
									style={{ backgroundColor: parent.category_color || '#6b7280' }}
								>
									<img
										src={parent.category_icon || '/default/icons/dots.png'}
										alt=""
										className="w-4.5 h-4.5 object-contain brightness-0 invert"
									/>
								</div>
								<div className="flex-1 min-w-0">
									<div className="text-sm font-medium text-text-primary truncate">
										{parent.category_name}
									</div>
									<div className="flex items-center gap-2 mt-0.5">
										<div className="flex-1 h-1 bg-bg-secondary rounded-full overflow-hidden">
											<div
												className={clsx(
													'h-full rounded-full transition-all duration-300',
													isOverBudget ? 'bg-red-500' :
													percentage > 70 ? 'bg-amber-500' : 'bg-neon-cyan'
												)}
												style={{ width: `${Math.min(percentage, 100)}%` }}
											/>
										</div>
										<span className={clsx(
											'text-xs whitespace-nowrap',
											isOverBudget ? 'text-red-500' : 'text-text-secondary'
										)}>
											{Math.round(percentage)}%
										</span>
									</div>
									{childCount > 0 && (
										<div className="text-xs text-text-secondary mt-0.5">
											{childCount} sous-budget{childCount > 1 ? 's' : ''}
										</div>
									)}
								</div>
								<ChevronRightIcon
									style={{ fontSize: 18 }}
									className={clsx(
										'shrink-0 transition-colors',
										isSelected ? 'text-neon-cyan' : 'text-text-secondary'
									)}
								/>
							</div>
						)
					})
				)}
			</div>

			{/* Bouton ajouter */}
			{showAddButton && (
				<div className="p-1.5 border-t border-border">
					<button
						className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-text-secondary text-sm font-medium bg-transparent border border-dashed border-border cursor-pointer transition-all duration-200 hover:border-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/5"
						onClick={onAddClick}
					>
						<AddIcon fontSize="small" />
						Nouveau budget
					</button>
				</div>
			)}
		</div>
	)
}

export default BudgetsSidebar
