import clsx from 'clsx'
import PropTypes from 'prop-types'

/**
 * Affichage de montant formaté avec couleur selon le type.
 *
 * @param {number|string} amount - Montant à afficher
 * @param {string} type - Type de transaction: 'income', 'expense', 'transfer', 'neutral' (défaut: 'neutral')
 * @param {string} size - Taille du texte: 'xs', 'sm', 'md', 'lg', 'xl' (défaut: 'md')
 * @param {boolean} showSign - Afficher le signe +/- (défaut: true pour income/expense)
 * @param {string} currency - Devise (défaut: 'EUR')
 * @param {string} locale - Locale pour le formatage (défaut: 'fr-FR')
 * @param {string} className - Classes CSS additionnelles
 * @param {boolean} bold - Texte en gras (défaut: true)
 */
function AmountDisplay({
	amount,
	type = 'neutral',
	size = 'md',
	showSign = true,
	currency = 'EUR',
	locale = 'fr-FR',
	className = '',
	bold = true
}) {
	// Formatage du montant
	const formatCurrency = (value) => {
		const num = typeof value === 'string' ? parseFloat(value) : value
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency: currency
		}).format(Math.abs(num))
	}

	// Configuration des couleurs par type
	const colorConfig = {
		income: 'text-green-500',
		expense: 'text-red-500',
		transfer: 'text-neon-cyan',
		neutral: 'text-text-primary',
		positive: 'text-green-500',
		negative: 'text-red-500'
	}

	// Configuration des tailles
	const sizeConfig = {
		xs: 'text-xs',
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg',
		xl: 'text-xl',
		'2xl': 'text-2xl'
	}

	// Déterminer le signe à afficher
	const getSign = () => {
		if (!showSign) return ''
		switch (type) {
			case 'income':
			case 'positive':
				return '+'
			case 'expense':
			case 'negative':
				return '-'
			default:
				return ''
		}
	}

	const formattedAmount = formatCurrency(amount)
	const sign = getSign()

	return (
		<span
			className={clsx(
				sizeConfig[size] || sizeConfig.md,
				colorConfig[type] || colorConfig.neutral,
				bold && 'font-semibold',
				className
			)}
		>
			{sign}{formattedAmount}
		</span>
	)
}

AmountDisplay.propTypes = {
	amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	type: PropTypes.oneOf(['income', 'expense', 'transfer', 'neutral', 'positive', 'negative']),
	size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
	showSign: PropTypes.bool,
	currency: PropTypes.string,
	locale: PropTypes.string,
	className: PropTypes.string,
	bold: PropTypes.bool
}

export default AmountDisplay
