// Types de transactions
export const TRANSACTION_TYPES = {
	EXPENSE: 'expense',
	INCOME: 'income',
	TRANSFER: 'transfer'
}

// Types de comptes
export const ACCOUNT_TYPES = {
	CHECKING: 'checking',
	SAVINGS: 'savings',
	CASH: 'cash',
	INVESTMENT: 'investment',
	OTHER: 'other'
}

// Fréquences des récurrentes
export const FREQUENCIES = {
	DAILY: 'daily',
	WEEKLY: 'weekly',
	BIWEEKLY: 'biweekly',
	MONTHLY: 'monthly',
	QUARTERLY: 'quarterly',
	YEARLY: 'yearly'
}

// Labels des types de comptes
export const ACCOUNT_TYPE_LABELS = {
	checking: 'Compte courant',
	savings: 'Épargne',
	cash: 'Espèces',
	investment: 'Investissement',
	other: 'Autre'
}

// Labels des fréquences
export const FREQUENCY_LABELS = {
	daily: 'Quotidien',
	weekly: 'Hebdo',
	biweekly: 'Bi-mensuel',
	monthly: 'Mensuel',
	quarterly: 'Trimestriel',
	yearly: 'Annuel'
}

// Fonctions utilitaires pour récupérer les labels
export const getAccountTypeLabel = (type) => ACCOUNT_TYPE_LABELS[type] || type
export const getFrequencyLabel = (freq) => FREQUENCY_LABELS[freq] || freq

// Configuration des couleurs selon la direction des avances
export const ADVANCE_DIRECTION_STYLES = {
	given: {
		text: 'text-neon-cyan',
		bg: 'bg-neon-cyan/20',
		border: 'border-neon-cyan/30',
		button: 'bg-neon-cyan text-bg-primary hover:bg-neon-cyan/90',
		buttonOutline: 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
	},
	received: {
		text: 'text-neon-purple',
		bg: 'bg-neon-purple/20',
		border: 'border-neon-purple/30',
		button: 'bg-neon-purple text-bg-primary hover:bg-neon-purple/90',
		buttonOutline: 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
	}
}

// Labels des directions d'avances
export const ADVANCE_DIRECTION_LABELS = {
	given: {
		tab: 'À recevoir',
		new: 'Nouvelle avance',
		total: 'Total à recevoir',
		empty: 'Aucune avance',
		emptyDescription: 'Créez votre première avance',
		sidebar: 'Qui me doit',
		sidebarEmpty: 'Aucune avance en attente',
		itemType: 'avance'
	},
	received: {
		tab: 'À rembourser',
		new: 'Nouvel emprunt',
		total: 'Total à rembourser',
		empty: 'Aucun emprunt',
		emptyDescription: 'Créez votre premier emprunt',
		sidebar: 'À qui je dois',
		sidebarEmpty: 'Aucun emprunt en attente',
		itemType: 'emprunt'
	}
}

// Helper pour obtenir les styles de direction
export const getDirectionStyles = (direction) => ADVANCE_DIRECTION_STYLES[direction] || ADVANCE_DIRECTION_STYLES.given
export const getDirectionLabels = (direction) => ADVANCE_DIRECTION_LABELS[direction] || ADVANCE_DIRECTION_LABELS.given
