import Modal from '../Modal'

/**
 * Modal de confirmation pour actions destructives
 * @param {Object} props
 * @param {boolean} props.isOpen - Si la modal est ouverte
 * @param {Function} props.onClose - Callback de fermeture
 * @param {Function} props.onConfirm - Callback de confirmation
 * @param {string} props.title - Titre de la modal
 * @param {React.ReactNode} props.children - Message de confirmation
 * @param {string} props.confirmText - Texte du bouton de confirmation
 * @param {string} props.cancelText - Texte du bouton d'annulation
 * @param {string} props.variant - Variante (danger, warning)
 */
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation',
  children,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger'
}) {
  const confirmButtonClasses = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-amber-500 hover:bg-amber-600'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 bg-transparent border border-border rounded-lg text-text-secondary font-medium cursor-pointer transition-all duration-200 hover:bg-white/5 hover:text-text-primary"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-3 border-none rounded-lg text-white font-semibold cursor-pointer transition-all duration-200 ${confirmButtonClasses[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="text-text-secondary leading-relaxed">
        {children}
      </div>
    </Modal>
  )
}

export default ConfirmModal
