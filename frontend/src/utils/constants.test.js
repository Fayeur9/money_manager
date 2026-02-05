import { describe, it, expect } from 'vitest'
import {
	TRANSACTION_TYPES,
	ACCOUNT_TYPES,
	FREQUENCIES,
	ACCOUNT_TYPE_LABELS,
	FREQUENCY_LABELS,
	getAccountTypeLabel,
	getFrequencyLabel
} from './constants'

describe('TRANSACTION_TYPES', () => {
	it('contient les types de base', () => {
		expect(TRANSACTION_TYPES.EXPENSE).toBe('expense')
		expect(TRANSACTION_TYPES.INCOME).toBe('income')
		expect(TRANSACTION_TYPES.TRANSFER).toBe('transfer')
	})

	it('a exactement 3 types', () => {
		expect(Object.keys(TRANSACTION_TYPES)).toHaveLength(3)
	})
})

describe('ACCOUNT_TYPES', () => {
	it('contient tous les types de comptes', () => {
		expect(ACCOUNT_TYPES.CHECKING).toBe('checking')
		expect(ACCOUNT_TYPES.SAVINGS).toBe('savings')
		expect(ACCOUNT_TYPES.CASH).toBe('cash')
		expect(ACCOUNT_TYPES.INVESTMENT).toBe('investment')
		expect(ACCOUNT_TYPES.OTHER).toBe('other')
	})

	it('a exactement 5 types', () => {
		expect(Object.keys(ACCOUNT_TYPES)).toHaveLength(5)
	})
})

describe('FREQUENCIES', () => {
	it('contient toutes les fréquences', () => {
		expect(FREQUENCIES.DAILY).toBe('daily')
		expect(FREQUENCIES.WEEKLY).toBe('weekly')
		expect(FREQUENCIES.BIWEEKLY).toBe('biweekly')
		expect(FREQUENCIES.MONTHLY).toBe('monthly')
		expect(FREQUENCIES.QUARTERLY).toBe('quarterly')
		expect(FREQUENCIES.YEARLY).toBe('yearly')
	})

	it('a exactement 6 fréquences', () => {
		expect(Object.keys(FREQUENCIES)).toHaveLength(6)
	})
})

describe('ACCOUNT_TYPE_LABELS', () => {
	it('a un label pour chaque type de compte', () => {
		expect(ACCOUNT_TYPE_LABELS.checking).toBe('Compte courant')
		expect(ACCOUNT_TYPE_LABELS.savings).toBe('Épargne')
		expect(ACCOUNT_TYPE_LABELS.cash).toBe('Espèces')
		expect(ACCOUNT_TYPE_LABELS.investment).toBe('Investissement')
		expect(ACCOUNT_TYPE_LABELS.other).toBe('Autre')
	})

	it('correspond aux clés de ACCOUNT_TYPES', () => {
		Object.values(ACCOUNT_TYPES).forEach(type => {
			expect(ACCOUNT_TYPE_LABELS[type]).toBeDefined()
		})
	})
})

describe('FREQUENCY_LABELS', () => {
	it('a un label pour chaque fréquence', () => {
		expect(FREQUENCY_LABELS.daily).toBe('Quotidien')
		expect(FREQUENCY_LABELS.weekly).toBe('Hebdo')
		expect(FREQUENCY_LABELS.biweekly).toBe('Bi-mensuel')
		expect(FREQUENCY_LABELS.monthly).toBe('Mensuel')
		expect(FREQUENCY_LABELS.quarterly).toBe('Trimestriel')
		expect(FREQUENCY_LABELS.yearly).toBe('Annuel')
	})

	it('correspond aux clés de FREQUENCIES', () => {
		Object.values(FREQUENCIES).forEach(freq => {
			expect(FREQUENCY_LABELS[freq]).toBeDefined()
		})
	})
})

describe('getAccountTypeLabel', () => {
	it('retourne le label correct pour chaque type', () => {
		expect(getAccountTypeLabel('checking')).toBe('Compte courant')
		expect(getAccountTypeLabel('savings')).toBe('Épargne')
		expect(getAccountTypeLabel('cash')).toBe('Espèces')
	})

	it('retourne la valeur originale si le type est inconnu', () => {
		expect(getAccountTypeLabel('unknown_type')).toBe('unknown_type')
		expect(getAccountTypeLabel('custom')).toBe('custom')
	})
})

describe('getFrequencyLabel', () => {
	it('retourne le label correct pour chaque fréquence', () => {
		expect(getFrequencyLabel('daily')).toBe('Quotidien')
		expect(getFrequencyLabel('monthly')).toBe('Mensuel')
		expect(getFrequencyLabel('yearly')).toBe('Annuel')
	})

	it('retourne la valeur originale si la fréquence est inconnue', () => {
		expect(getFrequencyLabel('unknown_freq')).toBe('unknown_freq')
		expect(getFrequencyLabel('custom')).toBe('custom')
	})
})
