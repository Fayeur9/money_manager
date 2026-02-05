import { useState, useEffect, useMemo, useCallback } from 'react'
import { budgetsAPI, categoriesAPI, transactionsAPI, accountsAPI } from '../api/index.js'
import { PageHeader } from '../components/layout'
import { BudgetsSidebar, BudgetsContent, BudgetsModals } from '../components/budgets'
import { useModalState } from '../hooks'

function Budgets() {
	const user = JSON.parse(localStorage.getItem('user'))
	const [budgets, setBudgets] = useState([])
	const [categories, setCategories] = useState([])
	const [loading, setLoading] = useState(true)

	// Budget parent sélectionné (ou groupe de budgets enfants)
	const [selectedParent, setSelectedParent] = useState(null)

	// Transactions du mois pour le budget sélectionné
	const [transactions, setTransactions] = useState([])
	const [loadingTransactions, setLoadingTransactions] = useState(false)

	// Accordéons ouverts (par category_id)
	const [openAccordions, setOpenAccordions] = useState({})

	// Modals
	const createModal = useModalState()
	const editModal = useModalState()
	const deleteModal = useModalState()

	// Formulaire création (garde sa logique complexe avec sous-budgets)
	const [createForm, setCreateForm] = useState({ category_id: '', amount: '' })

	// Sous-catégories pour création rapide de sous-budgets
	const [childCategoriesForCreate, setChildCategoriesForCreate] = useState([])
	const [subBudgetsToCreate, setSubBudgetsToCreate] = useState({})

	// Transaction rapide
	const [accounts, setAccounts] = useState([])
	const quickTransactionModal = useModalState()
	const [quickTransactionForm, setQuickTransactionForm] = useState({
		account_id: '',
		amount: '',
		description: '',
		date: new Date().toISOString().split('T')[0]
	})

	// Création rapide de budget pour les catégories enfants
	const quickBudgetModal = useModalState()

	// Ajouter un budget enfant depuis la vue parent
	const addChildBudgetModal = useModalState()

	// Charger les données
	useEffect(() => {
		const fetchData = async () => {
			try {
				const [budgetsRes, categoriesRes, accountsRes] = await Promise.all([
					budgetsAPI.getByUser(user.id),
					categoriesAPI.getAll(user.id),
					accountsAPI.getByUser(user.id)
				])
				const loadedBudgets = budgetsRes.data.budgets || []
				setBudgets(loadedBudgets)
				const expenseCategories = (categoriesRes.data.categories || []).filter(c => c.type === 'expense')
				setCategories(expenseCategories)
				setAccounts(accountsRes.data.accounts || [])
			} catch (err) {
				console.error('Erreur chargement données:', err)
			} finally {
				setLoading(false)
			}
		}
		fetchData()
	}, [user.id])

	// Construire la hiérarchie des budgets pour la sidebar
	// Hiérarchie basée sur parent_budget_id (indépendante des catégories)
	const parentHierarchy = useMemo(() => {
		// Budgets parents = ceux sans parent_budget_id
		const parentBudgets = budgets.filter(b => !b.parent_budget_id)
		// Budgets enfants = ceux avec un parent_budget_id
		const childBudgets = budgets.filter(b => b.parent_budget_id)
		const hierarchy = []

		// Ajouter les budgets parents avec leurs enfants
		parentBudgets.forEach(parent => {
			const children = childBudgets.filter(child => child.parent_budget_id === parent.id)
			// Le spent du parent est calculé côté backend (somme des enfants si il en a)
			hierarchy.push({
				...parent,
				children,
				totalSpent: parent.spent,
				isParent: true
			})
		})

		return hierarchy
	}, [budgets])

	// Sélectionner le premier parent par défaut
	useEffect(() => {
		if (parentHierarchy.length > 0 && !selectedParent) {
			setSelectedParent(parentHierarchy[0])
		}
	}, [parentHierarchy.length])

	// Mettre à jour selectedParent si les budgets changent
	useEffect(() => {
		if (selectedParent && budgets.length > 0) {
			const updated = parentHierarchy.find(h => h.id === selectedParent.id)
			if (updated) {
				setSelectedParent(updated)
			} else if (parentHierarchy.length > 0) {
				setSelectedParent(parentHierarchy[0])
			} else {
				setSelectedParent(null)
			}
		}
	}, [budgets])

	// Charger les transactions quand le parent sélectionné change
	useEffect(() => {
		if (!selectedParent) {
			setTransactions([])
			return
		}

		const fetchTransactions = async () => {
			setLoadingTransactions(true)
			try {
				const now = new Date()
				const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
				const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

				const formatDateParam = (d) => {
					const year = d.getFullYear()
					const month = String(d.getMonth() + 1).padStart(2, '0')
					const day = String(d.getDate()).padStart(2, '0')
					return `${year}-${month}-${day}`
				}

				const res = await transactionsAPI.getByUser(user.id, {
					category_id: selectedParent.category_id,
					start_date: formatDateParam(startOfMonth),
					end_date: formatDateParam(endOfMonth),
					include_children: true,
					limit: 500
				})
				setTransactions(res.data.transactions || [])
			} catch (err) {
				console.error('Erreur chargement transactions:', err)
				setTransactions([])
			} finally {
				setLoadingTransactions(false)
			}
		}
		fetchTransactions()
	}, [selectedParent?.category_id, user.id])

	// Construire les options triées hiérarchiquement pour le select
	const availableCategories = useMemo(() => {
		const available = categories.filter(cat => !budgets.some(b => b.category_id === cat.id))
		const parents = available.filter(c => !c.parent_id)
		const result = []

		parents.forEach(parent => {
			result.push(parent)
			const children = available.filter(c => c.parent_id === parent.id)
			children.forEach(child => result.push(child))
		})

		const orphans = available.filter(c => c.parent_id && !parents.some(p => p.id === c.parent_id))
		orphans.forEach(orphan => result.push(orphan))

		return result
	}, [categories, budgets])

	// Ouvrir modal création
	const openCreateModal = useCallback(() => {
		setCreateForm({ category_id: '', amount: '' })
		setChildCategoriesForCreate([])
		setSubBudgetsToCreate({})
		createModal.open()
	}, [createModal])

	// Charger les sous-catégories quand on sélectionne une catégorie parente
	const handleCreateCategoryChange = (categoryId) => {
		setCreateForm({ ...createForm, category_id: categoryId, amount: '' })

		// Chercher les sous-catégories de cette catégorie
		const childCats = categories.filter(c => c.parent_id === categoryId)

		if (childCats.length > 0) {
			setChildCategoriesForCreate(childCats)
			// Initialiser les sub-budgets (tous décochés par défaut)
			const initialSubBudgets = {}
			childCats.forEach(child => {
				// Vérifier si un budget existe déjà pour cette catégorie (en tant que parent)
				const existingBudget = budgets.find(b => b.category_id === child.id && !b.parent_budget_id)
				initialSubBudgets[child.id] = {
					enabled: false,
					amount: '',
					existingBudget: existingBudget || null
				}
			})
			setSubBudgetsToCreate(initialSubBudgets)
		} else {
			setChildCategoriesForCreate([])
			setSubBudgetsToCreate({})
		}
	}

	// Mettre à jour un sub-budget dans le formulaire de création
	const updateSubBudgetToCreate = (categoryId, field, value) => {
		setSubBudgetsToCreate(prev => ({
			...prev,
			[categoryId]: { ...prev[categoryId], [field]: value }
		}))
	}

	// Créer un budget parent (et optionnellement ses sous-budgets)
	const handleCreate = async () => {
		// Collecter les sous-budgets à créer
		const enabledSubBudgets = Object.entries(subBudgetsToCreate).filter(
			([, data]) => data.enabled && data.amount && !data.existingBudget
		)

		// Vérifier qu'on a au moins un budget (principal ou sous-budget)
		const hasMainBudget = createForm.category_id && createForm.amount
		if (!hasMainBudget && enabledSubBudgets.length === 0) {
			alert('Veuillez définir au moins un budget (principal ou sous-catégorie)')
			return
		}

		try {
			let parentBudgetId = null

			// Créer le budget principal d'abord (si défini)
			if (hasMainBudget) {
				const res = await budgetsAPI.create({
					user_id: user.id,
					category_id: createForm.category_id,
					amount: parseFloat(createForm.amount)
				})
				parentBudgetId = res.data.budget?.id
			}

			// Créer les sous-budgets si on a un budget parent
			if (parentBudgetId && enabledSubBudgets.length > 0) {
				const subBudgetPromises = enabledSubBudgets.map(([categoryId, data]) =>
					budgetsAPI.create({
						user_id: user.id,
						category_id: categoryId,
						amount: parseFloat(data.amount),
						parent_budget_id: parentBudgetId
					})
				)
				await Promise.all(subBudgetPromises)
			}

			// Recharger les budgets
			const res = await budgetsAPI.getByUser(user.id)
			setBudgets(res.data.budgets || [])
			createModal.close()
			setChildCategoriesForCreate([])
			setSubBudgetsToCreate({})
		} catch (err) {
			console.error('Erreur création budget:', err)
			alert('Erreur lors de la création du budget')
		}
	}

	// Ouvrir modal édition
	const openEditModal = useCallback((budget) => {
		editModal.open(budget)
	}, [editModal])

	// Modifier un budget
	const handleEdit = async (formData) => {
		if (!editModal.data) return
		try {
			await budgetsAPI.update(editModal.data.id, {
				category_id: formData.category_id,
				amount: formData.amount
			})
			// Mettre à jour localement (spent ne change pas)
			setBudgets(prev => prev.map(b =>
				b.id === editModal.data.id
					? { ...b, budget_amount: parseFloat(formData.amount) }
					: b
			))
			editModal.close()
		} catch (err) {
			console.error('Erreur modification budget:', err)
			alert('Erreur lors de la modification du budget')
		}
	}

	// Supprimer un budget depuis le formulaire d'édition
	const handleDeleteFromEdit = async () => {
		if (!editModal.data) return
		try {
			await budgetsAPI.delete(editModal.data.id)
			const res = await budgetsAPI.getByUser(user.id)
			setBudgets(res.data.budgets || [])
			editModal.close()
		} catch (err) {
			console.error('Erreur suppression budget:', err)
			alert('Erreur lors de la suppression du budget')
		}
	}

	// Supprimer un budget (la cascade des enfants est gérée côté backend)
	const handleDelete = async () => {
		if (!deleteModal.data) return
		try {
			const budgetToDelete = deleteModal.data

			// La suppression en cascade est gérée par la FK ON DELETE CASCADE côté backend
			await budgetsAPI.delete(budgetToDelete.id)

			// Recharger tous les budgets pour refléter la cascade
			const res = await budgetsAPI.getByUser(user.id)
			setBudgets(res.data.budgets || [])
			deleteModal.close()
		} catch (err) {
			console.error('Erreur suppression budget:', err)
			alert('Erreur lors de la suppression du budget')
		}
	}

	// Ouvrir modal création rapide transaction
	const openQuickTransactionModal = (category) => {
		setQuickTransactionForm({
			account_id: accounts[0]?.id || '',
			amount: '',
			description: '',
			date: new Date().toISOString().split('T')[0]
		})
		quickTransactionModal.open(category)
	}

	// Créer une transaction rapide
	const handleQuickTransaction = async () => {
		if (!quickTransactionModal.data || !quickTransactionForm.amount || !quickTransactionForm.account_id) return
		try {
			await transactionsAPI.create({
				account_id: quickTransactionForm.account_id,
				category_id: quickTransactionModal.data.id,
				type: 'expense',
				amount: parseFloat(quickTransactionForm.amount),
				description: quickTransactionForm.description || quickTransactionModal.data.name,
				date: quickTransactionForm.date
			})
			// Recharger les transactions du mois
			if (selectedParent) {
				const now = new Date()
				const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
				const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
				const transRes = await transactionsAPI.getByUser(user.id, {
					category_id: selectedParent.category_id,
					start_date: startDate,
					end_date: endDate,
					include_children: true
				})
				setTransactions(transRes.data.transactions || [])
			}
			// Recharger les budgets pour mettre à jour le spent
			const budgetsRes = await budgetsAPI.getByUser(user.id)
			setBudgets(budgetsRes.data.budgets || [])
			quickTransactionModal.close()
		} catch (err) {
			console.error('Erreur création transaction:', err)
			alert('Erreur lors de la création de la transaction')
		}
	}

	// Ouvrir modal création rapide budget
	const openQuickBudgetModal = (category) => {
		quickBudgetModal.open(category)
	}

	// Créer un budget rapide pour une sous-catégorie
	const handleQuickBudget = async (formData) => {
		if (!quickBudgetModal.data) return
		try {
			const res = await budgetsAPI.create({
				user_id: user.id,
				category_id: quickBudgetModal.data.id,
				amount: formData.amount
			})
			// Ajouter localement le nouveau budget (spent=0 pour un nouveau)
			const category = quickBudgetModal.data
			const newBudget = {
				id: res.data.budget?.id,
				user_id: user.id,
				category_id: category.id,
				budget_amount: parseFloat(formData.amount),
				spent: 0,
				parent_budget_id: null,
				category_name: category.name,
				category_icon: category.icon,
				category_color: category.color
			}
			setBudgets(prev => [...prev, newBudget])
			quickBudgetModal.close()
		} catch (err) {
			console.error('Erreur création budget:', err)
			alert('Erreur lors de la création du budget')
		}
	}

	// État pour les catégories disponibles pour créer un budget enfant
	const [availableChildCategories, setAvailableChildCategories] = useState([])
	const [loadingAvailableCategories, setLoadingAvailableCategories] = useState(false)

	// Ouvrir modal ajout budget enfant
	const openAddChildBudgetModal = async () => {
		if (!selectedParent) return
		setLoadingAvailableCategories(true)
		addChildBudgetModal.open()
		try {
			const res = await budgetsAPI.getAvailableCategories(selectedParent.id, user.id)
			const cats = res.data.categories || []
			setAvailableChildCategories(cats)
		} catch (err) {
			console.error('Erreur chargement catégories disponibles:', err)
			setAvailableChildCategories([])
		} finally {
			setLoadingAvailableCategories(false)
		}
	}

	// Créer un budget enfant depuis la vue parent
	const handleAddChildBudget = async (formData) => {
		if (!selectedParent) return
		try {
			const res = await budgetsAPI.create({
				user_id: user.id,
				category_id: formData.category_id,
				amount: formData.amount,
				parent_budget_id: selectedParent.id
			})
			// Ajouter localement le nouveau budget enfant (spent=0 pour un nouveau)
			const category = availableChildCategories.find(c => c.id === formData.category_id) ||
							categories.find(c => c.id === formData.category_id)
			const newBudget = {
				id: res.data.budget?.id,
				user_id: user.id,
				category_id: formData.category_id,
				budget_amount: parseFloat(formData.amount),
				spent: 0,
				parent_budget_id: selectedParent.id,
				category_name: category?.name || '',
				category_icon: category?.icon || '/default/icons/dots.png',
				category_color: category?.color || '#6b7280'
			}
			setBudgets(prev => [...prev, newBudget])
			addChildBudgetModal.close()
		} catch (err) {
			console.error('Erreur création budget:', err)
			alert('Erreur lors de la création du budget')
		}
	}

	// Basculer l'accordéon
	const toggleAccordion = useCallback((categoryId) => {
		setOpenAccordions(prev => ({
			...prev,
			[categoryId]: !prev[categoryId]
		}))
	}, [])

	// Calculer les totaux globaux (seulement les budgets parents pour éviter les doublons)
	const parentOnlyBudgets = budgets.filter(b => !b.parent_budget_id)
	const totalBudget = parentOnlyBudgets.reduce((sum, b) => sum + b.budget_amount, 0)
	const totalSpent = parentOnlyBudgets.reduce((sum, b) => sum + b.spent, 0)

	// Obtenir le mois courant
	const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

	// Récupérer les budgets enfants avec leurs transactions pour le parent sélectionné
	const childBudgetsWithTransactions = useMemo(() => {
		if (!selectedParent || !selectedParent.children) return []

		return selectedParent.children.map(childBudget => {
			// Trouver la catégorie correspondante
			const category = categories.find(c => c.id === childBudget.category_id)
			// Filtrer les transactions de cette catégorie
			const childTransactions = transactions.filter(t => t.category_id === childBudget.category_id)

			return {
				category: category || {
					id: childBudget.category_id,
					name: childBudget.category_name,
					icon: childBudget.category_icon,
					color: childBudget.category_color
				},
				budget: childBudget,
				transactions: childTransactions,
				spent: childBudget.spent
			}
		})
	}, [selectedParent, categories, transactions])

	// Vérifier si le budget parent n'a pas d'enfants
	const hasNoChildren = selectedParent && (!selectedParent.children || selectedParent.children.length === 0)

	// Transactions directes de la catégorie parente (toujours calculées pour afficher dans l'accordéon)
	const parentDirectTransactions = transactions.filter(t => t.category_id === selectedParent?.category_id)

	if (loading) {
		return (
			<div className="p-8 max-w-[1600px] mx-auto max-md:p-4">
				<div className="text-center py-12 text-text-secondary">Chargement...</div>
			</div>
		)
	}

	return (
		<div className="p-8 max-w-[1600px] mx-auto max-md:p-4">
			<PageHeader title="Budgets" className="mb-6" />
			<div className="flex h-[calc(100vh-180px)] gap-4 max-md:flex-col max-md:h-auto max-md:gap-2">
			{/* Sidebar */}
			<BudgetsSidebar
				parentHierarchy={parentHierarchy}
				selectedParent={selectedParent}
				onSelectParent={setSelectedParent}
				totalBudget={totalBudget}
				totalSpent={totalSpent}
				currentMonth={currentMonth}
				showAddButton={availableCategories.length > 0}
				onAddClick={openCreateModal}
			/>

			{/* Main content */}
			<div className="flex-1 flex flex-col overflow-hidden bg-bg-card border border-border rounded-2xl max-md:overflow-visible">
				<BudgetsContent
					selectedParent={selectedParent}
					childBudgetsWithTransactions={childBudgetsWithTransactions}
					parentDirectTransactions={parentDirectTransactions}
					hasNoChildren={hasNoChildren}
					loadingTransactions={loadingTransactions}
					currentMonth={currentMonth}
					openAccordions={openAccordions}
					onToggleAccordion={toggleAccordion}
					onOpenEditModal={openEditModal}
					onOpenDeleteModal={deleteModal.open}
					onOpenAddChildBudgetModal={openAddChildBudgetModal}
					onOpenQuickTransactionModal={openQuickTransactionModal}
					onOpenQuickBudgetModal={openQuickBudgetModal}
					onOpenCreateModal={openCreateModal}
					availableCategoriesCount={availableCategories.length}
				/>
			</div>

			{/* Modals */}
			<BudgetsModals
				createModal={createModal}
				editModal={editModal}
				deleteModal={deleteModal}
				quickTransactionModal={quickTransactionModal}
				quickBudgetModal={quickBudgetModal}
				addChildBudgetModal={addChildBudgetModal}
				categories={categories}
				budgets={budgets}
				accounts={accounts}
				availableCategories={availableCategories}
				availableChildCategories={availableChildCategories}
				selectedParent={selectedParent}
				createForm={createForm}
				onCreateFormChange={setCreateForm}
				childCategoriesForCreate={childCategoriesForCreate}
				subBudgetsToCreate={subBudgetsToCreate}
				onCreateCategoryChange={handleCreateCategoryChange}
				onUpdateSubBudgetToCreate={updateSubBudgetToCreate}
				quickTransactionForm={quickTransactionForm}
				onQuickTransactionFormChange={setQuickTransactionForm}
				loadingAvailableCategories={loadingAvailableCategories}
				onHandleCreate={handleCreate}
				onHandleEdit={handleEdit}
				onHandleDeleteFromEdit={handleDeleteFromEdit}
				onHandleDelete={handleDelete}
				onHandleQuickTransaction={handleQuickTransaction}
				onHandleQuickBudget={handleQuickBudget}
				onHandleAddChildBudget={handleAddChildBudget}
				onClearCreateForm={() => {
					setChildCategoriesForCreate([])
					setSubBudgetsToCreate({})
				}}
			/>
			</div>
		</div>
	)
}

export default Budgets
