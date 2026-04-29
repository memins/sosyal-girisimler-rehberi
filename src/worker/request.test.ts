import { describe, expect, it } from 'vitest'
import {
	parseEnterpriseFilters,
	validateEditorialListInput,
	validateEnterpriseInput,
	validateSubmissionInput,
} from './request'

describe('parseEnterpriseFilters', () => {
	it('normalizes multi-select filters from comma separated query params', () => {
		const url = new URL(
			'https://sosyal.genclink.com/api/enterprises?query=gida&categories=cevre,egitim&audiences=gencler&countries=TR,global&sdgs=2,12',
		)

		expect(parseEnterpriseFilters(url)).toEqual({
			query: 'gida',
			categories: ['cevre', 'egitim'],
			audiences: ['gencler'],
			businessModels: [],
			countries: ['TR', 'global'],
			sdgs: [2, 12],
			page: 1,
			pageSize: 24,
			sort: 'featured',
		})
	})

	it('drops empty values and invalid sdg ids', () => {
		const url = new URL(
			'https://sosyal.genclink.com/api/enterprises?categories=,,cevre&sdgs=0,4,18,abc',
		)

		expect(parseEnterpriseFilters(url)).toEqual({
			query: '',
			categories: ['cevre'],
			audiences: [],
			businessModels: [],
			countries: [],
			sdgs: [4],
			page: 1,
			pageSize: 24,
			sort: 'featured',
		})
	})

	it('parses page, pageSize and sort with safe fallbacks', () => {
		const valid = new URL(
			'https://sosyal.genclink.com/api/enterprises?page=3&pageSize=10&sort=newest',
		)
		expect(parseEnterpriseFilters(valid)).toMatchObject({
			page: 3,
			pageSize: 10,
			sort: 'newest',
		})

		const invalid = new URL(
			'https://sosyal.genclink.com/api/enterprises?page=-2&pageSize=999&sort=hacked',
		)
		expect(parseEnterpriseFilters(invalid)).toMatchObject({
			page: 1,
			pageSize: 60,
			sort: 'featured',
		})
	})
})

describe('validateSubmissionInput', () => {
	it('accepts a complete public enterprise suggestion', () => {
		const result = validateSubmissionInput({
			name: 'Fazla',
			description: 'Gida israfini azaltan sosyal girisim.',
			contactEmail: 'editor@example.com',
			websiteUrl: 'https://fazla.com',
			problem: 'Gida israfi',
			solution: 'Atik gidalarin yeniden dagitimi',
		})

		expect(result.ok).toBe(true)
	})

	it('rejects incomplete suggestions with field errors', () => {
		const result = validateSubmissionInput({
			name: '',
			description: 'Kisa',
			contactEmail: 'not-email',
		})

		expect(result).toEqual({
			ok: false,
			errors: {
				name: 'Girişim adı gerekli.',
				description: 'Kısa açıklama en az 20 karakter olmalı.',
				contactEmail: 'Geçerli bir e-posta adresi girin.',
			},
		})
	})
})

describe('validateEnterpriseInput', () => {
	it('accepts a complete admin enterprise payload', () => {
		const result = validateEnterpriseInput({
			name: 'Fazla',
			slug: 'fazla',
			shortDescription: 'Gıda israfını azaltan sosyal girişim.',
			problem: 'Gıda israfı',
			solution: 'Fazla ürünlerin yeniden değerlendirilmesi',
			impact: 'Binlerce ton ürün kurtarıldı.',
			websiteUrl: 'https://fazla.com',
			instagramUrl: 'https://www.instagram.com/fazla',
			status: 'published',
			isFeatured: true,
			categoryIds: ['cevre'],
			audienceIds: ['dezavantajli-gruplar'],
			businessModelIds: ['sosyal-girisim'],
			countryCodes: ['TR'],
			sdgIds: [12],
		})

		expect(result.ok).toBe(true)
	})

	it('rejects unsafe urls and malformed taxonomy arrays', () => {
		const result = validateEnterpriseInput({
			name: '',
			slug: 'Kötü Slug',
			shortDescription: 'Kısa',
			problem: '',
			solution: '',
			impact: '',
			websiteUrl: 'javascript:alert(1)',
			status: 'published',
			isFeatured: true,
			categoryIds: ['cevre'],
			audienceIds: [],
			businessModelIds: [],
			countryCodes: [],
			sdgIds: [0, 18],
		})

		expect(result).toEqual({
			ok: false,
			errors: {
				name: 'Girişim adı gerekli.',
				slug: 'Slug sadece küçük harf, sayı ve tire içermeli.',
				shortDescription: 'Kısa açıklama en az 20 karakter olmalı.',
				problem: 'Gündem alanı gerekli.',
				solution: 'Çözüm alanı gerekli.',
				impact: 'Sosyal etki alanı gerekli.',
				websiteUrl: 'URL http veya https ile başlamalı.',
				sdgIds: 'SKA değerleri 1-17 aralığında olmalı.',
			},
		})
	})
})

describe('validateEditorialListInput', () => {
	it('requires editorial list title, slug, description and items', () => {
		const result = validateEditorialListInput({
			title: '',
			slug: 'Yanlış Slug',
			description: '',
			status: 'published',
			enterpriseIds: [],
		})

		expect(result).toEqual({
			ok: false,
			errors: {
				title: 'Liste başlığı gerekli.',
				slug: 'Slug sadece küçük harf, sayı ve tire içermeli.',
				description: 'Liste açıklaması gerekli.',
				enterpriseIds: 'En az bir girişim seçilmeli.',
			},
		})
	})
})

