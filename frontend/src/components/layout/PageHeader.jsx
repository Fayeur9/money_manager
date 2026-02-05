import clsx from 'clsx'
import PropTypes from 'prop-types'

/**
 * Header de page avec titre, sous-titre et actions flexibles
 * @param {Object} props
 * @param {string} props.title - Titre de la page
 * @param {string} props.subtitle - Sous-titre optionnel
 * @param {React.ReactNode} props.actions - Actions (boutons, selects, etc.) - alternative à children
 * @param {React.ReactNode} props.children - Actions (boutons, selects, etc.) - alternative à actions
 * @param {string} props.className - Classes additionnelles
 */
function PageHeader({ title, subtitle, actions, children, className }) {
	const actionsContent = actions || children

	return (
		<div className={clsx(
			'flex justify-between items-center mb-8 max-md:flex-col max-md:gap-4 max-md:items-start',
			className
		)}>
			<div>
				<h1 className="text-3xl text-text-primary m-0">{title}</h1>
				{subtitle && (
					<p className="text-sm text-text-secondary mt-1 m-0">{subtitle}</p>
				)}
			</div>
			{actionsContent && (
				<div className="flex gap-3 max-md:w-full max-md:flex-wrap">
					{actionsContent}
				</div>
			)}
		</div>
	)
}

PageHeader.propTypes = {
	title: PropTypes.string.isRequired,
	subtitle: PropTypes.string,
	actions: PropTypes.node,
	children: PropTypes.node,
	className: PropTypes.string
}

export default PageHeader
