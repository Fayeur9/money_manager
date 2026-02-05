import PropTypes from 'prop-types'
import Modal from '../ui/Modal'
import FormModal from '../ui/FormModal'
import ConfirmModal from '../ui/ConfirmModal'
import { BudgetForm } from '../forms'
import CategorySelect from '../CategorySelect'
import StyledSelect from '../StyledSelect'
import clsx from 'clsx'

/**
 * Tous les modals de la page Budgets
 */
function BudgetsModals({
	// États des modals
	createModal,
	editModal,
	deleteModal,
	quickTransactionModal,
	quickBudgetModal,
	addChildBudgetModal,
	// Données
	categories,
	budgets,
	accounts,
	availableCategories,
	availableChildCategories,
	selectedParent,
	// État du formulaire de création
	createForm,
	onCreateFormChange,
	childCategoriesForCreate,
	subBudgetsToCreate,
	onCreateCategoryChange,
	onUpdateSubBudgetToCreate,
	// État du formulaire de transaction rapide
	quickTransactionForm,
	onQuickTransactionFormChange,
	// États de chargement
	loadingAvailableCategories,
	// Gestionnaires d'événements
	onHandleCreate,
	onHandleEdit,
	onHandleDeleteFromEdit,
	onHandleDelete,
	onHandleQuickTransaction,
	onHandleQuickBudget,
	onHandleAddChildBudget,
	// Réinitialiser le formulaire de création
	onClearCreateForm
}) {
	return (
		<>
			{/* Modal création */}
			<Modal
				isOpen={createModal.isOpen}
				onClose={() => {
					createModal.close()
					onClearCreateForm()
				}}
				title="Nouveau budget"
				as="form"
				onSubmit={onHandleCreate}
				footer={
					<>
						<button
							type="button"
							onClick={() => {
								createModal.close()
								onClearCreateForm()
							}}
							className="px-5 py-3 bg-transparent border border-border rounded-lg text-text-secondary font-medium cursor-pointer transition-all duration-200 hover:bg-white/5 hover:text-text-primary"
						>
							Annuler
						</button>
						<button
							type="submit"
							className="px-5 py-3 bg-gradient-to-br from-neon-cyan to-neon-purple border-none rounded-lg text-white font-semibold cursor-pointer transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_4px_15px_rgba(0,240,255,0.3)]"
						>
							Créer
						</button>
					</>
				}
			>
				{/* Catégorie */}
				<div className="mb-5">
					<label className="block text-sm text-text-secondary mb-2 font-medium">Catégorie</label>
					<CategorySelect
						categories={availableCategories}
						value={createForm.category_id}
						onChange={onCreateCategoryChange}
					/>
				</div>

				{/* Plafond mensuel */}
				<div className="mb-5">
					<label className="block text-sm text-text-secondary mb-2 font-medium">
						Plafond mensuel (€)
						{childCategoriesForCreate.length > 0 && (
							<span className="text-text-secondary font-normal ml-1">(optionnel si sous-budgets définis)</span>
						)}
					</label>
					<input
						type="number"
						step="0.01"
						min="0"
						value={createForm.amount}
						onChange={(e) => onCreateFormChange({ ...createForm, amount: e.target.value })}
						placeholder="Ex: 450"
						className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-primary text-base transition-all duration-200 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_0_3px_rgba(0,240,255,0.1)]"
					/>
				</div>

				{/* Sous-catégories (si la catégorie sélectionnée en a) */}
				{childCategoriesForCreate.length > 0 && (
					<div className="border-t border-border pt-5">
						<label className="block text-sm text-text-secondary mb-3 font-medium">
							Créer aussi des sous-budgets
						</label>
						<p className="text-xs text-text-secondary mb-3">
							Ces sous-budgets seront liés au budget principal ci-dessus.
						</p>
						<div className="space-y-3 max-h-64 overflow-y-auto">
							{childCategoriesForCreate.map(child => {
								const subBudgetData = subBudgetsToCreate[child.id] || {}
								const hasExisting = !!subBudgetData.existingBudget
								return (
									<div
										key={child.id}
										className={clsx(
											'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
											subBudgetData.enabled
												? 'border-neon-cyan/50 bg-neon-cyan/5'
												: 'border-border bg-bg-secondary',
											hasExisting && 'opacity-50'
										)}
									>
										<input
											type="checkbox"
											id={`sub-create-${child.id}`}
											checked={subBudgetData.enabled || false}
											onChange={(e) => onUpdateSubBudgetToCreate(child.id, 'enabled', e.target.checked)}
											disabled={hasExisting}
											className="w-5 h-5 accent-neon-cyan cursor-pointer"
										/>
										<div
											className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
											style={{ backgroundColor: child.color || '#6b7280' }}
										>
											<img
												src={child.icon || '/default/icons/dots.png'}
												alt=""
												className="w-4 h-4 brightness-0 invert"
											/>
										</div>
										<label htmlFor={`sub-create-${child.id}`} className="flex-1 text-text-primary cursor-pointer text-sm">
											{child.name}
											{hasExisting && (
												<span className="text-xs text-amber-500 ml-2">(budget parent existant)</span>
											)}
										</label>
										{subBudgetData.enabled && !hasExisting && (
											<input
												type="number"
												step="0.01"
												min="0"
												value={subBudgetData.amount || ''}
												onChange={(e) => onUpdateSubBudgetToCreate(child.id, 'amount', e.target.value)}
												placeholder="€"
												className="w-24 px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-neon-cyan"
											/>
										)}
									</div>
								)
							})}
						</div>
					</div>
				)}
			</Modal>

			{/* Modal édition */}
			<FormModal
				isOpen={editModal.isOpen && !!editModal.data}
				onClose={editModal.close}
				title="Modifier le budget"
				FormComponent={BudgetForm}
				formProps={{
					initialData: editModal.data ? {
						category_id: editModal.data.category_id,
						amount: editModal.data.budget_amount,
						parent_budget_id: editModal.data.parent_budget_id
					} : {},
					categories,
					parentBudget: editModal.data?.parent_budget_id
						? budgets.find(b => b.id === editModal.data.parent_budget_id)
						: null,
					onSubmit: onHandleEdit,
					onDelete: onHandleDeleteFromEdit,
					submitLabel: "Enregistrer"
				}}
			/>

			{/* Modal suppression */}
			<ConfirmModal
				isOpen={deleteModal.isOpen}
				onClose={deleteModal.close}
				onConfirm={onHandleDelete}
				title="Supprimer le budget"
				confirmText="Supprimer"
				variant="danger"
			>
				<p className="m-0">
					Êtes-vous sûr de vouloir supprimer le budget pour{' '}
					<strong className="text-text-primary">{deleteModal.data?.category_name}</strong> ?
				</p>
				{deleteModal.data && !deleteModal.data.parent_budget_id && (() => {
					const childCount = budgets.filter(b => b.parent_budget_id === deleteModal.data.id).length
					return childCount > 0 ? (
						<p className="mt-3 text-sm text-amber-500 m-0">
							{childCount} sous-budget{childCount > 1 ? 's' : ''} ser{childCount > 1 ? 'ont' : 'a'} également supprimé{childCount > 1 ? 's' : ''}.
						</p>
					) : null
				})()}
			</ConfirmModal>

			{/* Modal création rapide transaction */}
			<Modal
				isOpen={quickTransactionModal.isOpen}
				onClose={quickTransactionModal.close}
				title={`Nouvelle dépense - ${quickTransactionModal.data?.name || ''}`}
				footer={
					<>
						<button
							type="button"
							onClick={quickTransactionModal.close}
							className="px-5 py-3 bg-transparent border border-border rounded-lg text-text-secondary font-medium cursor-pointer transition-all duration-200 hover:bg-white/5 hover:text-text-primary"
						>
							Annuler
						</button>
						<button
							type="button"
							onClick={onHandleQuickTransaction}
							className="px-5 py-3 bg-gradient-to-br from-neon-cyan to-neon-purple border-none rounded-lg text-white font-medium cursor-pointer transition-all duration-200 hover:opacity-90"
						>
							Ajouter
						</button>
					</>
				}
			>
				<div className="space-y-4">
					{quickTransactionModal.data && (
						<div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg">
							<div
								className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
								style={{ backgroundColor: quickTransactionModal.data.color || '#6b7280' }}
							>
								<img
									src={quickTransactionModal.data.icon || '/default/icons/dots.png'}
									alt=""
									className="w-5 h-5 object-contain brightness-0 invert"
								/>
							</div>
							<span className="text-text-primary font-medium">{quickTransactionModal.data.name}</span>
						</div>
					)}

					<div>
						<label className="block mb-2 text-sm font-medium text-text-secondary">Compte *</label>
						<StyledSelect
							options={accounts.map(acc => ({ value: acc.id, label: acc.name, icon: acc.icon, color: acc.color }))}
							value={quickTransactionForm.account_id}
							onChange={(value) => onQuickTransactionFormChange({ ...quickTransactionForm, account_id: value })}
							placeholder="Sélectionner un compte"
							showIcons
						/>
					</div>

					<div>
						<label className="block mb-2 text-sm font-medium text-text-secondary">Montant *</label>
						<input
							type="number"
							step="0.01"
							min="0"
							value={quickTransactionForm.amount}
							onChange={(e) => onQuickTransactionFormChange({ ...quickTransactionForm, amount: e.target.value })}
							className="w-full p-3 rounded-lg bg-bg-secondary border border-border text-text-primary outline-none transition-all duration-200 focus:border-neon-cyan"
							placeholder="0.00"
						/>
					</div>

					<div>
						<label className="block mb-2 text-sm font-medium text-text-secondary">Date *</label>
						<input
							type="date"
							value={quickTransactionForm.date}
							onChange={(e) => onQuickTransactionFormChange({ ...quickTransactionForm, date: e.target.value })}
							className="w-full p-3 rounded-lg bg-bg-secondary border border-border text-text-primary outline-none transition-all duration-200 focus:border-neon-cyan"
						/>
					</div>

					<div>
						<label className="block mb-2 text-sm font-medium text-text-secondary">Description</label>
						<input
							type="text"
							value={quickTransactionForm.description}
							onChange={(e) => onQuickTransactionFormChange({ ...quickTransactionForm, description: e.target.value })}
							className="w-full p-3 rounded-lg bg-bg-secondary border border-border text-text-primary outline-none transition-all duration-200 focus:border-neon-cyan"
							placeholder={quickTransactionModal.data?.name || 'Description'}
						/>
					</div>
				</div>
			</Modal>

			{/* Modal création rapide budget */}
			<FormModal
				isOpen={quickBudgetModal.isOpen && !!quickBudgetModal.data}
				onClose={quickBudgetModal.close}
				title={`Nouveau budget - ${quickBudgetModal.data?.name || ''}`}
				size="sm"
				FormComponent={BudgetForm}
				formProps={{
					initialData: { category_id: quickBudgetModal.data?.id },
					categories: quickBudgetModal.data ? [quickBudgetModal.data] : [],
					lockedFields: ['category_id'],
					onSubmit: onHandleQuickBudget,
					submitLabel: "Créer"
				}}
			/>

			{/* Modal ajout budget enfant depuis vue parent */}
			<Modal
				isOpen={addChildBudgetModal.isOpen}
				onClose={addChildBudgetModal.close}
				title={`Ajouter un sous-budget - ${selectedParent?.category_name || ''}`}
				size="sm"
			>
				{loadingAvailableCategories ? (
					<div className="text-center py-8 text-text-secondary">
						Chargement des catégories disponibles...
					</div>
				) : availableChildCategories.length > 0 ? (
					<BudgetForm
						initialData={{ category_id: availableChildCategories[0]?.id }}
						categories={availableChildCategories}
						parentBudget={selectedParent}
						onSubmit={onHandleAddChildBudget}
						onCancel={addChildBudgetModal.close}
						submitLabel="Créer"
					/>
				) : (
					<div className="text-center py-8">
						<p className="text-text-secondary m-0">
							Aucune catégorie disponible pour ce budget parent.
						</p>
						<p className="text-xs text-text-secondary mt-2 m-0">
							Les catégories déjà utilisées ou qui sont elles-mêmes des budgets parents ne peuvent pas être ajoutées.
						</p>
						<button
							type="button"
							onClick={addChildBudgetModal.close}
							className="mt-4 px-5 py-2.5 bg-transparent border border-border rounded-lg text-text-secondary font-medium cursor-pointer transition-all duration-200 hover:bg-white/5 hover:text-text-primary"
						>
							Fermer
						</button>
					</div>
				)}
			</Modal>
		</>
	)
}

