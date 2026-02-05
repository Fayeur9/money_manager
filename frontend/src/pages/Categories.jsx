import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { categoriesAPI, iconsAPI } from '../api/index.js'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FolderOffIcon from '@mui/icons-material/FolderOff'
import FormModal from '../components/ui/FormModal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { CategoryForm } from '../components/forms'
import { PageHeader } from '../components/layout'
import { useModalState } from '../hooks'

function Categories() {
	const user = JSON.parse(localStorage.getItem('user'))
	const [categories, setCategories] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	// Vue active (expense ou income)
	const [activeView, setActiveView] = useState('expense')

	// Catégorie parente sélectionnée
	const [selectedParent, setSelectedParent] = useState(null)

	// Icônes
	const [defaultIcons, setDefaultIcons] = useState([])
	const [userIcons, setUserIcons] = useState([])
	const [uploadingIcon, setUploadingIcon] = useState(false)
	const [deleteIconModal, setDeleteIconModal] = useState({ open: false, icon: null, isEdit: false })

	// Modals
	const editModal = useModalState()
	const createModal = useModalState()

	// Charger les catégories
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await categoriesAPI.getAll(user.id)
				setCategories(response.data.categories)
			} catch (err) {
				console.error('Erreur chargement catégories:', err)
				setError('Impossible de charger les catégories')
			} finally {
				setLoading(false)
			}
		}
		fetchCategories()
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

	// Filtrer les catégories par type actif
	const currentCategories = categories.filter(c => c.type === activeView)

	// Récupérer les enfants d'une catégorie
	const getChildren = (parentId) => {
		return currentCategories
			.filter(c => c.parent_id === parentId)
			.sort((a, b) => a.name.localeCompare(b.name))
	}

	// Catégories qui ont des enfants (vraies catégories parentes)
	const categoriesWithChildren = currentCategories
		.filter(c => !c.parent_id && getChildren(c.id).length > 0)
		.sort((a, b) => a.name.localeCompare(b.name))

	// Catégories orphelines (sans parent ET sans enfants)
	const orphanCategories = currentCategories
		.filter(c => !c.parent_id && getChildren(c.id).length === 0)
		.sort((a, b) => a.name.localeCompare(b.name))

	// Liste affichée dans la sidebar : entrée "Sans catégorie" en haut si orphelines + catégories avec enfants
	const sidebarItems = [
		...(orphanCategories.length > 0 ? [{
			id: '__uncategorized__',
			name: 'Sans catégorie',
			icon: null,
			color: '#6b7280',
			isVirtual: true
		}] : []),
		...categoriesWithChildren.map(c => ({ ...c, isVirtual: false }))
	]

	// Sélectionner automatiquement le premier élément de la sidebar quand on change de vue
	useEffect(() => {
		if (sidebarItems.length > 0 && (!selectedParent || (selectedParent.type !== activeView && !selectedParent.isVirtual))) {
			setSelectedParent(sidebarItems[0])
		} else if (sidebarItems.length === 0) {
			setSelectedParent(null)
		}
	}, [activeView, sidebarItems.length])

	// Mettre à jour selectedParent si elle a été modifiée
	useEffect(() => {
		if (selectedParent && !selectedParent.isVirtual) {
			const updated = categories.find(c => c.id === selectedParent.id)
			if (updated) {
				setSelectedParent({ ...updated, isVirtual: false })
			}
		}
	}, [categories])

	// Options de catégories parentes pour les sélecteurs (catégories qui ont des enfants ou qui n'en ont pas encore)
	const getParentOptions = (type, excludeId = null) => {
		return categories
			.filter(c => c.type === type && c.id !== excludeId && !c.parent_id)
			.map(c => ({ value: c.id, label: c.name, icon: c.icon, color: c.color }))
	}

	// Ouvrir la modal d'édition
	const openEditModal = (category) => {
		editModal.open(category)
	}

	// Sauvegarder les modifications
	const handleSaveEdit = async (formData) => {
		if (!editModal.data) return

		try {
			await categoriesAPI.update(editModal.data.id, formData)
			setCategories(prev => prev.map(c =>
				c.id === editModal.data.id ? { ...c, ...formData } : c
			))
			editModal.close()
		} catch (err) {
			console.error('Erreur modification catégorie:', err)
			const errorMsg = err.response?.data?.detail || 'Erreur lors de la modification de la catégorie'
			alert(errorMsg)
		}
	}

	// Supprimer depuis le modal d'édition
	const handleDeleteFromEdit = async () => {
		if (!editModal.data) return

		try {
			await categoriesAPI.delete(editModal.data.id)
			const deletedId = editModal.data.id
			setCategories(prev => prev.filter(c => c.id !== deletedId))
			// Si on supprime la catégorie parente sélectionnée, sélectionner la première disponible
			if (selectedParent?.id === deletedId && !selectedParent?.isVirtual) {
				setSelectedParent(null) // Le useEffect se chargera de sélectionner le premier élément
			}
			editModal.close()
		} catch (err) {
			console.error('Erreur suppression catégorie:', err)
			alert('Erreur lors de la suppression de la catégorie')
		}
	}

	// Ouvrir la modal de création
	const openCreateModal = (parentId = null) => {
		createModal.open(parentId)
	}

	// Créer une catégorie
	const handleCreate = async (formData) => {
		try {
			const response = await categoriesAPI.create({
				user_id: user.id,
				...formData
			})
			const newCategory = response.data.category
			setCategories(prev => [...prev, newCategory])
			// Si c'est une catégorie parente, la sélectionner
			if (!newCategory.parent_id) {
				setSelectedParent(newCategory)
			}
			createModal.close()
		} catch (err) {
			console.error('Erreur création catégorie:', err)
			const errorMsg = err.response?.data?.detail || 'Erreur lors de la création de la catégorie'
			alert(errorMsg)
		}
	}

	// Upload d'une icône (appelé par CategoryForm)
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

	// Enfants de la catégorie sélectionnée (ou orphelines si "Sans catégorie")
	const selectedChildren = selectedParent
		? (selectedParent.isVirtual ? orphanCategories : getChildren(selectedParent.id))
		: []

	if (loading) {
		return (
			<div className="p-8 max-w-[1600px] mx-auto max-md:p-4">
				<div className="text-center py-12 text-text-secondary">Chargement...</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="p-8 max-w-[1600px] mx-auto max-md:p-4">
				<div className="text-center py-12 text-red-500">{error}</div>
			</div>
		)
	}

	return (
		<div className="p-8 max-w-[1600px] mx-auto max-md:p-4">
			<PageHeader title="Catégories" className="mb-6" />
			<div className="flex h-[calc(100vh-180px)] gap-4 max-md:flex-col max-md:h-auto max-md:gap-2">
			{/* Sidebar */}
			<div className="w-80 shrink-0 bg-bg-card border border-border rounded-2xl flex flex-col overflow-hidden max-md:w-full max-md:max-h-[40vh]">
				{/* Toggle Dépenses/Revenus */}
				<div className="flex border-b border-border rounded-t-2xl overflow-hidden">
					<button
						className={clsx(
							'flex-1 flex items-center justify-center gap-2 p-3 text-sm font-medium transition-all duration-200 border-none cursor-pointer',
							activeView === 'expense'
								? 'bg-red-500/20 text-red-500'
								: 'bg-transparent text-text-secondary hover:bg-white/5'
						)}
						onClick={() => setActiveView('expense')}
					>
						<TrendingDownIcon fontSize="small" />
						<span>Dépenses</span>
					</button>
					<button
						className={clsx(
							'flex-1 flex items-center justify-center gap-2 p-3 text-sm font-medium transition-all duration-200 border-none cursor-pointer',
							activeView === 'income'
								? 'bg-green-500/20 text-green-500'
								: 'bg-transparent text-text-secondary hover:bg-white/5'
						)}
						onClick={() => setActiveView('income')}
					>
						<TrendingUpIcon fontSize="small" />
						<span>Revenus</span>
					</button>
				</div>

				{/* Liste des catégories parentes */}
				<div className="flex-1 overflow-y-auto p-1.5">
					{sidebarItems.length === 0 ? (
						<div className="text-center py-8 text-text-secondary text-sm">
							Aucune catégorie
						</div>
					) : (
						sidebarItems.map(item => {
							const childCount = item.isVirtual ? orphanCategories.length : getChildren(item.id).length
							const isSelected = selectedParent?.id === item.id

							return (
								<div
									key={item.id}
									className={clsx(
										'group flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all duration-200',
										isSelected
											? 'bg-neon-cyan/20 border border-neon-cyan/50'
											: 'border border-transparent hover:bg-white/5'
									)}
									onClick={() => setSelectedParent(item)}
								>
									{item.isVirtual ? (
										<div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-bg-secondary border border-border">
											<FolderOffIcon style={{ fontSize: 18 }} className="text-text-secondary" />
										</div>
									) : (
										<div
											className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
											style={{ backgroundColor: item.color || '#6b7280' }}
										>
											<img
												src={item.icon || '/default/icons/dots.png'}
												alt=""
												className="w-4.5 h-4.5 object-contain"
											/>
										</div>
									)}
									<div className="flex-1 min-w-0">
										<div className={clsx(
											"text-sm font-medium truncate",
											item.isVirtual ? "text-text-secondary italic" : "text-text-primary"
										)}>
											{item.name}
										</div>
										<div className="text-xs text-text-secondary">
											{childCount} {item.isVirtual ? 'catégorie' : 'sous-cat.'}{childCount > 1 ? 's' : ''}
										</div>
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

				{/* Bouton ajouter catégorie parente */}
				<div className="p-1.5 border-t border-border">
					<button
						className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-text-secondary text-sm font-medium bg-transparent border border-dashed border-border cursor-pointer transition-all duration-200 hover:border-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/5"
						onClick={() => openCreateModal()}
					>
						<AddIcon fontSize="small" />
						Nouvelle catégorie
					</button>
				</div>
			</div>

			{/* Main content */}
			<div className="flex-1 flex flex-col overflow-hidden bg-bg-card border border-border rounded-2xl max-md:overflow-visible">
				{/* Header de la catégorie sélectionnée */}
				{selectedParent ? (
					<>
						<div
							className={clsx(
								'flex items-center gap-4 p-6 border-b border-border',
								!selectedParent.isVirtual && 'cursor-pointer hover:bg-white/[0.02]'
							)}
							onClick={() => !selectedParent.isVirtual && openEditModal(selectedParent)}
						>
							{selectedParent.isVirtual ? (
								<div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-bg-secondary border border-border">
									<FolderOffIcon style={{ fontSize: 28 }} className="text-text-secondary" />
								</div>
							) : (
								<div
									className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
									style={{ backgroundColor: selectedParent.color || '#6b7280' }}
								>
									<img
										src={selectedParent.icon || '/default/icons/dots.png'}
										alt=""
										className="w-7 h-7 object-contain"
									/>
								</div>
							)}
							<div className="flex-1">
								<h1 className={clsx(
									"text-2xl font-bold m-0",
									selectedParent.isVirtual ? "text-text-secondary italic" : "text-text-primary"
								)}>
									{selectedParent.name}
								</h1>
								<p className="text-sm text-text-secondary m-0 mt-1">
									{selectedChildren.length} {selectedParent.isVirtual ? 'catégorie' : 'sous-catégorie'}{selectedChildren.length > 1 ? 's' : ''}
								</p>
							</div>
							{!selectedParent.isVirtual && (
								<button
									className="p-2 rounded-lg text-text-secondary transition-all duration-200 hover:bg-white/10 hover:text-neon-cyan"
									onClick={(e) => {
										e.stopPropagation()
										openEditModal(selectedParent)
									}}
								>
									<EditIcon />
								</button>
							)}
						</div>

						{/* Grille des sous-catégories */}
						<div className="flex-1 overflow-y-auto p-6 max-md:p-4">
							<div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5">
								{selectedChildren.map(child => (
									<div
										key={child.id}
										className="group relative flex flex-col items-center gap-4 p-5 bg-bg-card border border-border rounded-2xl transition-all duration-200 cursor-pointer hover:border-neon-cyan/50 hover:bg-white/5 hover:-translate-y-0.5 hover:shadow-lg"
										onClick={() => openEditModal(child)}
									>
										<div
											className="w-16 h-16 rounded-2xl flex items-center justify-center"
											style={{ backgroundColor: child.color || '#6b7280' }}
										>
											<img
												src={child.icon || '/default/icons/dots.png'}
												alt=""
												className="w-8 h-8 object-contain"
											/>
										</div>
										<div className="text-center">
											<div className="text-base font-medium text-text-primary">
												{child.name}
											</div>
										</div>
										<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
											<EditIcon style={{ fontSize: 16 }} className="text-neon-cyan" />
										</div>
									</div>
								))}

								{/* Carte pour ajouter une catégorie/sous-catégorie */}
								<div
									className="flex flex-col items-center justify-center gap-4 p-5 bg-bg-card/50 border-2 border-dashed border-border rounded-2xl cursor-pointer transition-all duration-200 hover:border-neon-cyan/50 hover:bg-neon-cyan/5 min-h-[160px]"
									onClick={() => openCreateModal(selectedParent.isVirtual ? null : selectedParent.id)}
								>
									<div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-border/30">
										<AddIcon style={{ fontSize: 28 }} className="text-text-secondary" />
									</div>
									<span className="text-base text-text-secondary font-medium">Ajouter</span>
								</div>
							</div>
						</div>
					</>
				) : (
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center py-12">
							<p className="text-text-secondary mb-4">
								Aucune catégorie de {activeView === 'expense' ? 'dépenses' : 'revenus'}
							</p>
							<button
								className="flex items-center gap-2 py-2.5 px-4 bg-gradient-to-br from-neon-cyan to-neon-purple border-none rounded-xl text-white text-sm font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(0,240,255,0.4)] mx-auto"
								onClick={() => openCreateModal()}
							>
								<AddIcon fontSize="small" />
								<span>Créer ma première catégorie</span>
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Modal de création */}
			<FormModal
				isOpen={createModal.isOpen}
				onClose={createModal.close}
				title={createModal.data ? "Nouvelle sous-catégorie" : "Nouvelle catégorie"}
				FormComponent={CategoryForm}
				formProps={(() => {
					const parentCat = createModal.data ? categories.find(c => c.id === createModal.data) : null
					return {
						initialData: {
							type: activeView,
							color: parentCat?.color || (activeView === 'income' ? '#22c55e' : '#ef4444'),
							parent_id: createModal.data
						},
						parentOptions: getParentOptions(activeView),
						parentCategory: parentCat,
						defaultIcons,
						userIcons,
						uploadingIcon,
						onIconUpload: handleIconUpload,
						onIconDelete: (icon) => setDeleteIconModal({ open: true, icon, isEdit: false }),
						onSubmit: handleCreate,
						submitLabel: "Créer"
					}
				})()}
			/>

			{/* Modal d'édition */}
			<FormModal
				isOpen={editModal.isOpen && !!editModal.data}
				onClose={editModal.close}
				title="Modifier la catégorie"
				FormComponent={CategoryForm}
				formProps={{
					initialData: editModal.data ? {
						name: editModal.data.name,
						type: editModal.data.type,
						color: editModal.data.color || '#6b7280',
						icon: editModal.data.icon || '/default/icons/dots.png',
						parent_id: editModal.data.parent_id || null
					} : {},
					parentOptions: editModal.data ? getParentOptions(editModal.data.type, editModal.data.id) : [],
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
						Les catégories utilisant cette icône garderont leur apparence actuelle.
					</p>
				</div>
			</ConfirmModal>
			</div>
		</div>
	)
}

export default Categories
