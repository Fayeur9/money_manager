import clsx from 'clsx'
import PropTypes from 'prop-types'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'

/**
 * Input de recherche avec icône et bouton clear.
 *
 * @param {string} value - Valeur de la recherche
 * @param {function} onChange - Callback onChange
 * @param {function} onClear - Callback pour effacer (optionnel)
 * @param {string} placeholder - Placeholder (défaut: "Rechercher...")
 * @param {boolean} disabled - Champ désactivé
 * @param {boolean} showClearButton - Afficher le bouton clear (défaut: true)
 * @param {string} size - Taille: 'sm', 'md', 'lg' (défaut: 'md')
 * @param {string} className - Classes CSS additionnelles
 */
function SearchInput({
	value,
	onChange,
	onClear,
	placeholder = 'Rechercher...',
	disabled = false,
	showClearButton = true,
	size = 'md',
	className = ''
}) {
	// Configuration des tailles
	const sizeConfig = {
		sm: {
			padding: 'py-1.5 px-3',
			text: 'text-sm',
			iconSize: 'text-lg',
			clearSize: 'w-5 h-5'
		},
		md: {
			padding: 'py-2 px-4',
			text: 'text-sm',
			iconSize: 'text-xl',
			clearSize: 'w-6 h-6'
		},
		lg: {
			padding: 'py-3 px-5',
			text: 'text-base',
			iconSize: 'text-2xl',
			clearSize: 'w-7 h-7'
		}
	}

	const config = sizeConfig[size] || sizeConfig.md

	const handleClear = () => {
		if (onClear) {
			onClear()
		} else if (onChange) {
			// Simuler un event pour effacer
			onChange({ target: { value: '' } })
		}
	}

	return (
		<div
			className={clsx(
				'flex items-center gap-2 rounded-lg border bg-bg-secondary transition-all duration-200',
				'focus-within:border-neon-cyan focus-within:shadow-[0_0_0_3px_rgba(0,240,255,0.1)]',
				'border-border',
				config.padding,
				disabled && 'opacity-50 cursor-not-allowed',
				className
			)}
		>
			<SearchIcon className={clsx('text-text-secondary', config.iconSize)} />
			<input
				type="text"
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				disabled={disabled}
				className={clsx(
					'flex-1 border-none bg-transparent text-text-primary outline-none',
					'placeholder:text-text-secondary',
					config.text
				)}
			/>
			{showClearButton && value && (
				<button
					type="button"
					onClick={handleClear}
					disabled={disabled}
					className={clsx(
						'flex items-center justify-center rounded-full bg-transparent text-text-secondary',
						'transition-colors duration-200 hover:text-text-primary hover:bg-white/10',
						'border-none cursor-pointer',
						config.clearSize
					)}
					title="Effacer"
				>
					<CloseIcon fontSize="small" />
				</button>
			)}
		</div>
	)
}

SearchInput.propTypes = {
	value: PropTypes.string,
	onChange: PropTypes.func.isRequired,
	onClear: PropTypes.func,
	placeholder: PropTypes.string,
	disabled: PropTypes.bool,
	showClearButton: PropTypes.bool,
	size: PropTypes.oneOf(['sm', 'md', 'lg']),
	className: PropTypes.string
}

export default SearchInput
