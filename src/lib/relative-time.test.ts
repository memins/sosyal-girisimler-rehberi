import { describe, expect, it } from 'vitest'
import { formatAddedAgo } from './relative-time'

describe('formatAddedAgo', () => {
	const now = new Date('2026-09-24T12:00:00.000Z')

	it('labels a three-day-old enterprise', () => {
		expect(formatAddedAgo('2026-09-21T12:00:00.000Z', now)).toBe('3 gün önce eklendi')
	})

	it('labels the same day as today', () => {
		expect(formatAddedAgo('2026-09-24T08:00:00.000Z', now)).toBe('Bugün eklendi')
	})
})
