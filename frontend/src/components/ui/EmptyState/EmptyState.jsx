import clsx from 'clsx'
import PropTypes from 'prop-types'
import InboxIcon from '@mui/icons-material/Inbox'

/**
 * Composant d'état vide réutilisable.
 * Affiche un message et une icône quand il n'y a pas de données.
 *
 * @param {string} message - Message principal à afficher
 * @param {string} description - Description secondaire (optionnel)
 * @param {React.ReactNode} icon - Icône MUI à afficher (défaut: InboxIcon)
 * @param {React.ReactNode} action - Bouton ou action à afficher (optionnel)
 * @param {string} size - Taille: 'sm', 'md', 'lg' (défaut: 'md')
 * @param {boolean} bordered - Ajouter une bordure dashed (défaut: false)
 * @param {boolean} card - Afficher avec fond de carte (défaut: false)
 * @param {string} className - Classes CSS additionnelles
 */
function EmptyState({
	message = 'Aucun élément',
	description = '',
	icon: Icon = InboxIcon,
	action = null,
	size = 'md',
	bordered = false,
	card = false,
	className = ''
}) {
	// Configuration des tailles
	const sizeConfig = {
		sm: {
			padding: 'py-6',
			iconSize: 'text-3xl',
			messageSize: 'text-sm',
			descriptionSize: 'text-xs',
			gap: 'gap-2'
		},
		md: {
			padding: 'py-8',
			iconSize: 'text-4xl',
			messageSize: 'text-base',
			descriptionSize: 'text-sm',
			gap: 'gap-3'
		},
		lg: {
			padding: 'py-12',
			iconSize: 'text-6xl',
			messageSize: 'text-lg',
			descriptionSize: 'text-base',
			gap: 'gap-4'
		}
	}

	const config = sizeConfig[size] || sizeConfig.md

	return (
		<div
			className={clsx(
				'flex flex-col items-center justify-center text-center',
				config.padding,
				config.gap,
				card && 'bg-bg-card rounded-xl',
				bordered && 'border border-dashed border-border',
				className
			)}
		>
			{Icon && (
				<Icon className={clsx(config.iconSize, 'text-text-secondary opacity-50')} />
			)}
			<p className={clsx(config.messageSize, 'text-text-secondary m-0')}>
				{message}
			</p>
			{description && (
				<p className={clsx(config.descriptionSize, 'text-text-secondary opacity-70 m-0')}>
					{description}
				</p>
			)}
			{action && (
				<div className="mt-2">
					{action}
				</div>
			)}
		</div>
	)
}

EmptyState.propTypes = {
	message: PropTypes.string,
	description: PropTypes.string,
	icon: PropTypes.elementType,
	action: PropTypes.node,
	size: PropTypes.oneOf(['sm', 'md', 'lg']),
	bordered: PropTypes.bool,
	card: PropTypes.bool,
	className: PropTypes.string
}

export default EmptyState
