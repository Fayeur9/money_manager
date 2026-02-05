import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatDateWithYear } from './formatters'

describe('formatCurrency', () => {
	it('formate un montant positif en euros', () => {
		const result = formatCurrency(1234.56)
		expect(result).toContain('1')
		expect(result).toContain('234')
		expect(result).toContain('56')
		expect(result).toContain('€')
	})

	it('formate un montant négatif en euros', () => {
		const result = formatCurrency(-500)
		expect(result).toContain('500')
		expect(result).toContain('€')
	})

	it('formate zéro correctement', () => {
		const result = formatCurrency(0)
		expect(result).toContain('0')
		expect(result).toContain('€')
	})

	it('formate les décimales correctement', () => {
		const result = formatCurrency(99.99)
		expect(result).toContain('99')
		expect(result).toContain('€')
	})

	it('formate les grands nombres avec séparateurs', () => {
		const result = formatCurrency(1000000)
		expect(result).toContain('€')
	})
})

describe('formatDate', () => {
	it('formate une date ISO en français (jour + mois court)', () => {
		const result = formatDate('2024-01-15')
		expect(result).toContain('15')
		expect(result.toLowerCase()).toContain('janv')
	})

	it('formate une date avec options personnalisées', () => {
		const result = formatDate('2024-06-20', { day: 'numeric', month: 'long' })
		expect(result).toContain('20')
		expect(result.toLowerCase()).toContain('juin')
	})

	it('gère différentes dates', () => {
		expect(formatDate('2024-12-25')).toContain('25')
		expect(formatDate('2024-03-01')).toContain('1')
	})
})

describe('formatDateWithYear', () => {
	it('formate une date avec l\'année', () => {
		const result = formatDateWithYear('2024-01-15')
		expect(result).toContain('15')
		expect(result.toLowerCase()).toContain('janv')
		expect(result).toContain('2024')
	})

	it('affiche correctement une date de fin d\'année', () => {
		const result = formatDateWithYear('2023-12-31')
		expect(result).toContain('31')
		expect(result).toContain('2023')
	})
})
