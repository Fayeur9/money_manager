import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = [
	'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
	'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

/**
 * DatePicker personnalisé avec calendrier dropdown.
 *
 * @param {string} label - Label du champ
 * @param {string} value - Valeur (format YYYY-MM-DD)
 * @param {function} onChange - Callback onChange (reçoit la date au format YYYY-MM-DD)
 * @param {string} error - Message d'erreur
 * @param {boolean} required - Champ obligatoire
 * @param {boolean} disabled - Champ désactivé
 * @param {string} min - Date minimale (YYYY-MM-DD)
 * @param {string} max - Date maximale (YYYY-MM-DD)
 * @param {string} placeholder - Placeholder
 * @param {string} className - Classes CSS additionnelles
 */
function DatePicker({
	label,
	value,
	onChange,
	error,
	required = false,
	disabled = false,
	min,
	max,
	placeholder = 'Sélectionner une date',
	className = ''
}) {
	const [isOpen, setIsOpen] = useState(false)
	const [viewDate, setViewDate] = useState(() => {
		if (value) return new Date(value)
		return new Date()
	})
	const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 })
	const containerRef = useRef(null)
	const buttonRef = useRef(null)
	const calendarRef = useRef(null)

	// Calculer la position du calendrier
	const updateCalendarPosition = () => {
		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect()
			const calendarHeight = 380 // Hauteur approximative du calendrier
			const calendarWidth = 300
			const padding = 8

			let top = rect.bottom + padding
			let left = rect.left

			// Si le calendrier dépasse en bas, l'afficher au-dessus
			if (top + calendarHeight > window.innerHeight) {
				top = rect.top - calendarHeight - padding
			}

			// Si le calendrier dépasse à droite, l'aligner à droite
			if (left + calendarWidth > window.innerWidth) {
				left = rect.right - calendarWidth
			}

			// S'assurer que le calendrier ne dépasse pas à gauche
			if (left < padding) {
				left = padding
			}

			setCalendarPosition({ top, left })
		}
	}

	// Mettre à jour la position quand le calendrier s'ouvre
	useEffect(() => {
		if (isOpen) {
			updateCalendarPosition()
			window.addEventListener('scroll', updateCalendarPosition, true)
			window.addEventListener('resize', updateCalendarPosition)
			return () => {
				window.removeEventListener('scroll', updateCalendarPosition, true)
				window.removeEventListener('resize', updateCalendarPosition)
			}
		}
	}, [isOpen])

	// Fermer le calendrier quand on clique à l'extérieur
	useEffect(() => {
		const handleClickOutside = (e) => {
			const clickedInsideContainer = containerRef.current?.contains(e.target)
			const clickedInsideCalendar = calendarRef.current?.contains(e.target)
			if (!clickedInsideContainer && !clickedInsideCalendar) {
				setIsOpen(false)
			}
		}
		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isOpen])

	// Fermer avec Échap
	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === 'Escape') setIsOpen(false)
		}
		if (isOpen) {
			document.addEventListener('keydown', handleEscape)
			return () => document.removeEventListener('keydown', handleEscape)
		}
	}, [isOpen])

	// Mettre à jour viewDate quand value change
	useEffect(() => {
		if (value) {
			setViewDate(new Date(value))
		}
	}, [value])

	// Formater la date pour l'affichage
	const formatDisplayDate = (dateStr) => {
		if (!dateStr) return ''
		const date = new Date(dateStr)
		return date.toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		})
	}

	// Navigation dans le calendrier
	const goToPrevMonth = () => {
		setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
	}

	const goToNextMonth = () => {
		setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
	}

	const goToToday = () => {
		const today = new Date()
		setViewDate(today)
		selectDate(today)
	}

	// Formater une date en YYYY-MM-DD (sans conversion UTC)
	const formatDateToString = (date) => {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	// Sélectionner une date
	const selectDate = (date) => {
		const formatted = formatDateToString(date)
		onChange(formatted)
		setIsOpen(false)
	}

	// Vérifier si une date est désactivée
	const isDateDisabled = (date) => {
		const dateStr = formatDateToString(date)
		if (min && dateStr < min) return true
		if (max && dateStr > max) return true
		return false
	}

	// Générer les jours du mois
	const generateCalendarDays = () => {
		const year = viewDate.getFullYear()
		const month = viewDate.getMonth()

		// Premier jour du mois (0 = Dimanche, on veut Lundi = 0)
		const firstDay = new Date(year, month, 1)
		let startDay = firstDay.getDay() - 1
		if (startDay < 0) startDay = 6 // Dimanche devient 6

		// Nombre de jours dans le mois
		const daysInMonth = new Date(year, month + 1, 0).getDate()

		// Jours du mois précédent
		const daysInPrevMonth = new Date(year, month, 0).getDate()

		const days = []

		// Jours du mois précédent
		for (let i = startDay - 1; i >= 0; i--) {
			const day = daysInPrevMonth - i
			const date = new Date(year, month - 1, day)
			days.push({ date, isCurrentMonth: false })
		}

		// Jours du mois actuel
		for (let i = 1; i <= daysInMonth; i++) {
			const date = new Date(year, month, i)
			days.push({ date, isCurrentMonth: true })
		}

		// Jours du mois suivant
		const remainingDays = 42 - days.length // 6 lignes * 7 jours
		for (let i = 1; i <= remainingDays; i++) {
			const date = new Date(year, month + 1, i)
			days.push({ date, isCurrentMonth: false })
		}

		return days
	}

	const selectedDateStr = value || ''
	const todayStr = formatDateToString(new Date())

	return (
		<div ref={containerRef} className={clsx('relative flex flex-col gap-1', className)}>
			{label && (
				<label className="text-sm font-medium text-text-secondary">
					{label}
					{required && <span className="text-red-500 font-semibold ml-1">*</span>}
				</label>
			)}

			{/* Input affiché */}
			<button
				ref={buttonRef}
				type="button"
				onClick={() => !disabled && setIsOpen(!isOpen)}
				disabled={disabled}
				className={clsx(
					'w-full px-4 py-3 pr-10 bg-bg-primary border rounded-lg text-left text-base',
					'transition-all duration-300',
					'focus:outline-none',
					disabled && 'opacity-50 cursor-not-allowed',
					error
						? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
						: isOpen
							? 'border-neon-cyan shadow-[0_0_0_3px_rgba(0,240,255,0.1)]'
							: 'border-border hover:border-text-secondary focus:border-neon-cyan focus:shadow-[0_0_0_3px_rgba(0,240,255,0.1)]',
					value ? 'text-text-primary' : 'text-text-secondary'
				)}
			>
				{value ? formatDisplayDate(value) : placeholder}
			</button>

			<CalendarTodayIcon
				className="absolute right-3 top-[calc(50%+0.5rem)] -translate-y-1/2 text-text-secondary pointer-events-none"
				fontSize="small"
				style={{ top: label ? 'calc(50% + 0.75rem)' : '50%' }}
			/>

			{error && (
				<span className="text-red-400 text-xs mt-0.5">{error}</span>
			)}

			{/* Calendrier dropdown (rendu via Portal pour éviter les problèmes de débordement dans les modals) */}
			{isOpen && createPortal(
				<div
					ref={calendarRef}
					className="fixed z-[9999] bg-bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[300px]"
					style={{ top: calendarPosition.top, left: calendarPosition.left }}
				>
					{/* Header avec navigation */}
					<div className="flex items-center justify-between px-4 py-3 bg-bg-secondary border-b border-border">
						<button
							type="button"
							onClick={goToPrevMonth}
							className="p-1 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
						>
							<ChevronLeftIcon />
						</button>

						<span className="font-semibold text-text-primary">
							{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
						</span>

						<button
							type="button"
							onClick={goToNextMonth}
							className="p-1 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
						>
							<ChevronRightIcon />
						</button>
					</div>

					{/* Jours de la semaine */}
					<div className="grid grid-cols-7 gap-1 px-2 py-2 border-b border-border">
						{DAYS.map(day => (
							<div key={day} className="text-center text-xs font-medium text-text-secondary py-1">
								{day}
							</div>
						))}
					</div>

					{/* Jours du mois */}
					<div className="grid grid-cols-7 gap-1 p-2">
						{generateCalendarDays().map(({ date, isCurrentMonth }, index) => {
							const dateStr = formatDateToString(date)
							const isSelected = dateStr === selectedDateStr
							const isToday = dateStr === todayStr
							const isDisabled = isDateDisabled(date)

							return (
								<button
									key={index}
									type="button"
									onClick={() => !isDisabled && selectDate(date)}
									disabled={isDisabled}
									className={clsx(
										'w-9 h-9 rounded-lg text-sm font-medium transition-all',
										'flex items-center justify-center',
										isDisabled && 'opacity-30 cursor-not-allowed',
										!isCurrentMonth && 'text-text-secondary/50',
										isCurrentMonth && !isSelected && !isToday && 'text-text-primary hover:bg-bg-secondary',
										isToday && !isSelected && 'bg-neon-purple/20 text-neon-purple',
										isSelected && 'bg-neon-cyan text-bg-primary font-bold'
									)}
								>
									{date.getDate()}
								</button>
							)
						})}
					</div>

					{/* Footer avec bouton Aujourd'hui */}
					<div className="px-3 py-2 border-t border-border flex justify-between items-center">
						<button
							type="button"
							onClick={goToToday}
							className="text-xs text-neon-cyan hover:underline"
						>
							Aujourd'hui
						</button>
						{value && (
							<button
								type="button"
								onClick={() => {
									onChange('')
									setIsOpen(false)
								}}
								className="text-xs text-text-secondary hover:text-red-400"
							>
								Effacer
							</button>
						)}
					</div>
				</div>,
				document.body
			)}
		</div>
	)
}

DatePicker.propTypes = {
	label: PropTypes.string,
	value: PropTypes.string,
	onChange: PropTypes.func.isRequired,
	error: PropTypes.string,
	required: PropTypes.bool,
	disabled: PropTypes.bool,
	min: PropTypes.string,
	max: PropTypes.string,
	placeholder: PropTypes.string,
	className: PropTypes.string
}

export default DatePicker
