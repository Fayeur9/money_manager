import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { accountsAPI, transactionsAPI, categoriesAPI, iconsAPI } from '../api/index.js'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import AddIcon from '@mui/icons-material/Add'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { PageHeader } from '../components/layout'
import FormModal from '../components/ui/FormModal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { AccountForm, TransactionForm } from '../components/forms'
import { formatCurrency, formatDateWithYear } from '../utils/formatters'
import { getAccountTypeLabel } from '../utils/constants'
import { useModalState } from '../hooks'

function Comptes() {
	const user = JSON.parse(localStorage.getItem('user'))
	const [accounts, setAccounts] = useState([])
	const [categories, setCategories] = useState([])
	const [expandedAccountId, setExpandedAccountId] = useState(null)
	const [accountTransactions, setAccountTransactions] = useState({})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	// Icônes
	const [defaultIcons, setDefaultIcons] = useState([])
	const [userIcons, setUserIcons] = useState([])
	const [uploadingIcon, setUploadingIcon] = useState(false)
	const [deleteIconModal, setDeleteIconModal] = useState({ open: false, icon: null, isEdit: false })

	// Modals
	const deleteModal = useModalState()
	const editModal = useModalState()
	const createModal = useModalState()
	const transferModal = useModalState()

	// Charger les comptes et catégories
	useEffect(() => {
		const fetchData = async () => {
			try {
				const [accountsRes, categoriesRes] = await Promise.all([
					accountsAPI.getByUser(user.id),
					categoriesAPI.getAll(user.id)
				])
				setAccounts(accountsRes.data.accounts)
				setCategories(categoriesRes.data.categories || [])
			} catch (err) {
				console.error('Erreur chargement données:', err)
				setError('Impossible de charger les données')
			} finally {
				setLoading(false)
			}
		}
		fetchData()
	}, [user.id])

	// Charger les icônes
	useEffect(() => {
		const fetchIcons = async () => {
			try {
				const [defaultRes, userRes] = await Promise.all([
					iconsAPI.getDefaults(),
					iconsAPI.getByUser(user.id)
				])
				setDefaultIcons(defaultRes.data.icons)
				setUserIcons(userRes.data.icons)
			} catch (err) {
				console.error('Erreur chargement icônes:', err)
			}
		}
		fetchIcons()
	}, [user.id])

	// Charger les transactions d'un compte
	const loadTransactions = async (accountId) => {
		if (accountTransactions[accountId]) return

		try {
			const response = await transactionsAPI.getByAccount(accountId, { limit: 10 })
			setAccountTransactions(prev => ({
				...prev,
				[accountId]: response.data.transactions || response.data
			}))
		} catch (err) {
			console.error('Erreur chargement transactions:', err)
		}
	}

	// Basculer l'expansion/réduction
	const toggleExpand = async (accountId) => {
		if (expandedAccountId === accountId) {
			setExpandedAccountId(null)
		} else {
			setExpandedAccountId(accountId)
			await loadTransactions(accountId)
		}
	}

	// Supprimer un compte
	const handleDelete = async () => {
		if (!deleteModal.data) return

		try {
			await accountsAPI.delete(deleteModal.data.id)
			setAccounts(prev => prev.filter(a => a.id !== deleteModal.data.id))
			deleteModal.close()
		} catch (err) {
			console.error('Erreur suppression compte:', err)
			alert('Erreur lors de la suppression du compte')
		}
	}

	// Ouvrir la modal d'édition
	const openEditModal = (account, e) => {
		e.stopPropagation()
		editModal.open(account)
	}

	// Sauvegarder les modifications
	const handleSaveEdit = async (formData) => {
		if (!editModal.data) return

		try {
			await accountsAPI.update(editModal.data.id, formData)
			setAccounts(prev => prev.map(a =>
				a.id === editModal.data.id ? { ...a, ...formData } : a
			))
			editModal.close()
		} catch (err) {
			console.error('Erreur modification compte:', err)
			alert('Erreur lors de la modification du compte')
		}
	}

	// Supprimer depuis le formulaire d'édition
	const handleDeleteFromEdit = async () => {
		if (!editModal.data) return
		try {
			await accountsAPI.delete(editModal.data.id)
			setAccounts(prev => prev.filter(a => a.id !== editModal.data.id))
			editModal.close()
		} catch (err) {
			console.error('Erreur suppression compte:', err)
			alert('Erreur lors de la suppression du compte')
		}
	}

	// Ouvrir la modal de création
	const openCreateModal = () => {
		createModal.open()
	}

	// Créer un compte
	const handleCreate = async (formData) => {
		try {
			const response = await accountsAPI.create({
				user_id: user.id,
				...formData
			})
			setAccounts(prev => [...prev, response.data.account])
			createModal.close()
		} catch (err) {
			console.error('Erreur création compte:', err)
			alert('Erreur lors de la création du compte')
		}
	}

	// Créer un transfert
	const handleTransfer = async (formData) => {
		try {
			await transactionsAPI.create(formData)
			// Recharger les comptes pour mettre à jour les soldes
			const response = await accountsAPI.getByUser(user.id)
			setAccounts(response.data.accounts)
			// Vider le cache des transactions pour forcer le rechargement
			setAccountTransactions({})
			transferModal.close()
		} catch (err) {
			console.error('Erreur transfert:', err)
			alert('Erreur lors du transfert')
		}
	}

	// Upload d'une icône (appelé par AccountForm)
	const handleIconUpload = async (file, onSuccess) => {
		setUploadingIcon(true)
		try {
			const response = await iconsAPI.upload(user.id, file)
			const newIcon = response.data.icon
			setUserIcons(prev => [...prev, newIcon])
			onSuccess?.(newIcon.path)
		} catch (err) {
			console.error('Erreur upload icône:', err)
			alert('Erreur lors de l\'upload de l\'icône')
		} finally {
			setUploadingIcon(false)
		}
	}

	// Suppression d'une icône
	const handleDeleteIcon = async () => {
		if (!deleteIconModal.icon) return

		const iconName = deleteIconModal.icon.path.split('/').pop()
		try {
			await iconsAPI.delete(user.id, iconName)
			setUserIcons(prev => prev.filter(i => i.path !== deleteIconModal.icon.path))
			setDeleteIconModal({ open: false, icon: null, isEdit: false })
		} catch (err) {
			console.error('Erreur suppression icône:', err)
			alert('Erreur lors de la suppression de l\'icône')
		}
	}

	// Calculer le solde total de tous les comptes
	const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0)

	// Trier les comptes par type
	const typeOrder = { checking: 0, savings: 1, cash: 2, investment: 3, other: 4 }
	const sortedAccounts = [...accounts].sort((a, b) => {
		const orderA = typeOrder[a.type] ?? 99
		const orderB = typeOrder[b.type] ?? 99
		return orderA - orderB
	})

	if (loading) {
		return (
			<div className="p-8 max-w-[1600px] mx-auto">
				<div className="text-center py-12 text-text-secondary">Chargement...</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="p-8 max-w-[1600px] mx-auto">
				<div className="text-center py-12 text-red-500">{error}</div>
			</div>
		)
	}

	return (
		<div className="p-8 max-w-[1600px] mx-auto max-md:p-4">
			<PageHeader title="Mes comptes">
				<button
					className="flex items-center gap-2 py-3 px-5 bg-bg-card border border-border rounded-xl text-text-primary font-semibold cursor-pointer transition-all duration-300 hover:border-neon-cyan hover:text-neon-cyan hover:shadow-[0_4px_20px_rgba(0,240,255,0.2)]"
					onClick={() => transferModal.open({
						type: 'transfer',
						account_id: accounts[0]?.id || '',
						target_account_id: accounts[1]?.id || ''
					})}
					disabled={accounts.length < 2}
					title={accounts.length < 2 ? 'Vous devez avoir au moins 2 comptes pour effectuer un transfert' : ''}
				>
					<SwapHorizIcon />
					<span>Transfert</span>
				</button>
				<button
					className="flex items-center gap-2 py-3 px-5 bg-gradient-to-br from-neon-cyan to-neon-purple border-none rounded-xl text-white font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,240,255,0.4)]"
					onClick={openCreateModal}
				>
					<AddIcon />
					<span>Nouveau compte</span>
				</button>
			</PageHeader>

			{/* Résumé du solde total */}
			{accounts.length > 0 && (
				<div className="bg-gradient-to-br from-neon-cyan/15 to-neon-purple/15 border border-neon-cyan/30 rounded-2xl py-6 px-8 mb-8 text-center">
					<div className="text-sm text-text-secondary uppercase tracking-wider mb-2">Solde total</div>
					<div className={clsx(
						'text-4xl font-bold mb-2',
						totalBalance >= 0 ? 'text-green-500' : 'text-red-500'
					)}>
						{formatCurrency(totalBalance)}
					</div>
					<div className="text-sm text-text-secondary">
						{accounts.length} compte{accounts.length > 1 ? 's' : ''}
					</div>
				</div>
			)}

			<div className="flex flex-col gap-4">
				{accounts.length === 0 ? (
					<div className="text-center py-12 bg-bg-card rounded-xl border border-dashed border-border">
						<p className="text-text-secondary mb-6">Aucun compte trouvé</p>
						<button
							className="flex items-center gap-2 py-3 px-5 bg-gradient-to-br from-neon-cyan to-neon-purple border-none rounded-xl text-white font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,240,255,0.4)] mx-auto"
							onClick={openCreateModal}
						>
							<AddIcon />
							<span>Créer mon premier compte</span>
						</button>
					</div>
				) : (
					sortedAccounts.map(account => (
						<div key={account.id} className="rounded-xl overflow-hidden bg-bg-card border border-border transition-all duration-300 hover:border-neon-cyan/30">
							<div
								className={clsx(
									'flex items-center justify-between p-4 px-6 bg-gradient-to-br from-neon-cyan/10 to-neon-cyan/[0.02] border-l-4 cursor-pointer transition-all duration-300',
									'hover:from-neon-cyan/15 hover:to-neon-cyan/5',
									'max-md:flex-wrap max-md:gap-4',
									expandedAccountId === account.id && 'border-b border-border'
								)}
								onClick={() => toggleExpand(account.id)}
								style={{ borderLeftColor: account.color || '#00f0ff' }}
							>
								<div className="flex items-center gap-4 flex-1">
									<div
										className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
										style={{ backgroundColor: account.color || '#3b82f6' }}
									>
										<img src={account.icon || '/default/icons/wallet.png'} alt="" className="w-6 h-6" />
									</div>
									<div className="flex flex-col gap-1">
										<span className="font-semibold text-lg text-text-primary">{account.name}</span>
										<span className="text-sm text-text-secondary">{getAccountTypeLabel(account.type)}</span>
									</div>
								</div>

								<div className="px-8 max-md:px-0 max-md:order-3 max-md:w-full max-md:text-right">
									<span className={clsx(
										'text-xl font-bold',
										account.balance >= 0 ? 'text-green-500' : 'text-red-500'
									)}>
										{formatCurrency(account.balance)}
									</span>
								</div>

								<div className="flex items-center gap-2 max-md:order-2">
									<button
										className="w-9 h-9 rounded-lg border border-border bg-bg-secondary text-text-secondary cursor-pointer flex items-center justify-center transition-all duration-300 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/10"
										onClick={(e) => openEditModal(account, e)}
										title="Modifier"
									>
										<EditIcon fontSize="small" />
									</button>
									<button
										className="w-9 h-9 rounded-lg border border-border bg-bg-secondary text-text-secondary cursor-pointer flex items-center justify-center transition-all duration-300 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
										onClick={(e) => {
											e.stopPropagation()
											deleteModal.open(account)
										}}
										title="Supprimer"
									>
										<DeleteIcon fontSize="small" />
									</button>
									<button
										className="w-9 h-9 rounded-lg border-none bg-transparent text-neon-cyan cursor-pointer flex items-center justify-center transition-all duration-300 hover:bg-neon-cyan/10"
										title={expandedAccountId === account.id ? 'Replier' : 'Déplier'}
									>
										{expandedAccountId === account.id ? (
											<KeyboardArrowUpIcon />
										) : (
											<KeyboardArrowDownIcon />
										)}
									</button>
								</div>
							</div>

							{expandedAccountId === account.id && (
								<div className="p-4 px-6 pb-6 bg-bg-secondary animate-[slideDown_0.3s_ease]">
									{accountTransactions[account.id] ? (
										accountTransactions[account.id].length > 0 ? (
											<table className="w-full border-collapse">
												<thead>
													<tr>
														<th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">Date</th>
														<th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">Description</th>
														<th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">Catégorie</th>
														<th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">Montant</th>
													</tr>
												</thead>
												<tbody>
													{accountTransactions[account.id].map(tx => (
														<tr key={tx.id} className="hover:bg-neon-cyan/[0.03]">
															<td className="py-3 px-4 text-sm text-text-primary border-b border-white/5 last:border-b-0">{formatDateWithYear(tx.date)}</td>
															<td className="py-3 px-4 text-sm text-text-primary border-b border-white/5 last:border-b-0">{tx.description || '-'}</td>
															<td className="py-3 px-4 text-sm text-text-primary border-b border-white/5 last:border-b-0">
																<span
																	className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs text-white font-medium"
																	style={{ backgroundColor: tx.category_color || '#6b7280' }}
																>
																	{tx.category_icon && (
																		<img
																			src={tx.category_icon}
																			alt=""
																			className="w-4 h-4 object-contain"
																		/>
																	)}
																	{tx.category_name || 'Sans catégorie'}
																</span>
															</td>
															<td className={clsx(
																'py-3 px-4 text-sm font-semibold border-b border-white/5 last:border-b-0',
																tx.type === 'income' ? 'text-green-500' : tx.type === 'expense' ? 'text-red-500' : 'text-text-primary'
															)}>
																{tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
																{formatCurrency(tx.amount)}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										) : (
											<div className="text-center py-8 text-text-secondary">Aucune transaction</div>
										)
									) : (
										<div className="text-center py-8 text-text-secondary">Chargement...</div>
									)}
								</div>
							)}
						</div>
					))
				)}
			</div>

			{/* Modal de création */}
			<FormModal
				isOpen={createModal.isOpen}
				onClose={createModal.close}
				title="Nouveau compte"
				FormComponent={AccountForm}
				formProps={{
					defaultIcons,
					userIcons,
					uploadingIcon,
					onIconUpload: handleIconUpload,
					onIconDelete: (icon) => setDeleteIconModal({ open: true, icon, isEdit: false }),
					showBalance: true,
					onSubmit: handleCreate,
					submitLabel: "Créer le compte"
				}}
			/>

			{/* Modal d'édition */}
			<FormModal
				isOpen={editModal.isOpen && !!editModal.data}
				onClose={editModal.close}
				title="Modifier le compte"
				FormComponent={AccountForm}
				formProps={{
					initialData: editModal.data ? {
						name: editModal.data.name,
						type: editModal.data.type,
						color: editModal.data.color || '#3b82f6',
						icon: editModal.data.icon || '/default/icons/wallet.png'
					} : {},
					defaultIcons,
					userIcons,
					uploadingIcon,
					onIconUpload: handleIconUpload,
					onIconDelete: (icon) => setDeleteIconModal({ open: true, icon, isEdit: true }),
					onSubmit: handleSaveEdit,
					onDelete: handleDeleteFromEdit,
					submitLabel: "Enregistrer"
				}}
			/>

			{/* Modal de confirmation de suppression */}
			<ConfirmModal
				isOpen={deleteModal.isOpen}
				onClose={deleteModal.close}
				onConfirm={handleDelete}
				title="Supprimer le compte"
				confirmText="Supprimer"
			>
				<p className="text-text-primary m-0 mb-4">
					Êtes-vous sûr de vouloir supprimer le compte <strong>{deleteModal.data?.name}</strong> ?
				</p>
				<p className="text-amber-500 text-sm p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 m-0">
					Cette action est irréversible. Toutes les transactions associées seront également supprimées.
				</p>
			</ConfirmModal>

			{/* Modal de confirmation suppression icône */}
			<ConfirmModal
				isOpen={deleteIconModal.open}
				onClose={() => setDeleteIconModal({ open: false, icon: null, isEdit: false })}
				onConfirm={handleDeleteIcon}
				title="Supprimer l'icône"
				confirmText="Supprimer"
			>
				<div className="flex flex-col items-center text-center">
					<div className="w-20 h-20 rounded-xl bg-bg-secondary border-2 border-border flex items-center justify-center mb-4">
						<img src={deleteIconModal.icon?.path} alt="" className="w-10 h-10 object-contain" />
					</div>
					<p className="text-text-primary m-0 mb-2">Voulez-vous vraiment supprimer cette icône ?</p>
					<p className="text-sm text-text-secondary m-0">
						Les comptes utilisant cette icône garderont leur apparence actuelle.
					</p>
				</div>
			</ConfirmModal>

			{/* Modal de transfert */}
			<FormModal
				isOpen={transferModal.isOpen}
				onClose={transferModal.close}
				title="Nouveau transfert"
				FormComponent={TransactionForm}
				formProps={{
					initialData: transferModal.data || { type: 'transfer' },
					accounts,
					categories,
					onSubmit: handleTransfer,
					submitLabel: "Effectuer le transfert"
				}}
			/>
		</div>
	)
}

export default Comptes
