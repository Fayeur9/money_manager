import { useState, useEffect } from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import DeleteIcon from '@mui/icons-material/Delete'
import FormInput from '../ui/FormInput'
import DatePicker from '../ui/DatePicker'
import StyledSelect from '../StyledSelect'

/**
 * Sélecteur de type (Dépense/Revenu)
 */
function TypeSelector({ value, onChange, disabled = false }) {
	return (
		<div className="flex gap-2">
			<button
				type="button"
				disabled={disabled}
				className={clsx(
					'flex-1 py-3 rounded-lg border bg-bg-secondary font-medium transition-all duration-200',
					disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
					value === 'expense'
						? 'border-red-500 bg-red-500/10 text-red-500'
						: 'border-border text-text-secondary hover:border-text-secondary'
				)}
				onClick={() => !disabled && onChange('expense')}
			>
				Dépense
			</button>
			<button
				type="button"
				disabled={disabled}
				className={clsx(
					'flex-1 py-3 rounded-lg border bg-bg-secondary font-medium transition-all duration-200',
					disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
					value === 'income'
						? 'border-green-500 bg-green-500/10 text-green-500'
						: 'border-border text-text-secondary hover:border-text-secondary'
				)}
				onClick={() => !disabled && onChange('income')}
			>
				Revenu
			</button>
		</div>
	)
}

// Options de fréquence
const frequencyOptions = [
	{ value: 'daily', label: 'Quotidien' },
	{ value: 'weekly', label: 'Hebdomadaire' },
	{ value: 'biweekly', label: 'Bi-mensuel' },
	{ value: 'monthly', label: 'Mensuel' },
	{ value: 'quarterly', label: 'Trimestriel' },
	{ value: 'yearly', label: 'Annuel' }
]

/**
 * Formulaire de transaction récurrente réutilisable.
 *
 * @param {Object} initialData - Données initiales du formulaire
 * @param {Array} lockedFields - Champs verrouillés (non modifiables)
 * @param {Function} onSubmit - Callback avec les données validées
 * @param {Function} onCancel - Callback d'annulation
 * @param {Function} onDelete - Callback de suppression (optionnel, mode édition)
 * @param {Array} accounts - Liste des comptes disponibles
 * @param {Array} categories - Liste des catégories disponibles
 * @param {string} submitLabel - Texte du bouton de soumission (défaut: "Créer")
 */
