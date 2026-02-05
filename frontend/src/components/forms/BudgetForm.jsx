import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import DeleteIcon from '@mui/icons-material/Delete'
import FormInput from '../ui/FormInput'
import CategorySelect from '../CategorySelect'

/**
 * Formulaire de budget réutilisable.
 *
 * @param {Object} initialData - Données initiales du formulaire
 * @param {Array} lockedFields - Champs verrouillés (non modifiables)
 * @param {Function} onSubmit - Callback avec les données validées
 * @param {Function} onCancel - Callback d'annulation
 * @param {Function} onDelete - Callback de suppression (optionnel, mode édition)
 * @param {Array} categories - Liste des catégories disponibles (type expense)
 * @param {Object} parentBudget - Budget parent (optionnel, pour affichage)
 * @param {string} submitLabel - Texte du bouton de soumission (défaut: "Créer")
 */
function BudgetForm({
	initialData = {},
	lockedFields = [],
	onSubmit,
	onCancel,
	onDelete,
	categories = [],
	parentBudget = null,
	submitLabel = 'Créer'
}) {
	// État du formulaire
	const [form, setForm] = useState({
		category_id: '',
		amount: '',
		parent_budget_id: null
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
		const newForm = {
			category_id: initialData.category_id || '',
			amount: initialData.amount ?? '',
			parent_budget_id: initialData.parent_budget_id || null
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

		if (!form.category_id) {
			newErrors.category_id = 'Veuillez sélectionner une catégorie'
		}

		if (!form.amount || parseFloat(form.amount) <= 0) {
			newErrors.amount = 'Veuillez saisir un montant valide'
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
			amount: parseFloat(form.amount)
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
			{/* Budget parent (affichage si c'est un budget enfant) */}
			{parentBudget && (
				<div className="mb-5">
					<label className="block text-sm text-text-secondary mb-2 font-medium">Budget parent</label>
					<div className="flex items-center gap-3 px-4 py-3 bg-bg-secondary border border-border rounded-lg opacity-60">
						<div
							className="w-8 h-8 rounded-lg flex items-center justify-center"
							style={{ backgroundColor: parentBudget.category_color || parentBudget.color || '#6b7280' }}
						>
							<img
								src={parentBudget.category_icon || parentBudget.icon || '/default/icons/dots.png'}
								alt=""
								className="w-5 h-5 brightness-0 invert"
							/>
						</div>
						<span className="text-text-primary font-medium">
							{parentBudget.category_name || parentBudget.name}
						</span>
					</div>
				</div>
			)}

			{/* Catégorie */}
			<div className="mb-5">
				<label className="block text-sm text-text-secondary mb-2 font-medium">
					Catégorie
					<span className="text-red-500 font-semibold ml-1">*</span>
				</label>
				{isLocked('category_id') ? (
					<div className="flex items-center gap-3 px-4 py-3 bg-bg-secondary border border-border rounded-lg opacity-60">
						{(() => {
							const cat = categories.find(c => c.id === form.category_id)
							if (!cat) return <span className="text-text-secondary">Catégorie non trouvée</span>
							return (
								<>
									<div
										className="w-8 h-8 rounded-lg flex items-center justify-center"
										style={{ backgroundColor: cat.color || '#6b7280' }}
									>
										<img
											src={cat.icon || '/default/icons/dots.png'}
											alt=""
											className="w-5 h-5 brightness-0 invert"
										/>
									</div>
									<span className="text-text-primary font-medium">{cat.name}</span>
								</>
							)
						})()}
					</div>
				) : (
					<CategorySelect
						categories={categories}
						value={form.category_id}
						onChange={(value) => updateField('category_id', value)}
					/>
				)}
				{errors.category_id && (
					<span className="text-red-400 text-xs mt-1 block">{errors.category_id}</span>
				)}
			</div>

			{/* Plafond mensuel */}
			<div className="mb-5">
				<FormInput
					type="number"
					label="Plafond mensuel (€)"
					required
					value={form.amount}
					onChange={(e) => updateField('amount', e.target.value)}
					placeholder="Ex: 450"
					step="0.01"
					min="0"
					error={errors.amount}
					disabled={isLocked('amount')}
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

BudgetForm.propTypes = {
	initialData: PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		category_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		parent_budget_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
	}),
	lockedFields: PropTypes.arrayOf(PropTypes.string),
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func,
	onDelete: PropTypes.func,
	categories: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
		name: PropTypes.string.isRequired,
		icon: PropTypes.string,
		color: PropTypes.string
	})),
	parentBudget: PropTypes.shape({
		category_name: PropTypes.string,
		category_color: PropTypes.string,
		category_icon: PropTypes.string,
		name: PropTypes.string,
		color: PropTypes.string,
		icon: PropTypes.string
	}),
	submitLabel: PropTypes.string
}

export default BudgetForm
