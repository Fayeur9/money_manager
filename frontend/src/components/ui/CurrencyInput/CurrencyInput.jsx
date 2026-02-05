import clsx from 'clsx'
import PropTypes from 'prop-types'

/**
 * Input de montant avec symbole de devise.
 *
 * @param {string} label - Label du champ
 * @param {string|number} value - Valeur du montant
 * @param {function} onChange - Callback onChange
 * @param {string} error - Message d'erreur
 * @param {boolean} required - Champ obligatoire
 * @param {boolean} disabled - Champ désactivé
 * @param {string} placeholder - Placeholder (défaut: "0.00")
 * @param {string} currency - Symbole de devise (défaut: "€")
 * @param {string} currencyPosition - Position du symbole: 'left', 'right' (défaut: 'right')
 * @param {number} min - Valeur minimale
 * @param {number} max - Valeur maximale
 * @param {number} step - Pas d'incrémentation (défaut: 0.01)
 * @param {string} className - Classes CSS additionnelles
 */
function CurrencyInput({
	label,
	value,
	onChange,
	error,
	required = false,
	disabled = false,
	placeholder = '0.00',
	currency = '€',
	currencyPosition = 'right',
	min,
	max,
	step = 0.01,
	className = ''
}) {
	const isLeft = currencyPosition === 'left'

	return (
		<div className={clsx('flex flex-col gap-1', className)}>
			{label && (
				<label className="text-sm font-medium text-text-secondary">
					{label}
					{required && <span className="text-red-500 font-semibold ml-1">*</span>}
				</label>
			)}
			<div className="relative">
				{isLeft && (
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium">
						{currency}
					</span>
				)}
				<input
					type="number"
					value={value}
					onChange={onChange}
					disabled={disabled}
					placeholder={placeholder}
					min={min}
					max={max}
					step={step}
					className={clsx(
						'w-full py-3 bg-bg-primary border rounded-lg text-text-primary text-base',
						'transition-all duration-300',
						'focus:outline-none',
						'[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
						isLeft ? 'pl-8 pr-4' : 'pl-4 pr-8',
						disabled && 'opacity-50 cursor-not-allowed',
						error
							? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
							: 'border-border focus:border-neon-cyan focus:shadow-[0_0_0_3px_rgba(0,240,255,0.1)]'
					)}
				/>
				{!isLeft && (
					<span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium">
						{currency}
					</span>
				)}
			</div>
			{error && (
				<span className="text-red-400 text-xs mt-0.5">{error}</span>
			)}
		</div>
	)
}

CurrencyInput.propTypes = {
	label: PropTypes.string,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	onChange: PropTypes.func.isRequired,
	error: PropTypes.string,
	required: PropTypes.bool,
	disabled: PropTypes.bool,
	placeholder: PropTypes.string,
	currency: PropTypes.string,
	currencyPosition: PropTypes.oneOf(['left', 'right']),
	min: PropTypes.number,
	max: PropTypes.number,
	step: PropTypes.number,
	className: PropTypes.string
}

export default CurrencyInput