function RecurringForm({
	initialData = {},
	lockedFields = [],
	onSubmit,
	onCancel,
	onDelete,
	accounts = [],
	categories = [],
	submitLabel = 'Créer'
}) {
	// État du formulaire
	const [form, setForm] = useState({
		type: 'expense',
		amount: '',
		frequency: 'monthly',
		start_date: new Date().toISOString().split('T')[0],
		account_id: '',
		category_id: '',
		description: '',
		is_active: true
	})

	// État pour la confirmation de suppression
	const [confirmDelete, setConfirmDelete] = useState(false)

	// État pour la confirmation de fermeture
	const [showCloseConfirm, setShowCloseConfirm] = useState(false)

	// Erreurs de validation
	const [errors, setErrors] = useState({})

	// Valeurs initiales pour détecter les modifications
	const [initialFormValues, setInitialFormValues] = useState(null)

	// Initialiser le formulaire avec les données initiales
	useEffect(() => {
		const defaultAccountId = accounts[0]?.id || ''
		const newForm = {
			type: initialData.type || 'expense',
			amount: initialData.amount ?? '',
			frequency: initialData.frequency || 'monthly',
			start_date: initialData.start_date || new Date().toISOString().split('T')[0],
			account_id: initialData.account_id || defaultAccountId,
			category_id: initialData.category_id || '',
			description: initialData.description || '',
			is_active: initialData.is_active ?? true
		}
		setForm(newForm)
		setInitialFormValues(newForm)
		setConfirmDelete(false)
		setShowCloseConfirm(false)
		setErrors({})
	}, [initialData, accounts])

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

	// Changer le type (reset category)
	const handleTypeChange = (type) => {
		if (isLocked('type')) return
		setForm(prev => ({
			...prev,
			type,
			category_id: ''
		}))
	}

	// Filtrer les catégories par type
	const filteredCategories = categories.filter(c => c.type === form.type)

	// Validation du formulaire
	const validate = () => {
		const newErrors = {}

		if (!form.account_id) {
			newErrors.account_id = 'Veuillez sélectionner un compte'
		}

		if (!form.amount || parseFloat(form.amount) <= 0) {
			newErrors.amount = 'Veuillez saisir un montant valide'
		}

		if (!form.start_date) {
			newErrors.start_date = 'Veuillez sélectionner une date'
		}

		if (!form.description?.trim()) {
			newErrors.description = 'Veuillez saisir une description'
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
			amount: parseFloat(form.amount),
			category_id: form.category_id || null
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

	return (
		<form onSubmit={handleSubmit}>
			{/* Type */}
			<div className="mb-5">
				<label className="block mb-2 text-sm font-medium text-text-secondary">Type</label>
				<TypeSelector
					value={form.type}
					onChange={handleTypeChange}
					disabled={isLocked('type')}
				/>
			</div>

			{/* Montant et Fréquence */}
			<div className="flex gap-4 mb-5">
				<div className="flex-1">
					<FormInput
						type="number"
						label="Montant"
						required
						value={form.amount}
						onChange={(e) => updateField('amount', e.target.value)}
						placeholder="0.00"
						step="0.01"
						min="0"
						error={errors.amount}
						disabled={isLocked('amount')}
					/>
				</div>
				<div className="flex-1">
					<label className="block mb-2 text-sm font-medium text-text-secondary">Fréquence</label>
					<StyledSelect
						options={frequencyOptions}
						value={form.frequency}
						onChange={(value) => updateField('frequency', value)}
						isDisabled={isLocked('frequency')}
					/>
				</div>
			</div>

			{/* Date de l'opération */}
			<div className="mb-5">
				<DatePicker
					label="Date de l'opération"
					required
					value={form.start_date}
					onChange={(value) => updateField('start_date', value)}
					error={errors.start_date}
					disabled={isLocked('start_date')}
				/>
			</div>

			{/* Compte */}
			<div className="mb-5">
				<label className="block mb-2 text-sm font-medium text-text-secondary">
					Compte
					<span className="text-red-500 font-semibold ml-1">*</span>
				</label>
				<StyledSelect
					options={accounts.map(acc => ({
						value: acc.id,
						label: acc.name,
						icon: acc.icon,
						color: acc.color
					}))}
					value={form.account_id}
					onChange={(value) => updateField('account_id', value)}
					placeholder="Sélectionner un compte"
					showIcons
					isDisabled={isLocked('account_id')}
				/>
				{errors.account_id && (
					<span className="text-red-400 text-xs mt-1">{errors.account_id}</span>
				)}
			</div>

			{/* Catégorie */}
			<div className="mb-5">
				<label className="block mb-2 text-sm font-medium text-text-secondary">Catégorie</label>
				<StyledSelect
					options={[
						{ value: '', label: 'Sans catégorie' },
						...filteredCategories.map(cat => ({
							value: cat.id,
							label: cat.name,
							icon: cat.icon,
							color: cat.color,
							parent_id: cat.parent_id
						}))
					]}
					value={form.category_id}
					onChange={(value) => updateField('category_id', value || '')}
					placeholder="Sans catégorie"
					showIcons
					groupByParent
					isSearchable
					isDisabled={isLocked('category_id')}
				/>
			</div>

			{/* Description */}
			<div className="mb-5">
				<FormInput
					label="Description"
					required
					value={form.description}
					onChange={(e) => updateField('description', e.target.value)}
					placeholder="Ex: Loyer, Salaire, Netflix..."
					error={errors.description}
					disabled={isLocked('description')}
				/>
			</div>

			{/* Footer avec boutons */}
			<div className="flex justify-between items-center pt-4 border-t border-border -mx-6 px-6 -mb-5 pb-5">
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

TypeSelector.propTypes = {
	value: PropTypes.oneOf(['expense', 'income']).isRequired,
	onChange: PropTypes.func.isRequired,
	disabled: PropTypes.bool
}

RecurringForm.propTypes = {
	initialData: PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		type: PropTypes.string,
		amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		frequency: PropTypes.string,
		start_date: PropTypes.string,
		account_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		category_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		description: PropTypes.string,
		is_active: PropTypes.bool
	}),
	lockedFields: PropTypes.arrayOf(PropTypes.string),
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func,
	onDelete: PropTypes.func,
	accounts: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
		name: PropTypes.string.isRequired,
		icon: PropTypes.string,
		color: PropTypes.string
	})),
	categories: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
		name: PropTypes.string.isRequired,
		type: PropTypes.string.isRequired,
		icon: PropTypes.string,
		color: PropTypes.string,
		parent_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
	})),
	submitLabel: PropTypes.string
}

export default RecurringForm
