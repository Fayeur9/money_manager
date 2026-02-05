import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import DeleteIcon from '@mui/icons-material/Delete'
import FormInput from '../ui/FormInput'
import StyledSelect from '../StyledSelect'
import IconSelector from '../features/categories/IconSelector'
import ConfirmModal from '../ui/ConfirmModal'

/**
 * Formulaire de catégorie réutilisable.
 *
 * @param {Object} initialData - Données initiales du formulaire
 * @param {Array} lockedFields - Champs verrouillés (non modifiables)
 * @param {Function} onSubmit - Callback avec les données validées
 * @param {Function} onCancel - Callback d'annulation
 * @param {Function} onDelete - Callback de suppression (optionnel, mode édition)
 * @param {Array} parentOptions - Options de catégories parentes [{value, label, icon, color}]
 * @param {Object} parentCategory - Catégorie parente fixée (pour création de sous-catégorie)
 * @param {Array} defaultIcons - Liste des icônes par défaut
 * @param {Array} userIcons - Liste des icônes uploadées par l'utilisateur
 * @param {Function} onIconUpload - Callback pour l'upload d'icône
 * @param {Function} onIconDelete - Callback pour supprimer une icône
 * @param {boolean} uploadingIcon - Indique si un upload est en cours
 * @param {string} submitLabel - Texte du bouton de soumission (défaut: "Créer")
 */
