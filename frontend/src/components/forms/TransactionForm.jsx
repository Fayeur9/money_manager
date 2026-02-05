import { useState, useEffect } from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import DeleteIcon from '@mui/icons-material/Delete'
import FormInput from '../ui/FormInput'
import DatePicker from '../ui/DatePicker'
import StyledSelect from '../StyledSelect'
import ConfirmModal from '../ui/ConfirmModal'

/**
 * Sélecteur de type de transaction (Dépense/Revenu/Transfert)
 */
function TypeSelector({ value, onChange, includeTransfer = true, disabled = false }) {
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
			{includeTransfer && (
				<button
					type="button"
					disabled={disabled}
					className={clsx(
						'flex-1 py-3 rounded-lg border bg-bg-secondary font-medium transition-all duration-200',
						disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
						value === 'transfer'
							? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
							: 'border-border text-text-secondary hover:border-text-secondary'
					)}
					onClick={() => !disabled && onChange('transfer')}
				>
					Transfert
				</button>
			)}
		</div>
	)
}

/**
 * Formulaire de transaction réutilisable.
 *
 * @param {Object} initialData - Données initiales du formulaire
 * @param {Array} lockedFields - Champs verrouillés (non modifiables)
 * @param {Function} onSubmit - Callback avec les données validées
 * @param {Function} onCancel - Callback d'annulation
 * @param {Function} onDelete - Callback de suppression (optionnel, mode édition)
 * @param {Array} accounts - Liste des comptes disponibles
 * @param {Array} categories - Liste des catégories disponibles
 * @param {string} submitLabel - Texte du bouton de soumission (défaut: "Créer")
 * @param {boolean} includeTransfer - Inclure l'option transfert (défaut: true)
 */
function TransactionForm({
	initialData = {},
	lockedFields = [],
	onSubmit,
	onCancel,
	onDelete,
	accounts = [],
	categories = [],
	submitLabel = 'Créer',
	includeTransfer = true
}) {
	// État du formulaire
	const [form, setForm] = useState({
		type: 'expense',
		amount: '',
		date: new Date().toISOString().split('T')[0],
		account_id: '',
		target_account_id: '',
		category_id: '',
		description: ''
	})

	// État pour la modal de confirmation de suppression
	const [showDeleteModal, setShowDeleteModal] = useState(false)

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
			date: initialData.date || new Date().toISOString().split('T')[0],
			account_id: initialData.account_id || defaultAccountId,
			target_account_id: initialData.target_account_id || '',
			category_id: initialData.category_id || '',
			description: initialData.description || ''
		}
		setForm(newForm)
		setInitialFormValues(newForm)
		setShowDeleteModal(false)
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

	// Changer le type (reset category et target_account)
	const handleTypeChange = (type) => {
		if (isLocked('type')) return
		setForm(prev => ({
			...prev,
			type,
			category_id: '',
			target_account_id: ''
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

		if (!form.date) {
			newErrors.date = 'Veuillez sélectionner une date'
		}

		if (form.type === 'transfer' && !form.target_account_id) {
			newErrors.target_account_id = 'Veuillez sélectionner un compte destinataire'
		}

		if (form.type === 'transfer' && form.account_id === form.target_account_id) {
			newErrors.target_account_id = 'Le compte destinataire doit être différent'
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
			category_id: form.type === 'transfer' ? null : (form.category_id || null),
			target_account_id: form.type === 'transfer' ? form.target_account_id : null
		}

		onSubmit(data)
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

	return (
		<form onSubmit={handleSubmit}>
			{/* Type de transaction */}
			<div className="mb-5">
				<label className="block mb-2 text-sm font-medium text-text-secondary">Type</label>
				<TypeSelector
					value={form.type}
					onChange={handleTypeChange}
					includeTransfer={includeTransfer}
					disabled={isLocked('type')}
				/>
			</div>

			{/* Montant et Date */}
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
					<DatePicker
						label="Date"
						required
						value={form.date}
						onChange={(value) => updateField('date', value)}
						error={errors.date}
						disabled={isLocked('date')}
					/>
				</div>
			</div>

			{/* Compte source */}
			<div className="mb-5">
				<label className="block mb-2 text-sm font-medium text-text-secondary">
					{form.type === 'transfer' ? 'Compte source' : 'Compte'}
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

			{/* Compte destinataire (transfert uniquement) */}
			{form.type === 'transfer' && (
				<div className="mb-5">
					<label className="block mb-2 text-sm font-medium text-text-secondary">
						Compte destinataire
						<span className="text-red-500 font-semibold ml-1">*</span>
					</label>
					<StyledSelect
						options={accounts
							.filter(acc => acc.id !== form.account_id)
							.map(acc => ({
								value: acc.id,
								label: acc.name,
								icon: acc.icon,
								color: acc.color
							}))}
						value={form.target_account_id}
						onChange={(value) => updateField('target_account_id', value)}
						placeholder="Sélectionner un compte"
						showIcons
						isDisabled={isLocked('target_account_id')}
					/>
					{errors.target_account_id && (
						<span className="text-red-400 text-xs mt-1">{errors.target_account_id}</span>
					)}
				</div>
			)}

			{/* Catégorie (sauf transfert) */}
			{form.type !== 'transfer' && (
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
			)}

			{/* Description */}
			<div className="mb-5">
				<FormInput
					label="Description"
					value={form.description}
					onChange={(e) => updateField('description', e.target.value)}
					placeholder={form.type === 'transfer' ? 'Ex: Épargne mensuelle' : 'Ex: Courses alimentaires'}
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
				title="Supprimer la transaction"
				confirmText="Supprimer"
				variant="danger"
			>
				<p className="m-0">
					Êtes-vous sûr de vouloir supprimer cette transaction ?
				</p>
			</ConfirmModal>
		</form>
	)
}

TypeSelector.propTypes = {
	value: PropTypes.oneOf(['expense', 'income', 'transfer']).isRequired,
	onChange: PropTypes.func.isRequired,
	includeTransfer: PropTypes.bool,
	disabled: PropTypes.bool
}

TransactionForm.propTypes = {
	initialData: PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		type: PropTypes.string,
		amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		date: PropTypes.string,
		account_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		target_account_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		category_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		description: PropTypes.string
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
	submitLabel: PropTypes.string,
	includeTransfer: PropTypes.bool
}

export default TransactionForm
