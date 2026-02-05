import clsx from 'clsx'
import PropTypes from 'prop-types'
import AddIcon from '@mui/icons-material/Add'
import SavingsIcon from '@mui/icons-material/Savings'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { formatCurrency, formatDate } from '../../utils/formatters'

/**
 * Contenu principal de la page Budgets
 * Affiche les détails du budget sélectionné, ses sous-budgets et transactions
 */
function BudgetsContent({
	selectedParent,
	childBudgetsWithTransactions,
	parentDirectTransactions,
	hasNoChildren,
	loadingTransactions,
	currentMonth,
	openAccordions,
	onToggleAccordion,
	onOpenEditModal,
	onOpenDeleteModal,
	onOpenAddChildBudgetModal,
	onOpenQuickTransactionModal,
	onOpenQuickBudgetModal,
	onOpenCreateModal,
	availableCategoriesCount
}) {
	if (!selectedParent) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center py-12">
					<SavingsIcon className="text-6xl text-text-secondary opacity-50 mb-4" />
					<p className="text-text-secondary mb-4">Aucun budget défini</p>
					<p className="text-sm text-text-secondary mb-6">
						Créez un budget mensuel pour suivre vos dépenses par catégorie
					</p>
					{availableCategoriesCount > 0 && (
						<button
							onClick={onOpenCreateModal}
							className="flex items-center gap-2 py-2.5 px-4 bg-gradient-to-br from-neon-cyan to-neon-purple border-none rounded-xl text-white text-sm font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(0,240,255,0.4)] mx-auto"
						>
							<AddIcon fontSize="small" />
							<span>Créer mon premier budget</span>
						</button>
					)}
				</div>
			</div>
		)
	}

	return (
		<>
			{/* Header du budget parent sélectionné */}
			<div className="flex items-center gap-4 p-6 border-b border-border">
				<div
					className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
					style={{ backgroundColor: selectedParent.category_color || '#6b7280' }}
				>
					<img
						src={selectedParent.category_icon || '/default/icons/dots.png'}
						alt=""
						className="w-7 h-7 object-contain brightness-0 invert"
					/>
				</div>
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-text-primary m-0">
						{selectedParent.category_name}
					</h1>
					<div className="flex items-baseline gap-2 mt-1">
						<span className={clsx(
							'text-lg font-semibold',
							selectedParent.totalSpent > selectedParent.budget_amount
								? 'text-red-500' : 'text-text-primary'
						)}>
							{formatCurrency(selectedParent.totalSpent)}
						</span>
						<span className="text-text-secondary">
							/ {formatCurrency(selectedParent.budget_amount)}
						</span>
						{selectedParent.budget_amount > 0 && (
							<span className={clsx(
								'text-sm ml-2 px-2 py-0.5 rounded-full',
								selectedParent.totalSpent > selectedParent.budget_amount
									? 'bg-red-500/20 text-red-500'
									: selectedParent.totalSpent / selectedParent.budget_amount > 0.7
										? 'bg-amber-500/20 text-amber-500'
										: 'bg-green-500/20 text-green-500'
							)}>
								{Math.round((selectedParent.totalSpent / selectedParent.budget_amount) * 100)}%
							</span>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					<button
						onClick={onOpenAddChildBudgetModal}
						className="p-2 rounded-lg text-text-secondary transition-all duration-200 hover:bg-amber-500/10 hover:text-amber-500"
						title="Ajouter un sous-budget"
					>
						<AddIcon />
					</button>
					{!selectedParent.isGroupHeader && (
						<>
							<button
								onClick={() => onOpenEditModal(selectedParent)}
								className="p-2 rounded-lg text-text-secondary transition-all duration-200 hover:bg-white/10 hover:text-neon-cyan"
								title="Modifier"
							>
								<EditIcon />
							</button>
							<button
								onClick={() => onOpenDeleteModal(selectedParent)}
								className="p-2 rounded-lg text-text-secondary transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
								title="Supprimer"
							>
								<DeleteOutlineIcon />
							</button>
						</>
					)}
				</div>
			</div>

			{/* Barre de progression globale */}
			{selectedParent.budget_amount > 0 && (
				<div className="px-6 py-4 border-b border-border">
					<div className="h-3 bg-bg-secondary rounded-full overflow-hidden">
						<div
							className={clsx(
								'h-full rounded-full transition-all duration-500',
								selectedParent.totalSpent > selectedParent.budget_amount
									? 'bg-red-500'
									: selectedParent.totalSpent / selectedParent.budget_amount > 0.7
										? 'bg-amber-500'
										: 'bg-gradient-to-r from-neon-cyan to-neon-purple'
							)}
							style={{
								width: `${Math.min((selectedParent.totalSpent / selectedParent.budget_amount) * 100, 100)}%`
							}}
						/>
					</div>
					<div className="flex justify-between text-sm mt-2">
						<span className="text-text-secondary">
							Reste: <span className={clsx(
								'font-medium',
								selectedParent.budget_amount - selectedParent.totalSpent < 0
									? 'text-red-500' : 'text-green-500'
							)}>
								{formatCurrency(selectedParent.budget_amount - selectedParent.totalSpent)}
							</span>
						</span>
						<span className="text-text-secondary capitalize">{currentMonth}</span>
					</div>
				</div>
			)}

			{/* Liste des sous-catégories avec leurs transactions */}
			<div className="flex-1 overflow-y-auto p-6 max-md:p-4">
				{loadingTransactions ? (
					<div className="text-center py-8 text-text-secondary">
						Chargement des transactions...
					</div>
				) : hasNoChildren ? (
					/* Budget sans enfants : afficher les transactions directement */
					<DirectTransactionsList
						transactions={parentDirectTransactions}
						selectedParent={selectedParent}
						onOpenQuickTransactionModal={onOpenQuickTransactionModal}
					/>
				) : childBudgetsWithTransactions.length === 0 ? (
					<div className="text-center py-12">
						<ReceiptLongIcon className="text-5xl text-text-secondary opacity-50 mb-4" />
						<p className="text-text-secondary m-0">Aucun sous-budget</p>
					</div>
				) : (
					<div className="space-y-3">
						{/* Accordéon pour les transactions directes sur la catégorie parente */}
						{parentDirectTransactions.length > 0 && (
							<ParentDirectAccordion
								selectedParent={selectedParent}
								transactions={parentDirectTransactions}
								isOpen={openAccordions['__parent__']}
								onToggle={() => onToggleAccordion('__parent__')}
								onOpenQuickTransactionModal={onOpenQuickTransactionModal}
							/>
						)}
						{/* Liste des sous-budgets */}
						<ChildBudgetsList
							childBudgetsWithTransactions={childBudgetsWithTransactions}
							openAccordions={openAccordions}
							onToggleAccordion={onToggleAccordion}
							onOpenEditModal={onOpenEditModal}
							onOpenDeleteModal={onOpenDeleteModal}
							onOpenQuickTransactionModal={onOpenQuickTransactionModal}
							onOpenQuickBudgetModal={onOpenQuickBudgetModal}
						/>
					</div>
				)}
			</div>
		</>
	)
}

/**
 * Liste des transactions directes (pour budgets sans enfants)
 */
function DirectTransactionsList({ transactions, selectedParent, onOpenQuickTransactionModal }) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between mb-4">
				<span className="text-sm text-text-secondary">
					{transactions.length} transaction{transactions.length > 1 ? 's' : ''} ce mois-ci
				</span>
				<button
					onClick={() => onOpenQuickTransactionModal({
						id: selectedParent.category_id,
						name: selectedParent.category_name,
						icon: selectedParent.category_icon,
						color: selectedParent.category_color
					})}
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-green-500 bg-green-500/10 border-none cursor-pointer transition-all duration-200 hover:bg-green-500/20"
				>
					<AddIcon style={{ fontSize: 16 }} />
					Ajouter
				</button>
			</div>
			{transactions.length === 0 ? (
				<div className="text-center py-8">
					<ReceiptLongIcon className="text-4xl text-text-secondary opacity-50 mb-3" />
					<p className="text-text-secondary text-sm m-0">Aucune transaction ce mois-ci</p>
				</div>
			) : (
				<div className="bg-bg-secondary border border-border rounded-xl overflow-hidden divide-y divide-border">
					{transactions.map(transaction => (
						<div
							key={transaction.id}
							className="flex items-center gap-3 p-3 hover:bg-white/5"
						>
							<div className="flex-1">
								<div className="text-sm text-text-primary">
									{transaction.description || 'Sans description'}
								</div>
								<div className="text-xs text-text-secondary">
									{formatDate(transaction.date)}
									{transaction.account_name && ` • ${transaction.account_name}`}
								</div>
							</div>
							<span className="text-sm font-medium text-red-500">
								-{formatCurrency(Math.abs(transaction.amount))}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

/**
 * Accordéon pour les transactions directes sur la catégorie parente
 */
function ParentDirectAccordion({
	selectedParent,
	transactions,
	isOpen,
	onToggle,
	onOpenQuickTransactionModal
}) {
	const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

	return (
		<div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
			{/* Header accordéon */}
			<div
				className="flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 hover:bg-white/5"
				onClick={onToggle}
			>
				<div
					className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
					style={{ backgroundColor: selectedParent.category_color || '#6b7280' }}
				>
					<img
						src={selectedParent.category_icon || '/default/icons/dots.png'}
						alt=""
						className="w-5 h-5 object-contain brightness-0 invert"
					/>
				</div>
				<div className="flex-1 text-left">
					<div className="text-sm font-medium text-text-primary">
						{selectedParent.category_name}
						<span className="text-text-secondary font-normal ml-1">(direct)</span>
					</div>
					<div className="text-xs text-text-secondary">
						{transactions.length} transaction{transactions.length > 1 ? 's' : ''}
					</div>
				</div>
				<span className="text-sm font-semibold text-text-primary">
					{formatCurrency(totalSpent)}
				</span>
				<button
					onClick={(e) => {
						e.stopPropagation()
						onOpenQuickTransactionModal({
							id: selectedParent.category_id,
							name: selectedParent.category_name,
							icon: selectedParent.category_icon,
							color: selectedParent.category_color
						})
					}}
					className="p-1.5 rounded-lg text-text-secondary bg-transparent border-none cursor-pointer transition-all duration-200 hover:bg-green-500/10 hover:text-green-500"
					title="Ajouter une transaction"
				>
					<AddIcon style={{ fontSize: 18 }} />
				</button>
				<ExpandMoreIcon
					className={clsx(
						'text-text-secondary transition-transform duration-200',
						isOpen && 'rotate-180'
					)}
				/>
			</div>

			{/* Contenu accordéon */}
			{isOpen && (
				<div className="border-t border-border">
					<div className="divide-y divide-border">
						{transactions.map(transaction => (
							<div
								key={transaction.id}
								className="flex items-center gap-3 p-3 hover:bg-white/5"
							>
								<div className="flex-1">
									<div className="text-sm text-text-primary">
										{transaction.description || 'Sans description'}
									</div>
									<div className="text-xs text-text-secondary">
										{formatDate(transaction.date)}
										{transaction.account_name && (
											<span className="ml-2">• {transaction.account_name}</span>
										)}
									</div>
								</div>
								<span className="text-sm font-medium text-red-500">
									{formatCurrency(Math.abs(transaction.amount))}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

/**
 * Liste des sous-budgets avec accordéons
 */
function ChildBudgetsList({
	childBudgetsWithTransactions,
	openAccordions,
	onToggleAccordion,
	onOpenEditModal,
	onOpenDeleteModal,
	onOpenQuickTransactionModal,
	onOpenQuickBudgetModal
}) {
	return (
		<div className="space-y-3">
			{childBudgetsWithTransactions.map(({ category, budget, transactions: catTransactions, spent }) => (
				<div
					key={category.id}
					className="bg-bg-secondary border border-border rounded-xl overflow-hidden"
				>
					{/* Header accordéon */}
					<div
						className="flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 hover:bg-white/5"
						onClick={() => onToggleAccordion(category.id)}
					>
						<div
							className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
							style={{ backgroundColor: category.color || '#6b7280' }}
						>
							<img
								src={category.icon || '/default/icons/dots.png'}
								alt=""
								className="w-5 h-5 object-contain brightness-0 invert"
							/>
						</div>
						<div className="flex-1 text-left">
							<div className="text-sm font-medium text-text-primary">
								{category.name}
							</div>
							<div className="text-xs text-text-secondary">
								{catTransactions.length} transaction{catTransactions.length > 1 ? 's' : ''}
								{budget && (
									<span className="ml-2">
										• {formatCurrency(spent)} / {formatCurrency(budget.budget_amount)}
									</span>
								)}
							</div>
						</div>
						{budget && (
							<div className="flex items-center gap-2 mr-2">
								<div className="w-16 h-1.5 bg-bg-primary rounded-full overflow-hidden">
									<div
										className={clsx(
											'h-full rounded-full',
											spent > budget.budget_amount ? 'bg-red-500' :
											spent / budget.budget_amount > 0.7 ? 'bg-amber-500' : 'bg-neon-cyan'
										)}
										style={{ width: `${Math.min((spent / budget.budget_amount) * 100, 100)}%` }}
									/>
								</div>
								<span className={clsx(
									'text-xs',
									spent > budget.budget_amount ? 'text-red-500' : 'text-text-secondary'
								)}>
									{Math.round((spent / budget.budget_amount) * 100)}%
								</span>
							</div>
						)}
						<span className={clsx(
							'text-sm font-semibold',
							budget && spent > budget.budget_amount ? 'text-red-500' : 'text-text-primary'
						)}>
							{formatCurrency(spent)}
						</span>
						<button
							onClick={(e) => {
								e.stopPropagation()
								onOpenQuickTransactionModal(category)
							}}
							className="p-1.5 rounded-lg text-text-secondary bg-transparent border-none cursor-pointer transition-all duration-200 hover:bg-green-500/10 hover:text-green-500"
							title="Ajouter une transaction"
						>
							<AddIcon style={{ fontSize: 18 }} />
						</button>
						{budget ? (
							<>
								<button
									onClick={(e) => {
										e.stopPropagation()
										onOpenEditModal(budget)
									}}
									className="p-1.5 rounded-lg text-text-secondary bg-transparent border-none cursor-pointer transition-all duration-200 hover:bg-white/10 hover:text-neon-cyan"
									title="Modifier le budget"
								>
									<EditIcon style={{ fontSize: 18 }} />
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation()
										onOpenDeleteModal(budget)
									}}
									className="p-1.5 rounded-lg text-text-secondary bg-transparent border-none cursor-pointer transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
									title="Supprimer le budget"
								>
									<DeleteOutlineIcon style={{ fontSize: 18 }} />
								</button>
							</>
						) : (
							<button
								onClick={(e) => {
									e.stopPropagation()
									onOpenQuickBudgetModal(category)
								}}
								className="p-1.5 rounded-lg text-text-secondary bg-transparent border-none cursor-pointer transition-all duration-200 hover:bg-amber-500/10 hover:text-amber-500"
								title="Créer un budget"
							>
								<SavingsIcon style={{ fontSize: 18 }} />
							</button>
						)}
						<ExpandMoreIcon
							className={clsx(
								'text-text-secondary transition-transform duration-200',
								openAccordions[category.id] && 'rotate-180'
							)}
						/>
					</div>

					{/* Contenu accordéon */}
					{openAccordions[category.id] && (
						<div className="border-t border-border">
							{catTransactions.length === 0 ? (
								<div className="p-4 text-center text-sm text-text-secondary">
									Aucune transaction ce mois-ci
								</div>
							) : (
								<div className="divide-y divide-border">
									{catTransactions.map(transaction => (
										<div
											key={transaction.id}
											className="flex items-center gap-3 p-3 hover:bg-white/5"
										>
											<div className="flex-1">
												<div className="text-sm text-text-primary">
													{transaction.description || 'Sans description'}
												</div>
												<div className="text-xs text-text-secondary">
													{formatDate(transaction.date)}
													{transaction.account_name && (
														<span className="ml-2">• {transaction.account_name}</span>
													)}
												</div>
											</div>
											<span className="text-sm font-medium text-red-500">
												{formatCurrency(Math.abs(transaction.amount))}
											</span>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			))}
		</div>
	)
}

BudgetsContent.propTypes = {
	selectedParent: PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		category_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		category_name: PropTypes.string,
		category_color: PropTypes.string,
		category_icon: PropTypes.string,
		budget_amount: PropTypes.number,
		totalSpent: PropTypes.number,
		isGroupHeader: PropTypes.bool,
		children: PropTypes.array
	}),
	childBudgetsWithTransactions: PropTypes.array,
	parentDirectTransactions: PropTypes.array,
	hasNoChildren: PropTypes.bool,
	loadingTransactions: PropTypes.bool,
	currentMonth: PropTypes.string,
	openAccordions: PropTypes.object,
	onToggleAccordion: PropTypes.func.isRequired,
	onOpenEditModal: PropTypes.func.isRequired,
	onOpenDeleteModal: PropTypes.func.isRequired,
	onOpenAddChildBudgetModal: PropTypes.func.isRequired,
	onOpenQuickTransactionModal: PropTypes.func.isRequired,
	onOpenQuickBudgetModal: PropTypes.func.isRequired,
	onOpenCreateModal: PropTypes.func.isRequired,
	availableCategoriesCount: PropTypes.number
}

DirectTransactionsList.propTypes = {
	transactions: PropTypes.array.isRequired,
	selectedParent: PropTypes.object.isRequired,
	onOpenQuickTransactionModal: PropTypes.func.isRequired
}

ParentDirectAccordion.propTypes = {
	selectedParent: PropTypes.object.isRequired,
	transactions: PropTypes.array.isRequired,
	isOpen: PropTypes.bool,
	onToggle: PropTypes.func.isRequired,
	onOpenQuickTransactionModal: PropTypes.func.isRequired
}

ChildBudgetsList.propTypes = {
	childBudgetsWithTransactions: PropTypes.array.isRequired,
	openAccordions: PropTypes.object.isRequired,
	onToggleAccordion: PropTypes.func.isRequired,
	onOpenEditModal: PropTypes.func.isRequired,
	onOpenDeleteModal: PropTypes.func.isRequired,
	onOpenQuickTransactionModal: PropTypes.func.isRequired,
	onOpenQuickBudgetModal: PropTypes.func.isRequired
}

export default BudgetsContent