function CategoryForm({
	initialData = {},
	lockedFields = [],
	onSubmit,
	onCancel,
	onDelete,
	parentOptions = [],
	parentCategory = null,
	defaultIcons = [],
	userIcons = [],
	onIconUpload,
	onIconDelete,
	uploadingIcon = false,
	submitLabel = 'Créer'
}) {
	// État du formulaire
	const [form, setForm] = useState({
		name: '',
		type: 'expense',
		color: '#6b7280',
		icon: '/default/icons/dots.png',
		parent_id: null
	})

	// État pour la modal de confirmation de suppression
	const [showDeleteModal, setShowDeleteModal] = useState(false)

	// État pour la confirmation de fermeture
	const [showCloseConfirm, setShowCloseConfirm] = useState(false)

	// Erreurs de validation
	const [errors, setErrors] = useState({})

	// Valeurs initiales pour détecter les modifications
	const [initialFormValues, setInitialFormValues] = useState(null)

	// Ref pour l'input file
	const fileInputRef = useRef(null)

	// Initialiser le formulaire avec les données initiales
	useEffect(() => {
		const newForm = {
			name: initialData.name || '',
			type: initialData.type || 'expense',
			color: initialData.color || '#6b7280',
			icon: initialData.icon || '/default/icons/dots.png',
			parent_id: initialData.parent_id || null
		}
		setForm(newForm)
		setInitialFormValues(newForm)
		setShowDeleteModal(false)
		setShowCloseConfirm(false)
		setErrors({})
	}, [initialData])

	// Vérifier si le formulaire a été modifié
	const isDirty = () => {
		if (!initialFormValues) return false
		return Object.keys(form).some(key => form[key] !== initialFormValues[key])
	}

	// Mode édition ou création
	const isEditMode = !!initialData.id

	// Vérifier si un champ est verrouillé
	const isLocked = (field) => lockedFields.includes(field)

	// Mettre à jour un champ
	const updateField = (field, value) => {
		if (isLocked(field)) return
		setForm(prev => ({ ...prev, [field]: value }))
		// Effacer l'erreur du champ modifié
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: null }))
		}
	}

	// Validation du formulaire
	const validate = () => {
		const newErrors = {}

		if (!form.name?.trim()) {
			newErrors.name = 'Veuillez saisir un nom pour la catégorie'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Soumission du formulaire
	const handleSubmit = (e) => {
		e?.preventDefault()
		if (!validate()) return

		onSubmit(form)
	}

	// Gestion de la suppression
	const handleDeleteClick = () => {
		setShowDeleteModal(true)
	}

	const handleConfirmDelete = () => {
		setShowDeleteModal(false)
		onDelete?.()
	}

	// Gestion de la fermeture avec vérification des modifications
	const handleClose = () => {
		if (isDirty()) {
			setShowCloseConfirm(true)
		} else {
			onCancel?.()
		}
	}

	// Enregistrer et fermer (pour le mode édition)
	const handleSaveAndClose = () => {
		if (validate()) {
			handleSubmit()
		}
	}

	// Gestion de l'upload d'icône
	const handleFileChange = (e) => {
		const file = e.target.files[0]
		if (!file) return
		onIconUpload?.(file, (newIconPath) => {
			updateField('icon', newIconPath)
		})
		e.target.value = ''
	}

	return (
		<form onSubmit={handleSubmit}>
			{/* Nom, couleur et aperçu */}
			<div className="flex gap-4 items-start mb-5">
				<div className="flex-1">
					<FormInput
						label="Nom de la catégorie"
						required
						value={form.name}
						onChange={(e) => updateField('name', e.target.value)}
						placeholder="Ex: Électricité"
						error={errors.name}
						disabled={isLocked('name')}
					/>
				</div>
				<div>
					<label className="block mb-2 text-sm font-medium text-text-secondary">Couleur</label>
					<input
						type="color"
						value={form.color}
						onChange={(e) => updateField('color', e.target.value)}
						disabled={isLocked('color')}
						className="w-15 h-10 p-0 border-none rounded-lg cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-2 [&::-webkit-color-swatch]:border-border [&::-webkit-color-swatch]:rounded-lg"
					/>
				</div>
				<div
					className="w-13 h-13 rounded-xl flex items-center justify-center border-2 border-border shrink-0"
					style={{ backgroundColor: form.color }}
				>
					<img src={form.icon} alt="" className="w-6.5 h-6.5 object-contain brightness-0 invert" />
				</div>
			</div>

			{/* Catégorie parente (si pas de parentCategory fixée) */}
			{!parentCategory && !isLocked('parent_id') && parentOptions.length > 0 && (
				<div className="mb-5">
					<label className="block mb-2 text-sm font-medium text-text-secondary">
						Catégorie parente (optionnel)
					</label>
					<StyledSelect
						options={[
							{ value: '', label: 'Aucune (catégorie principale)' },
							...parentOptions
						]}
						value={form.parent_id || ''}
						onChange={(value) => updateField('parent_id', value || null)}
						placeholder="Sélectionner une catégorie parente"
						showIcons
						isSearchable
					/>
				</div>
			)}

			{/* Affichage de la catégorie parente fixée */}
			{parentCategory && (
				<div className="mb-5 p-3 bg-bg-secondary rounded-lg border border-border">
					<span className="text-xs text-text-secondary">Catégorie parente :</span>
					<div className="flex items-center gap-2 mt-1">
						<div
							className="w-6 h-6 rounded-md flex items-center justify-center"
							style={{ backgroundColor: parentCategory.color }}
						>
							<img src={parentCategory.icon} alt="" className="w-3 h-3 brightness-0 invert" />
						</div>
						<span className="text-sm font-medium text-text-primary">{parentCategory.name}</span>
					</div>
				</div>
			)}

			{/* Sélecteur d'icône */}
			<IconSelector
				selectedIcon={form.icon}
				onSelect={(path) => updateField('icon', path)}
				defaultIcons={defaultIcons}
				userIcons={userIcons}
				uploadingIcon={uploadingIcon}
				onUploadClick={() => fileInputRef.current?.click()}
				onDeleteClick={onIconDelete}
			/>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/png,image/jpeg,image/webp"
				onChange={handleFileChange}
				className="hidden"
			/>

			{/* Footer avec boutons */}
			<div className="flex justify-between items-center pt-4 border-t border-border -mx-6 px-6 -mb-5 pb-5 mt-5">
				{showCloseConfirm ? (
					<div className="flex justify-between items-center w-full bg-amber-500/5 -mx-6 -mb-5 px-6 py-4 border-t border-border">
						<span className="text-amber-400 font-medium">
							{isEditMode
								? 'Des modifications n\'ont pas été enregistrées'
								: 'Êtes-vous certain de vouloir annuler la création ?'}
						</span>
						<div className="flex gap-3">
							{isEditMode && (
								<button
									type="button"
									onClick={handleSaveAndClose}
									className="px-4 py-2 bg-neon-cyan border-none rounded-lg text-bg-primary font-medium cursor-pointer"
								>
									Enregistrer
								</button>
							)}
							<button
								type="button"
								onClick={() => setShowCloseConfirm(false)}
								className="px-4 py-2 bg-transparent border border-border rounded-lg text-text-secondary font-medium cursor-pointer"
							>
								{isEditMode ? 'Continuer' : 'Non'}
							</button>
							<button
								type="button"
								onClick={() => onCancel?.()}
								className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 font-medium cursor-pointer"
							>
								Quitter
							</button>
						</div>
					</div>
				) : (
					<>
						{onDelete ? (
							<button
								type="button"
								onClick={handleDeleteClick}
								className="flex items-center gap-1.5 px-4 py-2.5 border border-red-500 bg-transparent rounded-lg text-red-500 font-medium cursor-pointer hover:bg-red-500/10"
							>
								<DeleteIcon fontSize="small" />
								Supprimer
							</button>
						) : (
							<div />
						)}
						<div className="flex gap-3">
							<button
								type="button"
								onClick={handleClose}
								className="px-5 py-2.5 bg-transparent border border-border rounded-lg text-text-secondary font-medium cursor-pointer transition-all duration-200 hover:border-text-secondary hover:text-text-primary"
							>
								Annuler
							</button>
							<button
								type="submit"
								className="px-5 py-2.5 bg-gradient-to-br from-neon-cyan to-neon-purple border-none rounded-lg text-white font-semibold cursor-pointer transition-all duration-200 hover:shadow-[0_4px_15px_rgba(0,240,255,0.4)]"
							>
								{submitLabel}
							</button>
						</div>
					</>
				)}
			</div>

			{/* Modal de confirmation de suppression */}
			<ConfirmModal
				isOpen={showDeleteModal}
				onClose={() => setShowDeleteModal(false)}
				onConfirm={handleConfirmDelete}
				title="Supprimer la catégorie"
				confirmText="Supprimer"
				variant="danger"
			>
				<p className="m-0">
					Êtes-vous sûr de vouloir supprimer la catégorie{' '}
					<strong className="text-text-primary">{form.name}</strong> ?
				</p>
			</ConfirmModal>
		</form>
	)
}

CategoryForm.propTypes = {
	initialData: PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		name: PropTypes.string,
		type: PropTypes.string,
		color: PropTypes.string,
		icon: PropTypes.string,
		parent_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
	}),
	lockedFields: PropTypes.arrayOf(PropTypes.string),
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func,
	onDelete: PropTypes.func,
	parentOptions: PropTypes.arrayOf(PropTypes.shape({
		value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
		label: PropTypes.string.isRequired,
		icon: PropTypes.string,
		color: PropTypes.string
	})),
	parentCategory: PropTypes.shape({
		name: PropTypes.string.isRequired,
		color: PropTypes.string,
		icon: PropTypes.string
	}),
	defaultIcons: PropTypes.arrayOf(PropTypes.string),
	userIcons: PropTypes.arrayOf(PropTypes.string),
	onIconUpload: PropTypes.func,
	onIconDelete: PropTypes.func,
	uploadingIcon: PropTypes.bool,
	submitLabel: PropTypes.string
}

export default CategoryForm
