import PropTypes from 'prop-types'
import WarningIcon from '@mui/icons-material/Warning'
import CategoryIcon from '@mui/icons-material/Category'
import BlockIcon from '@mui/icons-material/Block'

/**
 * Modal affichée quand les catégories d'avances/remboursements sont manquantes
 *
 * @param {boolean} isOpen - Si la modal est ouverte
 * @param {Function} onCreateCategories - Callback pour créer les catégories et continuer
 * @param {Function} onSkipTransaction - Callback pour continuer sans créer de transaction
 * @param {Function} onCancel - Callback d'annulation
 * @param {boolean} loading - Indicateur de chargement
 */
function CategoryMissingModal({
	isOpen,
	onCreateCategories,
	onSkipTransaction,
	onCancel,
	loading = false
}) {
	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-bg-card border border-border rounded-2xl max-w-md w-full p-6">
				<div className="flex items-center gap-3 mb-4">
					<div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
						<WarningIcon className="text-yellow-500" />
					</div>
					<div>
						<h3 className="text-lg font-semibold text-text-primary">Catégories manquantes</h3>
						<p className="text-sm text-text-secondary">
							Les catégories nécessaires n'existent pas
						</p>
					</div>
				</div>

				<p className="text-sm text-text-secondary mb-6">
					Pour créer automatiquement des transactions lors des avances et remboursements,
					les catégories "Avances", "Remboursements", "Emprunts" et "Remboursement d'emprunt" sont nécessaires.
				</p>

				<div className="flex flex-col gap-3">
					<button
						onClick={onCreateCategories}
						disabled={loading}
						className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-neon-cyan text-bg-primary font-semibold rounded-xl hover:bg-neon-cyan/90 transition-colors disabled:opacity-50"
					>
						<CategoryIcon fontSize="small" />
						{loading ? 'Création...' : 'Créer les catégories et continuer'}
					</button>

					<button
						onClick={onSkipTransaction}
						disabled={loading}
						className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-bg-secondary text-text-secondary font-medium rounded-xl hover:bg-bg-tertiary transition-colors disabled:opacity-50"
					>
						<BlockIcon fontSize="small" />
						Continuer sans transaction
					</button>

					<button
						onClick={onCancel}
						disabled={loading}
						className="w-full px-4 py-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
					>
						Annuler
					</button>
				</div>
			</div>
		</div>
	)
}

CategoryMissingModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onCreateCategories: PropTypes.func.isRequired,
	onSkipTransaction: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
	loading: PropTypes.bool
}

export default CategoryMissingModal
