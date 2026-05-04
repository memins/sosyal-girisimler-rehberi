import type { EnterpriseSort } from '@/shared/types'

export type EnterpriseFilters = {
	query: string
	categories: Array<string>
	audiences: Array<string>
	businessModels: Array<string>
	countries: Array<string>
	sdgs: Array<number>
	page: number
	pageSize: number
	sort: EnterpriseSort
}

const ALLOWED_SORTS: ReadonlyArray<EnterpriseSort> = ['featured', 'newest', 'name']
const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 60

export type SubmissionValidationResult =
	| { ok: true }
	| {
			ok: false
			errors: Record<string, string>
	  }

type ValidationResult = SubmissionValidationResult

type SubmissionInput = {
	name?: unknown
	description?: unknown
	contactEmail?: unknown
	websiteUrl?: unknown
	problem?: unknown
	solution?: unknown
}

type EnterpriseInput = {
	name?: unknown
	slug?: unknown
	shortDescription?: unknown
	problem?: unknown
	solution?: unknown
	impact?: unknown
	websiteUrl?: unknown
	instagramUrl?: unknown
	status?: unknown
	isFeatured?: unknown
	categoryIds?: unknown
	audienceIds?: unknown
	businessModelIds?: unknown
	countryCodes?: unknown
	sdgIds?: unknown
}

type EditorialListInput = {
	title?: unknown
	slug?: unknown
	description?: unknown
	status?: unknown
	enterpriseIds?: unknown
}

export function parseEnterpriseFilters(url: URL): EnterpriseFilters {
	return {
		query: url.searchParams.get('query')?.trim() ?? '',
		categories: parseStringList(url.searchParams.get('categories')),
		audiences: parseStringList(url.searchParams.get('audiences')),
		businessModels: parseStringList(url.searchParams.get('businessModels')),
		countries: parseStringList(url.searchParams.get('countries')),
		sdgs: parseSdgList(url.searchParams.get('sdgs')),
		page: parsePositiveInt(url.searchParams.get('page'), 1),
		pageSize: clampPageSize(parsePositiveInt(url.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE)),
		sort: parseSort(url.searchParams.get('sort')),
	}
}

function parsePositiveInt(value: string | null, fallback: number): number {
	if (!value) return fallback
	const parsed = Number(value)
	return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback
}

function clampPageSize(value: number): number {
	return Math.min(Math.max(value, 1), MAX_PAGE_SIZE)
}

function parseSort(value: string | null): EnterpriseSort {
	if (value && (ALLOWED_SORTS as ReadonlyArray<string>).includes(value)) {
		return value as EnterpriseSort
	}
	return 'featured'
}

export function validateSubmissionInput(input: SubmissionInput): SubmissionValidationResult {
	const errors: Record<string, string> = {}
	const name = readString(input.name)
	const description = readString(input.description)
	const contactEmail = readString(input.contactEmail)
	const websiteUrl = readString(input.websiteUrl)

	if (name.length === 0) {
		errors.name = 'Girişim adı gerekli.'
	}

	if (description.length < 20) {
		errors.description = 'Kısa açıklama en az 20 karakter olmalı.'
	}

	if (!isEmail(contactEmail)) {
		errors.contactEmail = 'Geçerli bir e-posta adresi girin.'
	}

	requireSafeUrl(errors, 'websiteUrl', websiteUrl)

	if (Object.keys(errors).length > 0) {
		return { ok: false, errors }
	}

	return { ok: true }
}

export function validateEnterpriseInput(input: EnterpriseInput): ValidationResult {
	const errors: Record<string, string> = {}

	requireText(errors, 'name', readString(input.name), 'Girişim adı gerekli.')
	requireSlug(errors, readString(input.slug))
	requireMinLength(
		errors,
		'shortDescription',
		readString(input.shortDescription),
		20,
		'Kısa açıklama en az 20 karakter olmalı.',
	)
	requireText(errors, 'problem', readString(input.problem), 'Çalışma alanı gerekli.')
	requireText(errors, 'solution', readString(input.solution), 'Çözüm yöntemi gerekli.')
	requireText(errors, 'impact', readString(input.impact), 'Sosyal etki alanı gerekli.')
	requireSafeUrl(errors, 'websiteUrl', readString(input.websiteUrl))
	requireSafeUrl(errors, 'instagramUrl', readString(input.instagramUrl))

	if (!isStringArray(input.categoryIds)) {
		errors.categoryIds = 'Kategori değerleri liste olmalı.'
	}

	if (!isStringArray(input.audienceIds)) {
		errors.audienceIds = 'Hedef kitle değerleri liste olmalı.'
	}

	if (!isStringArray(input.businessModelIds)) {
		errors.businessModelIds = 'Kurum türü değerleri liste olmalı.'
	}

	if (!isStringArray(input.countryCodes)) {
		errors.countryCodes = 'Ülke değerleri liste olmalı.'
	}

	if (!isValidSdgArray(input.sdgIds)) {
		errors.sdgIds = 'SKA değerleri 1-17 aralığında olmalı.'
	}

	return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true }
}

export function validateEditorialListInput(input: EditorialListInput): ValidationResult {
	const errors: Record<string, string> = {}

	requireText(errors, 'title', readString(input.title), 'Liste başlığı gerekli.')
	requireSlug(errors, readString(input.slug))
	requireText(errors, 'description', readString(input.description), 'Liste açıklaması gerekli.')

	if (!isStringArray(input.enterpriseIds) || input.enterpriseIds.length === 0) {
		errors.enterpriseIds = 'En az bir girişim seçilmeli.'
	}

	return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true }
}

function parseStringList(value: string | null): Array<string> {
	if (!value) {
		return []
	}

	return value
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
}

function parseSdgList(value: string | null): Array<number> {
	return parseStringList(value)
		.map((item) => Number(item))
		.filter((item) => Number.isInteger(item) && item >= 1 && item <= 17)
}

function readString(value: unknown): string {
	return typeof value === 'string' ? value.trim() : ''
}

function isEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function requireText(
	errors: Record<string, string>,
	key: string,
	value: string,
	message: string,
): void {
	if (value.length === 0) {
		errors[key] = message
	}
}

function requireMinLength(
	errors: Record<string, string>,
	key: string,
	value: string,
	minLength: number,
	message: string,
): void {
	if (value.length < minLength) {
		errors[key] = message
	}
}

function requireSlug(errors: Record<string, string>, value: string): void {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
		errors.slug = 'Slug sadece küçük harf, sayı ve tire içermeli.'
	}
}

function requireSafeUrl(errors: Record<string, string>, key: string, value: string): void {
	if (value.length === 0) {
		return
	}

	try {
		const url = new URL(value)
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			errors[key] = 'URL http veya https ile başlamalı.'
		}
	} catch {
		errors[key] = 'URL http veya https ile başlamalı.'
	}
}

function isStringArray(value: unknown): value is Array<string> {
	return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isValidSdgArray(value: unknown): value is Array<number> {
	return (
		Array.isArray(value) &&
		value.every((item) => Number.isInteger(item) && item >= 1 && item <= 17)
	)
}
