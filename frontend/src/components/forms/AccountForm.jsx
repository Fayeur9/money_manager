import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import DeleteIcon from '@mui/icons-material/Delete'
import FormInput from '../ui/FormInput'
import StyledSelect from '../StyledSelect'
import IconSelector from '../features/categories/IconSelector'

// Options de type de compte
const accountTypeOptions = [
	{ value: 'checking', label: 'Compte courant' },
	{ value: 'savings', label: 'Épargne' },
	{ value: 'cash', label: 'Espèces' },
	{ value: 'investment', label: 'Investissement' },
	{ value: 'other', label: 'Autre' }
]

/**
 * Formulaire de compte réutilisable.
 *
 * @param {Object} initialData - Données initiales du formulaire
 * @param {Array} lockedFields - Champs verrouillés (non modifiables)
 * @param {Function} onSubmit - Callback avec les données validées
 * @param {Function} onCancel - Callback d'annulation
 * @param {Function} onDelete - Callback de suppression (optionnel, mode édition)
 * @param {Array} defaultIcons - Liste des icônes par défaut
 * @param {Array} userIcons - Liste des icônes uploadées par l'utilisateur
 * @param {Function} onIconUpload - Callback pour l'upload d'icône
 * @param {Function} onIconDelete - Callback pour supprimer une icône
 * @param {boolean} uploadingIcon - Indique si un upload est en cours
 * @param {boolean} showBalance - Afficher le champ solde initial (mode création)
 * @param {string} submitLabel - Texte du bouton de soumission (défaut: "Créer")
 */
function AccountForm({
	initialData = {},
	lockedFields = [],
	onSubmit,
	onCancel,
	onDelete,
	defaultIcons = [],
	userIcons = [],
	onIconUpload,
	onIconDelete,
	uploadingIcon = false,
	showBalance = false,
	submitLabel = 'Créer'
}) {
	// État du formulaire
	const [form, setForm] = useState({
		name: '',
		type: 'checking',
		color: '#3b82f6',
		icon: '/default/icons/wallet.png',
		balance: 0
	})

	// État pour la confirmation de suppression
	const [confirmDelete, setConfirmDelete] = useState(false)

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
			type: initialData.type || 'checking',
			color: initialData.color || '#3b82f6',
			icon: initialData.icon || '/default/icons/wallet.png',
			balance: initialData.balance ?? 0
		}
		setForm(newForm)
		setInitialFormValues(newForm)
		setConfirmDelete(false)
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
			newErrors.name = 'Veuillez saisir un nom pour le compte'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Soumission du formulaire
	const handleSubmit = (e) => {
		e?.preventDefault()
		if (!validate()) return

		const data = {
			...form,
			balance: parseFloat(form.balance) || 0
		}

		onSubmit(data)
	}

	// Gestion de la suppression
	const handleDeleteClick = () => {
		if (confirmDelete) {
			onDelete?.()
		} else {
			setConfirmDelete(true)
		}
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
						label="Nom du compte"
						required
						value={form.name}
						onChange={(e) => updateField('name', e.target.value)}
						placeholder="Ex: Compte principal"
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
					className="w-16 h-16 rounded-xl flex items-center justify-center border-2 border-border shrink-0"
					style={{ backgroundColor: form.color }}
				>
					<img src={form.icon} alt="" className="w-8 h-8 object-contain" />
				</div>
			</div>

			{/* Type et solde */}
			<div className="flex gap-4 mb-5">
				<div className="flex-1">
					<label className="block mb-2 text-sm font-medium text-text-secondary">Type de compte</label>
					<StyledSelect
						options={accountTypeOptions}
						value={form.type}
						onChange={(value) => updateField('type', value)}
						isDisabled={isLocked('type')}
					/>
				</div>
				{showBalance && (
					<div className="flex-1">
						<FormInput
							type="number"
							label="Solde initial"
							value={form.balance}
							onChange={(e) => updateField('balance', parseFloat(e.target.value) || 0)}
							step="0.01"
							disabled={isLocked('balance')}
						/>
					</div>
				)}
			</div>

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
				) : confirmDelete ? (
					<div className="flex justify-between items-center w-full bg-red-500/5 -mx-6 -mb-5 px-6 py-4 border-t border-border">
						<span className="text-red-500 font-medium">Confirmer la suppression ?</span>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setConfirmDelete(false)}
								className="px-5 py-2.5 bg-transparent border border-border rounded-lg text-text-secondary font-medium cursor-pointer"
							>
								Non
							</button>
							<button
								type="button"
								onClick={() => onDelete?.()}
								className="px-5 py-2.5 bg-red-500 border-none rounded-lg text-white font-semibold cursor-pointer"
							>
								Oui, supprimer
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
		</form>
	)
}

AccountForm.propTypes = {
	initialData: PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		name: PropTypes.string,
		type: PropTypes.string,
		color: PropTypes.string,
		icon: PropTypes.string,
		balance: PropTypes.number
	}),
	lockedFields: PropTypes.arrayOf(PropTypes.string),
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func,
	onDelete: PropTypes.func,
	defaultIcons: PropTypes.arrayOf(PropTypes.string),
	userIcons: PropTypes.arrayOf(PropTypes.string),
	onIconUpload: PropTypes.func,
	onIconDelete: PropTypes.func,
	uploadingIcon: PropTypes.bool,
	showBalance: PropTypes.bool,
	submitLabel: PropTypes.string
}

export default AccountForm
