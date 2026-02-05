import PropTypes from 'prop-types'
import Modal from '../Modal'

/**
 * Wrapper Modal + Form standardisé
 * Simplifie le pattern répétitif Modal + Form avec onCancel automatique
 *
 * Supporte deux patterns d'utilisation :
 * 1. Avec FormComponent prop : <FormModal FormComponent={MyForm} formProps={{...}} />
 * 2. Avec children : <FormModal><MyForm {...props} /></FormModal>
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si la modal est ouverte
 * @param {Function} props.onClose - Callback de fermeture
 * @param {string} props.title - Titre de la modal
 * @param {React.ComponentType} props.FormComponent - Le composant formulaire à afficher (optionnel si children)
 * @param {Object} props.formProps - Props à passer au formulaire (optionnel si children)
 * @param {React.ReactNode} props.children - Contenu de la modal (alternative à FormComponent)
 * @param {string} props.size - Taille de la modal (sm, md, lg)
 */
function FormModal({
	isOpen,
	onClose,
	title,
	FormComponent,
	formProps = {},
	children,
	size = 'md'
}) {
	if (!isOpen) return null

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={title}
			size={size}
		>
			{children || (
				<FormComponent
					{...formProps}
					onCancel={formProps.onCancel || onClose}
				/>
			)}
		</Modal>
	)
}

FormModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	title: PropTypes.string.isRequired,
	FormComponent: PropTypes.elementType,
	formProps: PropTypes.object,
	children: PropTypes.node,
	size: PropTypes.oneOf(['sm', 'md', 'lg'])
}

export default FormModal
