import { describe, expect, it } from 'vitest'
import { typoLikeNeedles } from './search-query'

describe('typoLikeNeedles', () => {
	it('keeps a short query exact', () => {
		expect(typoLikeNeedles('su')).toEqual(['su'])
	})

	it('adds single-character deletions for longer queries', () => {
		expect(typoLikeNeedles('egitim')).toContain('egitim')
		expect(typoLikeNeedles('egitim')).toContain('gitim')
		expect(typoLikeNeedles('egitim')).toContain('egitm')
	})
})
