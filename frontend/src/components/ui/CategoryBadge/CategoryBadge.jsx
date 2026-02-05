import clsx from 'clsx'
import PropTypes from 'prop-types'

/**
 * Badge de catégorie réutilisable.
 * Affiche l'icône d'une catégorie avec sa couleur de fond.
 *
 * @param {string} color - Couleur de fond de la catégorie
 * @param {string} icon - Chemin vers l'icône
 * @param {string} name - Nom de la catégorie (optionnel, pour affichage)
 * @param {string} size - Taille du badge: 'xs', 'sm', 'md', 'lg' (défaut: 'md')
 * @param {boolean} showName - Afficher le nom à côté de l'icône (défaut: false)
 * @param {boolean} invertIcon - Inverser les couleurs de l'icône pour fond coloré (défaut: true)
 * @param {string} className - Classes CSS additionnelles
 * @param {function} onClick - Callback au clic (optionnel)
 */
function CategoryBadge({
	color = '#6b7280',
	icon = '/default/icons/dots.png',
	name = '',
	size = 'md',
	showName = false,
	invertIcon = true,
	className = '',
	onClick
}) {
	// Configuration des tailles
	const sizeConfig = {
		xs: {
			container: 'w-6 h-6 rounded-md',
			icon: 'w-3 h-3',
			text: 'text-xs',
			gap: 'gap-1.5'
		},
		sm: {
			container: 'w-8 h-8 rounded-lg',
			icon: 'w-4 h-4',
			text: 'text-sm',
			gap: 'gap-2'
		},
		md: {
			container: 'w-10 h-10 rounded-lg',
			icon: 'w-5 h-5',
			text: 'text-sm',
			gap: 'gap-2.5'
		},
		lg: {
			container: 'w-12 h-12 rounded-xl',
			icon: 'w-6 h-6',
			text: 'text-base',
			gap: 'gap-3'
		}
	}

	const config = sizeConfig[size] || sizeConfig.md

	const iconElement = (
		<div
			className={clsx(
				config.container,
				'flex items-center justify-center shrink-0',
				onClick && 'cursor-pointer'
			)}
			style={{ backgroundColor: color }}
			onClick={!showName ? onClick : undefined}
		>
			<img
				src={icon}
				alt=""
				className={clsx(
					config.icon,
					'object-contain',
					invertIcon && 'brightness-0 invert'
				)}
			/>
		</div>
	)

	if (!showName || !name) {
		return iconElement
	}

	return (
		<div
			className={clsx(
				'flex items-center',
				config.gap,
				onClick && 'cursor-pointer',
				className
			)}
			onClick={onClick}
		>
			{iconElement}
			<span className={clsx(config.text, 'text-text-primary truncate')}>
				{name}
			</span>
		</div>
	)
}

CategoryBadge.propTypes = {
	color: PropTypes.string,
	icon: PropTypes.string,
	name: PropTypes.string,
	size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
	showName: PropTypes.bool,
	invertIcon: PropTypes.bool,
	className: PropTypes.string,
	onClick: PropTypes.func
}

export default CategoryBadge