const modalStatePropType = PropTypes.shape({
	isOpen: PropTypes.bool.isRequired,
	data: PropTypes.any,
	open: PropTypes.func.isRequired,
	close: PropTypes.func.isRequired
})

BudgetsModals.propTypes = {
	// États des modals
	createModal: modalStatePropType.isRequired,
	editModal: modalStatePropType.isRequired,
	deleteModal: modalStatePropType.isRequired,
	quickTransactionModal: modalStatePropType.isRequired,
	quickBudgetModal: modalStatePropType.isRequired,
	addChildBudgetModal: modalStatePropType.isRequired,
	// Données
	categories: PropTypes.array.isRequired,
	budgets: PropTypes.array.isRequired,
	accounts: PropTypes.array.isRequired,
	availableCategories: PropTypes.array.isRequired,
	availableChildCategories: PropTypes.array.isRequired,
	selectedParent: PropTypes.object,
	// État du formulaire de création
	createForm: PropTypes.shape({
		category_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
	}).isRequired,
	onCreateFormChange: PropTypes.func.isRequired,
	childCategoriesForCreate: PropTypes.array.isRequired,
	subBudgetsToCreate: PropTypes.object.isRequired,
	onCreateCategoryChange: PropTypes.func.isRequired,
	onUpdateSubBudgetToCreate: PropTypes.func.isRequired,
	// État du formulaire de transaction rapide
	quickTransactionForm: PropTypes.shape({
		account_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		description: PropTypes.string,
		date: PropTypes.string
	}).isRequired,
	onQuickTransactionFormChange: PropTypes.func.isRequired,
	// États de chargement
	loadingAvailableCategories: PropTypes.bool,
	// Gestionnaires d'événements
	onHandleCreate: PropTypes.func.isRequired,
	onHandleEdit: PropTypes.func.isRequired,
	onHandleDeleteFromEdit: PropTypes.func.isRequired,
	onHandleDelete: PropTypes.func.isRequired,
	onHandleQuickTransaction: PropTypes.func.isRequired,
	onHandleQuickBudget: PropTypes.func.isRequired,
	onHandleAddChildBudget: PropTypes.func.isRequired,
	// Réinitialiser le formulaire de création
	onClearCreateForm: PropTypes.func.isRequired
}

export default BudgetsModals
