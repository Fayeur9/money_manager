import clsx from 'clsx'
import PropTypes from 'prop-types'

/**
 * Bouton d'action avec icône et variantes de style
 *
 * @param {React.ElementType} icon - Composant icône MUI (ex: EditIcon)
 * @param {function} onClick - Callback au clic
 * @param {string} title - Titre/tooltip du bouton
 * @param {string} variant - Variante de style: 'default', 'danger', 'success', 'warning', 'ghost'
 * @param {string} size - Taille: 'sm', 'md', 'lg'
 * @param {boolean} disabled - Désactiver le bouton
 * @param {string} className - Classes CSS additionnelles
 */
function ActionButton({
	icon: Icon,
	onClick,
	title,
	variant = 'default',
	size = 'md',
	disabled = false,
	className
}) {
	// Configuration des tailles
	const sizeConfig = {
		sm: {
			button: 'p-1.5',
			icon: { fontSize: 18 }
		},
		md: {
			button: 'w-9 h-9',
			icon: { fontSize: 20 }
		},
		lg: {
			button: 'w-11 h-11',
			icon: { fontSize: 24 }
		}
	}

	// Configuration des variantes
	const variantConfig = {
		default: 'border border-border bg-bg-secondary hover:border-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/10',
		danger: 'border border-border bg-bg-secondary hover:border-red-500 hover:text-red-500 hover:bg-red-500/10',
		success: 'border border-border bg-bg-secondary hover:border-green-500 hover:text-green-500 hover:bg-green-500/10',
		warning: 'border border-border bg-bg-secondary hover:border-amber-500 hover:text-amber-500 hover:bg-amber-500/10',
		ghost: 'border-none bg-transparent hover:bg-white/10'
	}

	const config = sizeConfig[size] || sizeConfig.md
	const variantClasses = variantConfig[variant] || variantConfig.default

	return (
		<button
			type="button"
			className={clsx(
				'rounded-lg text-text-secondary cursor-pointer flex items-center justify-center transition-all duration-200',
				config.button,
				variantClasses,
				disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
				className
			)}
			onClick={onClick}
			title={title}
			disabled={disabled}
		>
			<Icon style={config.icon} />
		</button>
	)
}

ActionButton.propTypes = {
	icon: PropTypes.elementType.isRequired,
	onClick: PropTypes.func,
	title: PropTypes.string,
	variant: PropTypes.oneOf(['default', 'danger', 'success', 'warning', 'ghost']),
	size: PropTypes.oneOf(['sm', 'md', 'lg']),
	disabled: PropTypes.bool,
	className: PropTypes.string
}

export default ActionButton
