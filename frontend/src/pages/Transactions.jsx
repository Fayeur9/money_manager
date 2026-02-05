import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { transactionsAPI, recurringAPI, accountsAPI, categoriesAPI, budgetsAPI } from '../api/index.js'
import AddIcon from '@mui/icons-material/Add'
import RepeatIcon from '@mui/icons-material/Repeat'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import SearchIcon from '@mui/icons-material/Search'
import { PageHeader } from '../components/layout'
import FormModal from '../components/ui/FormModal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { TransactionForm, RecurringForm } from '../components/forms'
import { formatCurrency, formatDate } from '../utils/formatters'
import { getFrequencyLabel } from '../utils/constants'
import { useModalState } from '../hooks'

function Transactions() {
	const location = useLocation()
	const user = JSON.parse(localStorage.getItem('user'))
	const [transactions, setTransactions] = useState([])
	const [recurringTransactions, setRecurringTransactions] = useState([])
	const [accounts, setAccounts] = useState([])
	const [categories, setCategories] = useState([])
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [hasMore, setHasMore] = useState(true)
	const [offset, setOffset] = useState(0)
	const LIMIT = 50

	// Filtres et recherche
	const [typeFilter, setTypeFilter] = useState('all')
	const [searchQuery, setSearchQuery] = useState('')

	// Modals transactions
	const createModal = useModalState({})
	const editModal = useModalState()

	// Modals récurrentes
	const createRecurringModal = useModalState()
	const editRecurringModal = useModalState()

	// Modal alerte budget (stocke aussi les données du formulaire pour confirmation)
	const [budgetWarningModal, setBudgetWarningModal] = useState({ open: false, data: null, formData: null })

	// Charger les données initiales
	useEffect(() => {
		const fetchData = async () => {
			try {
				const [transRes, recurRes, accountsRes, catRes] = await Promise.all([
					transactionsAPI.getByUser(user.id, { limit: LIMIT, offset: 0 }),
					recurringAPI.getByUser(user.id),
					accountsAPI.getByUser(user.id),
					categoriesAPI.getAll(user.id)
				])
				const loadedAccounts = accountsRes.data.accounts || []
				const loadedCategories = catRes.data.categories || []

				// L'API fait la jointure avec les catégories, mais on préfère les données
			// fraîches des catégories chargées pour avoir les dernières modifications
				const enrichedRecurring = (recurRes.data.recurring_transactions || []).map(rec => {
					// Cherche la catégorie dans la liste chargée
					const category = rec.category_id
						? loadedCategories.find(c => String(c.id) === String(rec.category_id))
						: null
					return {
						...rec,
						// Priorité: catégorie trouvée > données API > null
						category_name: category?.name ?? rec.category_name ?? null,
						category_color: category?.color ?? rec.category_color ?? null,
						category_icon: category?.icon ?? rec.category_icon ?? null
					}
				})

				setTransactions(transRes.data.transactions || [])
				setRecurringTransactions(enrichedRecurring)
				setAccounts(loadedAccounts)
				setCategories(loadedCategories)
				setHasMore((transRes.data.transactions || []).length === LIMIT)
			} catch (err) {
				console.error('Erreur chargement données:', err)
			} finally {
				setLoading(false)
			}
		}
		fetchData()
	}, [user.id])

	// Ouvrir le formulaire de transfert si on vient de la page Comptes
	useEffect(() => {
		if (location.state?.openTransfer && !loading && accounts.length > 0) {
			createModal.open({
				type: 'transfer',
				account_id: accounts[0]?.id || '',
				target_account_id: accounts[1]?.id || ''
			})
			// Effacer l'état pour éviter la réouverture au rafraîchissement
			window.history.replaceState({}, document.title)
		}
	}, [location.state, loading, accounts])

	// Charger plus de transactions
	const loadMore = async () => {
		if (loadingMore || !hasMore) return
		setLoadingMore(true)
		try {
			const newOffset = offset + LIMIT
			const response = await transactionsAPI.getByUser(user.id, { limit: LIMIT, offset: newOffset })
			const newTransactions = response.data.transactions || []
			setTransactions(prev => [...prev, ...newTransactions])
			setOffset(newOffset)
			setHasMore(newTransactions.length === LIMIT)
		} catch (err) {
			console.error('Erreur chargement:', err)
		} finally {
			setLoadingMore(false)
		}
	}

	// Calculer le montant mensuel d'une transaction récurrente
	const getMonthlyAmount = (recurring) => {
		const amount = parseFloat(recurring.amount)
		switch (recurring.frequency) {
			case 'daily': return amount * 30
			case 'weekly': return amount * 4.33
			case 'biweekly': return amount * 2
			case 'monthly': return amount
			case 'quarterly': return amount / 3
			case 'yearly': return amount / 12
			default: return amount
		}
	}

	// Séparer les récurrentes par type
	const recurringIncome = recurringTransactions.filter(r => r.type === 'income' && r.is_active)
	const recurringExpenses = recurringTransactions.filter(r => r.type === 'expense' && r.is_active)
	const totalMonthlyIncome = recurringIncome.reduce((sum, r) => sum + getMonthlyAmount(r), 0)
	const totalMonthlyExpenses = recurringExpenses.reduce((sum, r) => sum + getMonthlyAmount(r), 0)

	// Filtrer les transactions par type et recherche
	const filteredTransactions = useMemo(() => {
		return transactions.filter(tx => {
			const matchesType = typeFilter === 'all' || tx.type === typeFilter
			const matchesSearch = !searchQuery ||
				(tx.description && tx.description.toLowerCase().includes(searchQuery.toLowerCase()))

			return matchesType && matchesSearch
		})
	}, [transactions, typeFilter, searchQuery])

	// Grouper les transactions par mois avec statistiques
	const groupedTransactions = useMemo(() => {
		return filteredTransactions.reduce((groups, tx) => {
			const date = new Date(tx.date)
			const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
			const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
			if (!groups[key]) {
				groups[key] = { label, transactions: [], totalIncome: 0, totalExpenses: 0 }
			}
			groups[key].transactions.push(tx)
			if (tx.type === 'income') {
				groups[key].totalIncome += parseFloat(tx.amount)
			} else if (tx.type === 'expense') {
				groups[key].totalExpenses += parseFloat(tx.amount)
			}
			return groups
		}, {})
	}, [filteredTransactions])

	const sortedMonths = useMemo(() => Object.keys(groupedTransactions).sort().reverse(), [groupedTransactions])

	// Ouvrir modal création transaction
	const openCreateModal = useCallback(() => {
		createModal.open({})
	}, [createModal])

	// Ouvrir modal édition transaction
	const openEditModal = useCallback((tx) => {
		editModal.open(tx)
	}, [editModal])

	// Enrichir une transaction avec les données locales (account, category)
	const enrichTransaction = useCallback((tx) => {
		const account = accounts.find(a => a.id === tx.account_id)
		const category = categories.find(c => c.id === tx.category_id)
		const targetAccount = tx.target_account_id ? accounts.find(a => a.id === tx.target_account_id) : null
		return {
			...tx,
			account_name: account?.name || '',
			account_color: account?.color || '',
			account_icon: account?.icon || '',
			category_name: category?.name || null,
			category_color: category?.color || null,
			category_icon: category?.icon || null,
			target_account_name: targetAccount?.name || null
		}
	}, [accounts, categories])

	// Créer une transaction (avec vérification budget)
	const handleCreateTransaction = async (formData, skipBudgetCheck = false) => {
		// Vérifier le budget si c'est une dépense avec catégorie
		if (!skipBudgetCheck && formData.type === 'expense' && formData.category_id) {
			try {
				const checkRes = await budgetsAPI.checkExceeded(user.id, formData.category_id, formData.amount)
				const budgetData = checkRes.data

				if (budgetData.has_budget && budgetData.would_exceed) {
					setBudgetWarningModal({ open: true, data: budgetData, formData })
					return
				}
			} catch (err) {
				console.error('Erreur vérification budget:', err)
			}
		}

		try {
			const response = await transactionsAPI.create(formData)
			const newTransaction = enrichTransaction(response.data.transaction || response.data)
			// Insérer la transaction au bon endroit selon la date (tri desc)
			setTransactions(prev => {
				const updated = [newTransaction, ...prev]
				return updated.sort((a, b) => new Date(b.date) - new Date(a.date))
			})
			createModal.close()
			setBudgetWarningModal({ open: false, data: null, formData: null })
		} catch (err) {
			console.error('Erreur création:', err)
			alert('Erreur lors de la création')
		}
	}

	// Modifier une transaction
	const handleEditTransaction = async (formData) => {
		if (!editModal.data) return
		try {
			await transactionsAPI.update(editModal.data.id, formData)
			// Mettre à jour localement
			const updatedTransaction = enrichTransaction({ ...editModal.data, ...formData })
			setTransactions(prev => {
				const updated = prev.map(tx => tx.id === editModal.data.id ? updatedTransaction : tx)
				return updated.sort((a, b) => new Date(b.date) - new Date(a.date))
			})
			editModal.close()
		} catch (err) {
			console.error('Erreur modification:', err)
			alert('Erreur lors de la modification')
		}
	}

	// Supprimer une transaction
	const handleDeleteTransaction = async () => {
		if (!editModal.data) return
		try {
			await transactionsAPI.delete(editModal.data.id)
			setTransactions(prev => prev.filter(tx => tx.id !== editModal.data.id))
			editModal.close()
		} catch (err) {
			console.error('Erreur suppression:', err)
			alert('Erreur lors de la suppression')
		}
	}

	// Ouvrir modal création récurrente
	const openCreateRecurringModal = useCallback(() => {
		createRecurringModal.open()
	}, [createRecurringModal])

	// Ouvrir modal édition récurrente
	const openEditRecurringModal = useCallback((recurring) => {
		editRecurringModal.open(recurring)
	}, [editRecurringModal])

	// Enrichir une récurrente avec les données locales
	const enrichRecurring = useCallback((rec) => {
		const account = accounts.find(a => a.id === rec.account_id)
		const category = categories.find(c => c.id === rec.category_id)
		return {
			...rec,
			account_name: account?.name || '',
			account_color: account?.color || '',
			account_icon: account?.icon || '',
			category_name: category?.name || null,
			category_color: category?.color || null,
			category_icon: category?.icon || null
		}
	}, [accounts, categories])

	// Créer une récurrente
	const handleCreateRecurring = async (formData) => {
		try {
			const response = await recurringAPI.create({
				user_id: user.id,
				...formData
			})
			const newRecurring = enrichRecurring(response.data.recurring || response.data)
			setRecurringTransactions(prev => [...prev, newRecurring])
			createRecurringModal.close()
		} catch (err) {
			console.error('Erreur création récurrente:', err)
			alert('Erreur lors de la création')
		}
	}

	// Modifier une récurrente
	const handleEditRecurring = async (formData) => {
		if (!editRecurringModal.data) return
		try {
			await recurringAPI.update(editRecurringModal.data.id, formData)
			// Mettre à jour localement
			const updatedRecurring = enrichRecurring({ ...editRecurringModal.data, ...formData })
			setRecurringTransactions(prev =>
				prev.map(r => r.id === editRecurringModal.data.id ? updatedRecurring : r)
			)
			editRecurringModal.close()
		} catch (err) {
			console.error('Erreur modification récurrente:', err)
			alert('Erreur lors de la modification')
		}
	}

	// Supprimer une récurrente
	const handleDeleteRecurring = async () => {
		if (!editRecurringModal.data) return
		try {
			await recurringAPI.delete(editRecurringModal.data.id)
			setRecurringTransactions(prev => prev.filter(r => r.id !== editRecurringModal.data.id))
			editRecurringModal.close()
		} catch (err) {
			console.error('Erreur suppression récurrente:', err)
			alert('Erreur lors de la suppression')
		}
	}

	if (loading) {
		return (
			<div className="p-8 max-w-[1600px] mx-auto">
				<div className="text-center py-12 text-text-secondary">Chargement...</div>
			</div>
		)
	}

	return (
		<div className="p-8 max-w-[1600px] mx-auto max-md:p-4">
			<PageHeader title="Transactions">
				<button
					className="flex items-center gap-2 py-3 px-5 bg-gradient-to-br from-neon-cyan to-neon-purple border-none rounded-xl text-white font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,240,255,0.4)]"
					onClick={openCreateModal}
				>
					<AddIcon />
					<span>Nouvelle transaction</span>
				</button>
			</PageHeader>

			{/* Layout principal */}
			<div className="flex gap-6 items-stretch max-lg:flex-col">
				{/* Encart récurrentes */}
				<div className="flex-none w-[500px] max-lg:w-full bg-bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-200px)] max-lg:h-auto">
					<div className="flex items-center justify-between py-3.5 px-5 bg-gradient-to-br from-neon-cyan/10 to-neon-cyan/[0.02] border-b border-border">
						<div className="flex items-center gap-3">
							<RepeatIcon className="text-neon-cyan" />
							<h2 className="m-0 text-lg text-text-primary">Récurrentes mensuelles</h2>
						</div>
						<button
							className="w-8 h-8 rounded-lg border border-border bg-bg-secondary text-neon-cyan cursor-pointer flex items-center justify-center transition-all duration-200 hover:border-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_10px_rgba(0,240,255,0.3)]"
							onClick={openCreateRecurringModal}
							title="Ajouter une récurrente"
						>
							<AddIcon fontSize="small" />
						</button>
					</div>

					<div className="flex flex-col p-5 gap-2 max-md:flex-col flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neon-cyan/30 scrollbar-track-transparent">
						{/* Revenus */}
						<div className="flex-1">
							<h3 className="m-0 mb-3 text-xs uppercase tracking-wider text-green-500">Revenus</h3>
							<div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-neon-cyan/30 scrollbar-track-transparent pr-2">
								{recurringIncome.length === 0 ? (
									<p className="text-text-secondary text-sm italic m-0">Aucun revenu récurrent</p>
								) : (
									recurringIncome.map(r => (
										<div
											key={r.id}
											className="flex items-center gap-2 p-2 px-3 bg-bg-secondary rounded-lg cursor-pointer hover:bg-neon-cyan/5"
											onClick={() => openEditRecurringModal(r)}
										>
											<div className="flex items-center gap-3 flex-1 min-w-0">
												<div
													className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
													style={{ backgroundColor: r.category_color || '#6b7280' }}
												>
													<img
														src={r.category_icon || '/default/icons/dots.png'}
														alt=""
														className="w-5 h-5 object-contain"
														onError={(e) => { e.target.src = '/default/icons/dots.png' }}
													/>
												</div>
												<div className="flex flex-col gap-0.5 min-w-0 flex-1">
													<span className="text-sm text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{r.description}</span>
													<span className="text-xs text-text-secondary">{getFrequencyLabel(r.frequency)}</span>
												</div>
											</div>
											<span className="font-semibold text-sm text-green-500 whitespace-nowrap shrink-0">
												+{formatCurrency(getMonthlyAmount(r))}
											</span>
										</div>
									))
								)}
							</div>
							<div className="flex justify-between items-center pt-3 mt-3 border-t border-border font-semibold">
								<span className="text-text-secondary text-xs uppercase tracking-wider">Total</span>
								<span className="text-green-500">+{formatCurrency(totalMonthlyIncome)}</span>
							</div>
						</div>

						<div className="w-full h-px bg-border max-md:w-full max-md:h-px" />

						{/* Dépenses */}
						<div className="flex-1">
							<h3 className="m-0 mb-3 text-xs uppercase tracking-wider text-red-500">Dépenses</h3>
							<div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-neon-cyan/30 scrollbar-track-transparent pr-2">
								{recurringExpenses.length === 0 ? (
									<p className="text-text-secondary text-sm italic m-0">Aucune dépense récurrente</p>
								) : (
									recurringExpenses.map(r => (
										<div
											key={r.id}
											className="flex items-center gap-2 p-2 px-3 bg-bg-secondary rounded-lg cursor-pointer hover:bg-neon-cyan/5"
											onClick={() => openEditRecurringModal(r)}
										>
											<div className="flex items-center gap-3 flex-1 min-w-0">
												<div
													className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
													style={{ backgroundColor: r.category_color || '#6b7280' }}
												>
													<img
														src={r.category_icon || '/default/icons/dots.png'}
														alt=""
														className="w-5 h-5 object-contain"
														onError={(e) => { e.target.src = '/default/icons/dots.png' }}
													/>
												</div>
												<div className="flex flex-col gap-0.5 min-w-0 flex-1">
													<span className="text-sm text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{r.description}</span>
													<span className="text-xs text-text-secondary">{getFrequencyLabel(r.frequency)}</span>
												</div>
											</div>
											<span className="font-semibold text-sm text-red-500 whitespace-nowrap shrink-0">
												-{formatCurrency(getMonthlyAmount(r))}
											</span>
										</div>
									))
								)}
							</div>
							<div className="flex justify-between items-center pt-3 mt-3 border-t border-border font-semibold">
								<span className="text-text-secondary text-xs uppercase tracking-wider">Total</span>
								<span className="text-red-500">-{formatCurrency(totalMonthlyExpenses)}</span>
							</div>
						</div>
					</div>

					<div className="flex justify-between items-center py-3.5 px-5 bg-bg-secondary border-t border-border font-semibold">
						<span className="text-text-primary">Balance mensuelle</span>
						<span className={clsx('text-lg', totalMonthlyIncome - totalMonthlyExpenses >= 0 ? 'text-green-500' : 'text-red-500')}>
							{totalMonthlyIncome - totalMonthlyExpenses >= 0 ? '+' : ''}
							{formatCurrency(totalMonthlyIncome - totalMonthlyExpenses)}
						</span>
					</div>
				</div>

				{/* Liste des transactions */}
				<div className="flex-1 min-w-0 bg-bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-200px)] max-lg:h-auto">
					<h2 className="m-0 p-4 px-6 text-lg text-text-primary border-b border-border">Historique des transactions</h2>

					{/* Filtres et recherche */}
					<div className="flex gap-4 p-4 px-6 border-b border-border flex-wrap max-md:flex-col">
						<div className="flex items-center gap-2 flex-1 min-w-[200px] py-2 px-4 rounded-lg border border-border bg-bg-secondary transition-all duration-200 focus-within:border-neon-cyan focus-within:shadow-[0_0_0_3px_rgba(0,240,255,0.1)]">
							<SearchIcon className="text-text-secondary text-xl" />
							<input
								type="text"
								placeholder="Rechercher une description..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="flex-1 border-none bg-transparent text-text-primary text-sm outline-none placeholder:text-text-secondary"
							/>
						</div>
						<div className="flex gap-2 max-md:flex-wrap">
							{['all', 'expense', 'income', 'transfer'].map((type) => (
								<button
									key={type}
									className={clsx(
										'py-2 px-4 rounded-lg border bg-bg-secondary text-sm font-medium cursor-pointer transition-all duration-200 max-md:flex-1 max-md:min-w-[calc(50%-0.25rem)] max-md:text-center',
										typeFilter === type
											? type === 'expense' ? 'border-red-500 bg-red-500/10 text-red-500'
												: type === 'income' ? 'border-green-500 bg-green-500/10 text-green-500'
													: type === 'transfer' ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
														: 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
											: 'border-border text-text-secondary hover:border-text-secondary hover:text-text-primary'
									)}
									onClick={() => setTypeFilter(type)}
								>
									{type === 'all' ? 'Tout' : type === 'expense' ? 'Dépenses' : type === 'income' ? 'Revenus' : 'Transferts'}
								</button>
							))}
						</div>
					</div>

					<div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neon-cyan/30 scrollbar-track-transparent">
						{filteredTransactions.length === 0 ? (
							<div className="text-center py-12 text-text-secondary">
								{transactions.length === 0 ? 'Aucune transaction' : 'Aucune transaction trouvée'}
							</div>
						) : (
							sortedMonths.map(monthKey => {
								const monthData = groupedTransactions[monthKey]
								return (
									<div key={monthKey} className="border-b border-border last:border-b-0">
										<div className="sticky top-0 z-10 py-3 px-6 bg-bg-secondary border-b border-border flex justify-between items-center flex-wrap gap-2 max-md:flex-col max-md:items-start">
											<span className="font-semibold text-sm text-neon-cyan capitalize">{monthData.label}</span>
											<div className="flex items-center gap-4 text-xs max-md:flex-wrap max-md:gap-3">
												<span className="text-text-secondary">{monthData.transactions.length} transaction{monthData.transactions.length > 1 ? 's' : ''}</span>
												<span className="text-green-500 font-semibold">+{formatCurrency(monthData.totalIncome)}</span>
												<span className="text-red-500 font-semibold">-{formatCurrency(monthData.totalExpenses)}</span>
											</div>
										</div>
										<div className="flex flex-col">
											{monthData.transactions.map(tx => (
												<div
													key={tx.id}
													className="flex items-center gap-4 py-2.5 px-6 my-1 mx-2 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-neon-cyan/[0.03] border-b border-white/[0.03] last:border-b-0 max-md:py-3 max-md:px-4"
													onClick={() => openEditModal(tx)}
												>
													{tx.type === 'transfer' ? (
														<div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-neon-cyan to-neon-purple">
															<SwapHorizIcon className="w-5 h-5 text-white" />
														</div>
													) : (
														<div
															className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
															style={{ backgroundColor: tx.category_color || '#6b7280' }}
														>
															<img
																src={tx.category_icon || '/default/icons/dots.png'}
																alt=""
																className="w-5 h-5 object-contain"
																onError={(e) => { e.target.src = '/default/icons/dots.png' }}
															/>
														</div>
													)}
													<div className="flex-1 min-w-0">
														<span className="block text-base text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
															{tx.type === 'transfer'
																? (tx.description || 'Transfert')
																: (tx.description || tx.category_name || 'Sans description')}
														</span>
														<span className="text-xs text-text-secondary">
															{formatDate(tx.date)} • {tx.type === 'transfer'
																? `${tx.account_name} → ${tx.target_account_name}`
																: tx.account_name}
														</span>
													</div>
													<div className="text-right px-4 max-md:px-2">
														<span className={clsx(
															'font-semibold text-base',
															tx.type === 'income' ? 'text-green-500' : tx.type === 'expense' ? 'text-red-500' : 'text-neon-cyan'
														)}>
															{tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
															{formatCurrency(tx.amount)}
														</span>
													</div>
												</div>
											))}
										</div>
									</div>
								)
							})
						)}
						{hasMore && (
							<button
								className="w-full py-4 bg-transparent border-none text-neon-cyan font-semibold cursor-pointer transition-all duration-200 hover:bg-neon-cyan/10 disabled:text-text-secondary disabled:cursor-not-allowed"
								onClick={loadMore}
								disabled={loadingMore}
							>
								{loadingMore ? 'Chargement...' : 'Charger plus'}
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Modal création transaction */}
			<FormModal
				isOpen={createModal.isOpen}
				onClose={createModal.close}
				title="Nouvelle transaction"
				FormComponent={TransactionForm}
				formProps={{
					initialData: createModal.data || {},
					accounts,
					categories,
					onSubmit: handleCreateTransaction,
					submitLabel: "Créer"
				}}
			/>

			{/* Modal édition transaction */}
			<FormModal
				isOpen={editModal.isOpen && !!editModal.data}
				onClose={editModal.close}
				title="Modifier la transaction"
				FormComponent={TransactionForm}
				formProps={{
					initialData: editModal.data ? {
						type: editModal.data.type,
						amount: editModal.data.amount,
						date: editModal.data.date,
						account_id: editModal.data.account_id,
						target_account_id: editModal.data.target_account_id || '',
						category_id: editModal.data.category_id || '',
						description: editModal.data.description || ''
					} : {},
					accounts,
					categories,
					onSubmit: handleEditTransaction,
					onDelete: handleDeleteTransaction,
					submitLabel: "Enregistrer"
				}}
			/>

			{/* Modal création récurrente */}
			<FormModal
				isOpen={createRecurringModal.isOpen}
				onClose={createRecurringModal.close}
				title="Nouvelle récurrente"
				FormComponent={RecurringForm}
				formProps={{
					accounts,
					categories,
					onSubmit: handleCreateRecurring,
					submitLabel: "Créer"
				}}
			/>

			{/* Modal édition récurrente */}
			<FormModal
				isOpen={editRecurringModal.isOpen && !!editRecurringModal.data}
				onClose={editRecurringModal.close}
				title="Modifier la récurrente"
				FormComponent={RecurringForm}
				formProps={{
					initialData: editRecurringModal.data ? {
						type: editRecurringModal.data.type,
						amount: editRecurringModal.data.amount,
						frequency: editRecurringModal.data.frequency,
						start_date: editRecurringModal.data.start_date,
						account_id: editRecurringModal.data.account_id,
						category_id: editRecurringModal.data.category_id || '',
						description: editRecurringModal.data.description || '',
						is_active: editRecurringModal.data.is_active
					} : {},
					accounts,
					categories,
					onSubmit: handleEditRecurring,
					onDelete: handleDeleteRecurring,
					submitLabel: "Enregistrer"
				}}
			/>

			{/* Modal alerte dépassement budget */}
			<ConfirmModal
				isOpen={budgetWarningModal.open && !!budgetWarningModal.data}
				onClose={() => setBudgetWarningModal({ open: false, data: null, formData: null })}
				onConfirm={() => handleCreateTransaction(budgetWarningModal.formData, true)}
				title="Attention : Dépassement de budget"
				confirmText="Confirmer quand même"
				variant="warning"
			>
				{budgetWarningModal.data && (
					<>
						<p className="m-0 mb-6 text-text-secondary leading-relaxed">
							Cette dépense va faire dépasser votre budget pour la catégorie <strong className="text-text-primary">{budgetWarningModal.data.category_name}</strong>.
						</p>
						<div className="bg-bg-secondary rounded-xl p-4">
							<div className="flex justify-between items-center py-2 text-sm text-text-secondary border-b border-border">
								<span>Budget mensuel</span>
								<span className="font-semibold text-text-primary">{formatCurrency(budgetWarningModal.data.budget_amount)}</span>
							</div>
							<div className="flex justify-between items-center py-2 text-sm text-text-secondary border-b border-border">
								<span>Déjà dépensé</span>
								<span className="font-semibold text-text-primary">{formatCurrency(budgetWarningModal.data.current_spent)}</span>
							</div>
							<div className="flex justify-between items-center py-2 text-sm text-text-secondary border-b border-border">
								<span>Restant avant cette dépense</span>
								<span className={clsx('font-semibold', budgetWarningModal.data.remaining_before >= 0 ? 'text-green-500' : 'text-red-500')}>
									{formatCurrency(budgetWarningModal.data.remaining_before)}
								</span>
							</div>
							<div className="flex justify-between items-center py-3 -mx-4 px-4 text-sm bg-red-500/5">
								<span className="text-text-secondary">Nouvelle dépense</span>
								<span className="font-semibold text-red-500">-{formatCurrency(budgetWarningModal.data.new_expense)}</span>
							</div>
							<div className="flex justify-between items-center py-3 -mx-4 px-4 -mb-4 text-sm bg-red-500/10 rounded-b-xl">
								<span className="text-text-secondary">Dépassement</span>
								<span className="font-semibold text-red-500">-{formatCurrency(budgetWarningModal.data.excess_amount)}</span>
							</div>
						</div>
					</>
				)}
			</ConfirmModal>

			</div>
	)
}

export default Transactions
