import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import DeleteIcon from '@mui/icons-material/Delete'
import PaymentIcon from '@mui/icons-material/Payment'
import FormInput from '../ui/FormInput'
import CurrencyInput from '../ui/CurrencyInput'
import DatePicker from '../ui/DatePicker'
import StyledSelect from '../StyledSelect'
import ConfirmModal from '../ui/ConfirmModal'

/**
 * Formulaire d'avance.
 *
 * @param {Object} initialData - Données initiales du formulaire
 * @param {Array} accounts - Liste des comptes disponibles
 * @param {Function} onSubmit - Callback avec les données validées
 * @param {Function} onCancel - Callback d'annulation
 * @param {Function} onDelete - Callback de suppression (optionnel, mode édition)
 * @param {Function} onPayment - Callback pour enregistrer un remboursement
 * @param {string} submitLabel - Texte du bouton de soumission (défaut: "Créer")
 * @param {string} apiError - Message d'erreur de l'API
 * @param {string} direction - Direction de l'avance: 'given' (j'ai prêté) ou 'received' (on m'a prêté)
 */
function AdvanceForm({
	initialData = {},
	accounts = [],
	onSubmit,
	onCancel,
	onDelete,
	onPayment,
	submitLabel = 'Créer',
	apiError = '',
	direction = 'given'
}) {
	// Labels selon la direction
	const isGiven = direction === 'given'
	const labels = {
		amount: isGiven ? 'Montant prêté' : 'Montant emprunté',
		remaining: isGiven ? 'Reste à recevoir' : 'Reste à rembourser',
		paymentBtn: isGiven ? 'Enregistrer un remboursement' : 'Enregistrer un paiement',
		paymentAmount: isGiven ? 'Montant reçu' : 'Montant remboursé',
		date: isGiven ? "Date de l'avance" : "Date de l'emprunt",
		person: isGiven ? 'Qui vous doit' : 'À qui vous devez'
	}
	// État du formulaire
	const [form, setForm] = useState({
		person: '',
		amount: '',
		description: '',
		account_id: '',
		date: new Date().toISOString().split('T')[0],
		due_date: ''
	})

	// État pour le remboursement
	const [paymentAmount, setPaymentAmount] = useState('')
	const [showPaymentForm, setShowPaymentForm] = useState(false)

	// État pour la modal de confirmation de suppression
	const [showDeleteModal, setShowDeleteModal] = useState(false)

	// Erreurs de validation
	const [errors, setErrors] = useState({})

	// Mode édition ou création
	const isEditMode = !!initialData.id

	// Initialiser le formulaire avec les données initiales
	// Utiliser initialData.id comme dépendance stable pour éviter les re-renders
	useEffect(() => {
		const newForm = {
			person: initialData.person || '',
			amount: initialData.amount?.toString() || '',
			description: initialData.description || '',
			account_id: initialData.account_id || accounts[0]?.id || '',
			date: initialData.date || new Date().toISOString().split('T')[0],
			due_date: initialData.due_date || ''
		}
		setForm(newForm)
		setShowDeleteModal(false)
		setShowPaymentForm(false)
		setPaymentAmount('')
		setErrors({})
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialData.id])

	// Mettre à jour un champ
	const updateField = (field, value) => {
		setForm(prev => ({ ...prev, [field]: value }))
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: null }))
		}
	}

	// Valider le formulaire
	const validate = () => {
		const newErrors = {}

		if (!form.person?.trim()) {
			newErrors.person = 'Le nom est requis'
		}

		const amount = parseFloat(form.amount)
		if (isNaN(amount) || amount <= 0) {
			newErrors.amount = 'Le montant doit être supérieur à 0'
		}

		if (!form.account_id) {
			newErrors.account_id = 'Sélectionnez un compte'
		}

		if (!form.date) {
			newErrors.date = 'La date est requise'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// Soumettre le formulaire
	const handleSubmit = (e) => {
		e.preventDefault()

		if (!validate()) return

		const data = {
			person: form.person.trim(),
			amount: parseFloat(form.amount),
			description: form.description.trim(),
			account_id: form.account_id,
			date: form.date,
			due_date: form.due_date || null
		}

		onSubmit(data)
	}

	// Enregistrer un remboursement
	const handlePayment = () => {
		const amount = parseFloat(paymentAmount)
		if (isNaN(amount) || amount <= 0) {
			return
		}

		onPayment(amount)
		setShowPaymentForm(false)
		setPaymentAmount('')
	}

	// Options de comptes pour le select
	const accountOptions = accounts.map(acc => ({
		value: acc.id,
		label: acc.name
	}))

	// Montant restant à recevoir (mode édition)
	const remaining = isEditMode
		? initialData.amount - (initialData.amount_received || 0)
		: 0

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			{/* Erreur API */}
			{apiError && (
				<div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
					{apiError}
				</div>
			)}

			{/* Personne */}
			<FormInput
				label={labels.person}
				type="text"
				value={form.person}
				onChange={(e) => updateField('person', e.target.value)}
				placeholder="Nom de la personne"
				error={errors.person}
				autoFocus
			/>

			{/* Montant */}
			<div>
				<label className="block text-sm text-text-secondary mb-1">
					{labels.amount}
				</label>
				<CurrencyInput
					value={form.amount}
					onChange={(e) => updateField('amount', e.target.value)}
					disabled={isEditMode}
				/>
				{errors.amount && (
					<p className="text-red-500 text-xs mt-1">{errors.amount}</p>
				)}
			</div>

			{/* Compte */}
			<div>
				<label className="block text-sm text-text-secondary mb-1">
					Compte utilisé
				</label>
				<StyledSelect
					options={accountOptions}
					value={form.account_id}
					onChange={(value) => updateField('account_id', value)}
					placeholder="Sélectionner un compte"
					isDisabled={isEditMode}
				/>
				{errors.account_id && (
					<p className="text-red-500 text-xs mt-1">{errors.account_id}</p>
				)}
			</div>

			{/* Description */}
			<FormInput
				label="Description"
				type="text"
				value={form.description}
				onChange={(e) => updateField('description', e.target.value)}
				placeholder="Ex: Restaurant avec Pierre"
			/>

			{/* Dates */}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="block text-sm text-text-secondary mb-1">
						{labels.date}
					</label>
					<DatePicker
						value={form.date}
						onChange={(value) => updateField('date', value)}
						disabled={isEditMode}
					/>
					{errors.date && (
						<p className="text-red-500 text-xs mt-1">{errors.date}</p>
					)}
				</div>
				<div>
					<label className="block text-sm text-text-secondary mb-1">
						Date limite (optionnel)
					</label>
					<DatePicker
						value={form.due_date}
						onChange={(value) => updateField('due_date', value)}
					/>
				</div>
			</div>

			{/* Section remboursement (mode édition uniquement) */}
			{isEditMode && initialData.status !== 'paid' && (
				<div className="border-t border-border-primary pt-4 mt-2">
					<div className="flex items-center justify-between mb-3">
						<div>
							<p className="text-sm text-text-secondary">{labels.remaining}</p>
							<p className={`text-lg font-bold ${isGiven ? 'text-neon-cyan' : 'text-neon-purple'}`}>
								{remaining.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
							</p>
						</div>
						{!showPaymentForm && (
							<button
								type="button"
								onClick={() => setShowPaymentForm(true)}
								className="flex items-center gap-2 px-3 py-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors"
							>
								<PaymentIcon className="w-4 h-4" />
								{labels.paymentBtn}
							</button>
						)}
					</div>

					{showPaymentForm && (
						<div className="flex items-end gap-2 p-3 bg-bg-tertiary rounded-lg">
							<div className="flex-1">
								<label className="block text-sm text-text-secondary mb-1">
									{labels.paymentAmount}
								</label>
								<CurrencyInput
									value={paymentAmount}
									onChange={(e) => setPaymentAmount(e.target.value)}
									autoFocus
								/>
							</div>
							<button
								type="button"
								onClick={handlePayment}
								className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
							>
								Valider
							</button>
							<button
								type="button"
								onClick={() => {
									setShowPaymentForm(false)
									setPaymentAmount('')
								}}
								className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg hover:bg-bg-primary transition-colors"
							>
								Annuler
							</button>
						</div>
					)}
				</div>
			)}

			{/* Boutons d'action */}
			<div className="flex justify-between items-center pt-4 border-t border-border-primary">
				{/* Bouton supprimer (mode édition) */}
				{isEditMode && onDelete ? (
					<button
						type="button"
						onClick={() => setShowDeleteModal(true)}
						className="flex items-center gap-1.5 px-4 py-2.5 border border-red-500 bg-transparent rounded-lg text-red-500 font-medium cursor-pointer hover:bg-red-500/10"
					>
						<DeleteIcon fontSize="small" />
						Supprimer
					</button>
				) : (
					<div />
				)}

				{/* Boutons annuler/sauvegarder */}
				<div className="flex gap-2 ml-auto">
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
					>
						Annuler
					</button>
					<button
						type="submit"
						className="px-4 py-2 bg-neon-cyan text-bg-primary font-medium rounded-lg hover:bg-neon-cyan/80 transition-colors"
					>
						{submitLabel}
					</button>
				</div>
			</div>

			{/* Modal de confirmation de suppression */}
			<ConfirmModal
				isOpen={showDeleteModal}
				onClose={() => setShowDeleteModal(false)}
				onConfirm={() => {
					setShowDeleteModal(false)
					onDelete?.()
				}}
				title={isGiven ? "Supprimer l'avance" : "Supprimer l'emprunt"}
				confirmText="Supprimer"
				variant="danger"
			>
				<p className="m-0">
					Êtes-vous sûr de vouloir supprimer {isGiven ? 'cette avance' : 'cet emprunt'} pour{' '}
					<strong className="text-text-primary">{form.person}</strong> ?
				</p>
			</ConfirmModal>
		</form>
	)
}

AdvanceForm.propTypes = {
	initialData: PropTypes.object,
	accounts: PropTypes.array,
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
	onDelete: PropTypes.func,
	onPayment: PropTypes.func,
	submitLabel: PropTypes.string,
	apiError: PropTypes.string,
	direction: PropTypes.oneOf(['given', 'received'])
}

export default AdvanceForm
