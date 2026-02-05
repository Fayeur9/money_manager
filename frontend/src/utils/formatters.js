/**
 * Formate un montant en devise EUR
 * @param {number} amount - Le montant à formater
 * @returns {string} Le montant formaté (ex: "1 234,56 €")
 */
export const formatCurrency = (amount) => {
	return new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR'
	}).format(amount)
}

/**
 * Formate une date en français
 * @param {string} dateStr - La date au format ISO
 * @param {object} options - Options de formatage (par défaut: jour + mois court)
 * @returns {string} La date formatée (ex: "15 janv.")
 */
export const formatDate = (dateStr, options = {}) => {
	const defaultOptions = { day: 'numeric', month: 'short' }
	return new Date(dateStr).toLocaleDateString('fr-FR', { ...defaultOptions, ...options })
}

/**
 * Formate une date avec l'année
 * @param {string} dateStr - La date au format ISO
 * @returns {string} La date formatée (ex: "15 janv. 2024")
 */
export const formatDateWithYear = (dateStr) => {
	return formatDate(dateStr, { day: 'numeric', month: 'short', year: 'numeric' })
}
