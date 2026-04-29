import type {
	CategoryWithCount,
	Country,
	DirectoryMeta,
	EditorialList,
	EditorialListStatus,
	Enterprise,
	EnterpriseDetail,
	EnterpriseStatus,
	EnterpriseSummary,
	HomePayload,
	ListEnterprisesPayload,
	Sdg,
	SiteStats,
	Submission,
	SubmissionInput,
	TaxonomyItem,
	UpsertEditorialListInput,
	UpsertEnterpriseInput,
} from '@/shared/types'
import type { EnterpriseFilters } from './request'

type EnterpriseRow = {
	id: string
	slug: string
	name: string
	short_description: string
	problem: string
	solution: string
	impact: string
	long_content: string | null
	website_url: string | null
	instagram_url: string | null
	logo_key: string | null
	cover_key: string | null
	status: EnterpriseStatus
	is_featured: number
	created_at: string
	updated_at: string
}

type TaxonomyRow = {
	id: string
	name: string
	icon: string
	sort_order: number
}

type BusinessModelRow = {
	id: string
	name: string
	sort_order: number
}

type CountryRow = {
	code: string
	name: string
	flag: string
	sort_order: number
}

type SdgRow = {
	id: number
	name: string
	color: string
	logo_key: string | null
}

type SubmissionRow = {
	id: string
	name: string
	description: string
	contact_email: string
	website_url: string | null
	problem: string | null
	solution: string | null
	status: 'pending' | 'approved' | 'rejected'
	enterprise_id: string | null
	rejection_reason: string | null
	created_at: string
	updated_at: string
}

type EditorialListRow = {
	id: string
	slug: string
	title: string
	description: string
	status: EditorialListStatus
	created_at: string
	updated_at: string
}

type CountRow = {
	count: number
}

type RelationRows = {
	categories: Map<string, Array<TaxonomyItem>>
	audiences: Map<string, Array<TaxonomyItem>>
	businessModels: Map<string, Array<TaxonomyItem>>
	countries: Map<string, Array<Country>>
	sdgs: Map<string, Array<Sdg>>
}

export async function getDirectoryMeta(db: D1Database): Promise<DirectoryMeta> {
	const [categories, audiences, businessModels, countries, sdgs] = await Promise.all([
		db.prepare('SELECT id, name, icon, sort_order FROM categories ORDER BY sort_order').all<TaxonomyRow>(),
		db.prepare('SELECT id, name, icon, sort_order FROM audiences ORDER BY sort_order').all<TaxonomyRow>(),
		db.prepare('SELECT id, name, sort_order FROM business_models ORDER BY sort_order').all<BusinessModelRow>(),
		db.prepare('SELECT code, name, flag, sort_order FROM countries ORDER BY sort_order').all<CountryRow>(),
		db.prepare('SELECT id, name, color, logo_key FROM sdgs ORDER BY id').all<SdgRow>(),
	])

	return {
		categories: categories.results.map(mapTaxonomyRow),
		audiences: audiences.results.map(mapTaxonomyRow),
		businessModels: businessModels.results.map(mapBusinessModelRow),
		countries: countries.results.map(mapCountryRow),
		sdgs: sdgs.results.map(mapSdgRow),
	}
}

export async function getHomePayload(db: D1Database): Promise<HomePayload> {
	const [stats, featuredRows, categories, editorialLists] = await Promise.all([
		getSiteStats(db),
		db
			.prepare(
				'SELECT * FROM enterprises WHERE status = ? AND is_featured = 1 ORDER BY updated_at DESC LIMIT 4',
			)
			.bind('published')
			.all<EnterpriseRow>(),
		listCategoriesWithCounts(db),
		listEditorialLists(db, true),
	])
	const featured = await mapEnterpriseSummaries(db, featuredRows.results)

	return {
		stats,
		featured,
		categories,
		editorialLists,
	}
}

async function listCategoriesWithCounts(db: D1Database): Promise<Array<CategoryWithCount>> {
	const rows = await db
		.prepare(
			`SELECT c.id, c.name, c.icon, c.sort_order,
				(SELECT COUNT(*) FROM enterprise_categories ec
					INNER JOIN enterprises e ON e.id = ec.enterprise_id
					WHERE ec.category_id = c.id AND e.status = 'published') AS enterprise_count
				FROM categories c
				ORDER BY c.sort_order`,
		)
		.all<TaxonomyRow & { enterprise_count: number }>()

	return rows.results.map((row) => ({
		id: row.id,
		name: row.name,
		icon: row.icon,
		sortOrder: row.sort_order,
		enterpriseCount: row.enterprise_count ?? 0,
	}))
}

export async function getSiteStats(db: D1Database): Promise<SiteStats> {
	const [enterpriseCount, countryCount, categoryCount, sdgCount] = await Promise.all([
		count(db, 'SELECT COUNT(*) as count FROM enterprises WHERE status = ? ', ['published']),
		count(
			db,
			`SELECT COUNT(DISTINCT country_code) as count
				FROM enterprise_countries
				INNER JOIN enterprises ON enterprises.id = enterprise_countries.enterprise_id
				WHERE enterprises.status = ?`,
			['published'],
		),
		count(db, 'SELECT COUNT(*) as count FROM categories', []),
		count(db, 'SELECT COUNT(*) as count FROM sdgs', []),
	])

	return {
		enterprises: enterpriseCount,
		countries: countryCount,
		categories: categoryCount,
		sdgs: sdgCount,
	}
}

export async function listEnterprises(
	db: D1Database,
	filters: EnterpriseFilters,
	includeDrafts = false,
): Promise<ListEnterprisesPayload> {
	const conditions: Array<string> = []
	const params: Array<string | number> = []

	if (!includeDrafts) {
		conditions.push('status = ?')
		params.push('published')
	}

	if (filters.query.length > 0) {
		conditions.push('(name LIKE ? OR short_description LIKE ? OR problem LIKE ? OR solution LIKE ?)')
		const queryParam = `%${filters.query}%`
		params.push(queryParam, queryParam, queryParam, queryParam)
	}

	addExistsFilter(conditions, params, filters.categories, 'enterprise_categories', 'category_id')
	addExistsFilter(conditions, params, filters.audiences, 'enterprise_audiences', 'audience_id')
	addExistsFilter(
		conditions,
		params,
		filters.businessModels,
		'enterprise_business_models',
		'business_model_id',
	)
	addExistsFilter(conditions, params, filters.countries, 'enterprise_countries', 'country_code')
	addExistsFilter(conditions, params, filters.sdgs, 'enterprise_sdgs', 'sdg_id')

	const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
	const totalRow = await db
		.prepare(`SELECT COUNT(*) as count FROM enterprises ${where}`)
		.bind(...params)
		.first<CountRow>()
	const total = totalRow?.count ?? 0

	const orderBy = enterpriseOrderBy(filters.sort)
	const offset = (filters.page - 1) * filters.pageSize
	const rows = await db
		.prepare(
			`SELECT * FROM enterprises ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
		)
		.bind(...params, filters.pageSize, offset)
		.all<EnterpriseRow>()
	const items = await mapEnterpriseSummaries(db, rows.results)

	return {
		items,
		total,
		page: filters.page,
		pageSize: filters.pageSize,
		sort: filters.sort,
	}
}

function enterpriseOrderBy(sort: EnterpriseFilters['sort']): string {
	switch (sort) {
		case 'newest':
			return 'created_at DESC, name ASC'
		case 'name':
			return 'name ASC'
		case 'featured':
		default:
			return 'is_featured DESC, name ASC'
	}
}

export async function getEnterpriseBySlug(db: D1Database, slug: string): Promise<Enterprise | null> {
	const row = await db
		.prepare('SELECT * FROM enterprises WHERE slug = ? LIMIT 1')
		.bind(slug)
		.first<EnterpriseRow>()

	if (!row) {
		return null
	}

	const relations = await loadRelations(db, [row.id])

	return mapEnterpriseRow(row, relations)
}

export async function getEnterpriseDetailBySlug(
	db: D1Database,
	slug: string,
): Promise<EnterpriseDetail | null> {
	const enterprise = await getEnterpriseBySlug(db, slug)
	if (!enterprise) return null

	const related = await listRelatedEnterprises(db, enterprise)
	return { ...enterprise, related }
}

async function listRelatedEnterprises(
	db: D1Database,
	enterprise: Enterprise,
	limit = 3,
): Promise<Array<EnterpriseSummary>> {
	const categoryIds = enterprise.categories.map((c) => c.id)
	if (categoryIds.length === 0) return []

	const placeholders = categoryIds.map(() => '?').join(', ')
	const rows = await db
		.prepare(
			`SELECT DISTINCT e.* FROM enterprises e
				INNER JOIN enterprise_categories ec ON ec.enterprise_id = e.id
				WHERE ec.category_id IN (${placeholders})
					AND e.id != ?
					AND e.status = 'published'
				ORDER BY e.is_featured DESC, e.updated_at DESC
				LIMIT ?`,
		)
		.bind(...categoryIds, enterprise.id, limit)
		.all<EnterpriseRow>()

	return mapEnterpriseSummaries(db, rows.results)
}

export async function createSubmission(
	db: D1Database,
	input: SubmissionInput,
): Promise<Submission> {
	const id = crypto.randomUUID()
	await db
		.prepare(
			`INSERT INTO submissions (
				id,
				name,
				description,
				contact_email,
				website_url,
				problem,
				solution
			) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			id,
			input.name,
			input.description,
			input.contactEmail,
			input.websiteUrl ?? null,
			input.problem ?? null,
			input.solution ?? null,
		)
		.run()

	const submission = await getSubmissionById(db, id)

	if (!submission) {
		throw new Error('Submission could not be loaded after creation')
	}

	return submission
}

export async function listSubmissions(db: D1Database): Promise<Array<Submission>> {
	const rows = await db
		.prepare('SELECT * FROM submissions ORDER BY created_at DESC LIMIT 100')
		.all<SubmissionRow>()

	return rows.results.map(mapSubmissionRow)
}

export async function getSubmissionById(db: D1Database, id: string): Promise<Submission | null> {
	const row = await db.prepare('SELECT * FROM submissions WHERE id = ? LIMIT 1').bind(id).first<SubmissionRow>()

	return row ? mapSubmissionRow(row) : null
}

export async function upsertEnterprise(
	db: D1Database,
	input: UpsertEnterpriseInput,
): Promise<Enterprise> {
	await validateEnterpriseReferences(db, input)

	const id = input.id ?? crypto.randomUUID()
	const now = new Date().toISOString()
	await db
		.prepare(
			`INSERT INTO enterprises (
				id,
				slug,
				name,
				short_description,
				problem,
				solution,
				impact,
				long_content,
				website_url,
				instagram_url,
				logo_key,
				cover_key,
				status,
				is_featured,
				updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				slug = excluded.slug,
				name = excluded.name,
				short_description = excluded.short_description,
				problem = excluded.problem,
				solution = excluded.solution,
				impact = excluded.impact,
				long_content = excluded.long_content,
				website_url = excluded.website_url,
				instagram_url = excluded.instagram_url,
				logo_key = excluded.logo_key,
				cover_key = excluded.cover_key,
				status = excluded.status,
				is_featured = excluded.is_featured,
				updated_at = excluded.updated_at`,
		)
		.bind(
			id,
			input.slug,
			input.name,
			input.shortDescription,
			input.problem,
			input.solution,
			input.impact,
			input.longContent ?? null,
			input.websiteUrl ?? null,
			input.instagramUrl ?? null,
			input.logoKey ?? null,
			input.coverKey ?? null,
			input.status,
			input.isFeatured ? 1 : 0,
			now,
		)
		.run()

	await replaceEnterpriseRelations(db, id, input)
	const enterprise = await getEnterpriseBySlug(db, input.slug)

	if (!enterprise) {
		throw new Error('Enterprise could not be loaded after upsert')
	}

	return enterprise
}

export async function approveSubmission(db: D1Database, submissionId: string): Promise<Enterprise> {
	const submission = await getSubmissionById(db, submissionId)

	if (!submission) {
		throw new Error('Submission not found')
	}

	const enterprise = await upsertEnterprise(db, {
		name: submission.name,
		slug: slugify(submission.name),
		shortDescription: submission.description,
		problem: submission.problem ?? 'Bu girişimin çözmeyi hedeflediği sosyal problem editör tarafından tamamlanacak.',
		solution: submission.solution ?? 'Bu girişimin çözüm yaklaşımı editör tarafından tamamlanacak.',
		impact: 'Sosyal etki bilgileri editör tarafından tamamlanacak.',
		status: 'draft',
		isFeatured: false,
		categoryIds: [],
		audienceIds: [],
		businessModelIds: ['sosyal-girisim'],
		countryCodes: [],
		sdgIds: [],
		websiteUrl: submission.websiteUrl ?? undefined,
	})

	await db
		.prepare(
			'UPDATE submissions SET status = ?, enterprise_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
		)
		.bind('approved', enterprise.id, submissionId)
		.run()

	return enterprise
}

export async function listEditorialLists(
	db: D1Database,
	publishedOnly = false,
): Promise<Array<EditorialList>> {
	const rows = await db
		.prepare(
			`SELECT * FROM editorial_lists ${publishedOnly ? 'WHERE status = ?' : ''} ORDER BY updated_at DESC`,
		)
		.bind(...(publishedOnly ? ['published'] : []))
		.all<EditorialListRow>()

	return Promise.all(rows.results.map((row) => mapEditorialListRow(db, row, publishedOnly)))
}

export async function upsertEditorialList(
	db: D1Database,
	input: UpsertEditorialListInput,
): Promise<EditorialList> {
	await validateEnterpriseIds(db, input.enterpriseIds)

	const id = input.id ?? crypto.randomUUID()
	await db
		.prepare(
			`INSERT INTO editorial_lists (id, slug, title, description, status, updated_at)
				VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
				ON CONFLICT(id) DO UPDATE SET
					slug = excluded.slug,
					title = excluded.title,
					description = excluded.description,
					status = excluded.status,
					updated_at = excluded.updated_at`,
		)
		.bind(id, input.slug, input.title, input.description, input.status)
		.run()

	await db.prepare('DELETE FROM editorial_list_items WHERE editorial_list_id = ?').bind(id).run()

	const statements = input.enterpriseIds.map((enterpriseId, index) =>
		db
			.prepare(
				'INSERT INTO editorial_list_items (editorial_list_id, enterprise_id, sort_order) VALUES (?, ?, ?)',
			)
			.bind(id, enterpriseId, index + 1),
	)

	if (statements.length > 0) {
		await db.batch(statements)
	}

	const rows = await db
		.prepare('SELECT * FROM editorial_lists WHERE id = ? LIMIT 1')
		.bind(id)
		.first<EditorialListRow>()

	if (!rows) {
		throw new Error('Editorial list could not be loaded after upsert')
	}

	return mapEditorialListRow(db, rows, false)
}

function addExistsFilter(
	conditions: Array<string>,
	params: Array<string | number>,
	values: Array<string | number>,
	table: string,
	column: string,
): void {
	if (values.length === 0) {
		return
	}

	const placeholders = values.map(() => '?').join(', ')
	conditions.push(
		`EXISTS (SELECT 1 FROM ${table} WHERE ${table}.enterprise_id = enterprises.id AND ${column} IN (${placeholders}))`,
	)
	params.push(...values)
}

async function validateEnterpriseReferences(
	db: D1Database,
	input: UpsertEnterpriseInput,
): Promise<void> {
	await Promise.all([
		validateIds(db, 'categories', 'id', input.categoryIds, 'Kategori'),
		validateIds(db, 'audiences', 'id', input.audienceIds, 'Hedef kitle'),
		validateIds(db, 'business_models', 'id', input.businessModelIds, 'İş modeli'),
		validateIds(db, 'countries', 'code', input.countryCodes, 'Ülke'),
		validateIds(
			db,
			'sdgs',
			'id',
			input.sdgIds.map((id) => String(id)),
			'SKA',
		),
	])
}

async function validateEnterpriseIds(db: D1Database, ids: Array<string>): Promise<void> {
	await validateIds(db, 'enterprises', 'id', ids, 'Girişim')
}

async function validateIds(
	db: D1Database,
	table: string,
	column: string,
	ids: Array<string>,
	label: string,
): Promise<void> {
	if (ids.length === 0) {
		return
	}

	const uniqueIds = Array.from(new Set(ids))
	const placeholders = uniqueIds.map(() => '?').join(', ')
	const row = await db
		.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${column} IN (${placeholders})`)
		.bind(...uniqueIds)
		.first<CountRow>()

	if ((row?.count ?? 0) !== uniqueIds.length) {
		throw new Error(`${label} referanslarından biri bulunamadı.`)
	}
}

async function count(
	db: D1Database,
	statement: string,
	params: Array<string | number>,
): Promise<number> {
	const row = await db.prepare(statement).bind(...params).first<CountRow>()

	return row?.count ?? 0
}

async function mapEnterpriseSummaries(
	db: D1Database,
	rows: Array<EnterpriseRow>,
): Promise<Array<EnterpriseSummary>> {
	const relations = await loadRelations(
		db,
		rows.map((row) => row.id),
	)

	return rows.map((row) => {
		const enterprise = mapEnterpriseRow(row, relations)

		return {
			id: enterprise.id,
			slug: enterprise.slug,
			name: enterprise.name,
			shortDescription: enterprise.shortDescription,
			problem: enterprise.problem,
			logoKey: enterprise.logoKey,
			coverKey: enterprise.coverKey,
			isFeatured: enterprise.isFeatured,
			categories: enterprise.categories,
			countries: enterprise.countries,
			sdgs: enterprise.sdgs,
		}
	})
}

function mapEnterpriseRow(row: EnterpriseRow, relations: RelationRows): Enterprise {
	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		shortDescription: row.short_description,
		problem: row.problem,
		solution: row.solution,
		impact: row.impact,
		longContent: row.long_content,
		websiteUrl: row.website_url,
		instagramUrl: row.instagram_url,
		logoKey: row.logo_key,
		coverKey: row.cover_key,
		status: row.status,
		isFeatured: row.is_featured === 1,
		categories: relations.categories.get(row.id) ?? [],
		audiences: relations.audiences.get(row.id) ?? [],
		businessModels: relations.businessModels.get(row.id) ?? [],
		countries: relations.countries.get(row.id) ?? [],
		sdgs: relations.sdgs.get(row.id) ?? [],
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	}
}

async function loadRelations(db: D1Database, enterpriseIds: Array<string>): Promise<RelationRows> {
	if (enterpriseIds.length === 0) {
		return emptyRelations()
	}

	const placeholders = enterpriseIds.map(() => '?').join(', ')
	const [categories, audiences, businessModels, countries, sdgs] = await Promise.all([
		db
			.prepare(
				`SELECT ec.enterprise_id, c.id, c.name, c.icon, c.sort_order
					FROM enterprise_categories ec
					INNER JOIN categories c ON c.id = ec.category_id
					WHERE ec.enterprise_id IN (${placeholders})
					ORDER BY c.sort_order`,
			)
			.bind(...enterpriseIds)
			.all<TaxonomyRow & { enterprise_id: string }>(),
		db
			.prepare(
				`SELECT ea.enterprise_id, a.id, a.name, a.icon, a.sort_order
					FROM enterprise_audiences ea
					INNER JOIN audiences a ON a.id = ea.audience_id
					WHERE ea.enterprise_id IN (${placeholders})
					ORDER BY a.sort_order`,
			)
			.bind(...enterpriseIds)
			.all<TaxonomyRow & { enterprise_id: string }>(),
		db
			.prepare(
				`SELECT ebm.enterprise_id, bm.id, bm.name, bm.sort_order
					FROM enterprise_business_models ebm
					INNER JOIN business_models bm ON bm.id = ebm.business_model_id
					WHERE ebm.enterprise_id IN (${placeholders})
					ORDER BY bm.sort_order`,
			)
			.bind(...enterpriseIds)
			.all<BusinessModelRow & { enterprise_id: string }>(),
		db
			.prepare(
				`SELECT ec.enterprise_id, c.code, c.name, c.flag, c.sort_order
					FROM enterprise_countries ec
					INNER JOIN countries c ON c.code = ec.country_code
					WHERE ec.enterprise_id IN (${placeholders})
					ORDER BY c.sort_order`,
			)
			.bind(...enterpriseIds)
			.all<CountryRow & { enterprise_id: string }>(),
		db
			.prepare(
				`SELECT es.enterprise_id, s.id, s.name, s.color, s.logo_key
					FROM enterprise_sdgs es
					INNER JOIN sdgs s ON s.id = es.sdg_id
					WHERE es.enterprise_id IN (${placeholders})
					ORDER BY s.id`,
			)
			.bind(...enterpriseIds)
			.all<SdgRow & { enterprise_id: string }>(),
	])

	return {
		categories: groupByEnterprise(categories.results, mapTaxonomyRow),
		audiences: groupByEnterprise(audiences.results, mapTaxonomyRow),
		businessModels: groupByEnterprise(businessModels.results, mapBusinessModelRow),
		countries: groupByEnterprise(countries.results, mapCountryRow),
		sdgs: groupByEnterprise(sdgs.results, mapSdgRow),
	}
}

function emptyRelations(): RelationRows {
	return {
		categories: new Map(),
		audiences: new Map(),
		businessModels: new Map(),
		countries: new Map(),
		sdgs: new Map(),
	}
}

function groupByEnterprise<Row extends { enterprise_id: string }, Value>(
	rows: Array<Row>,
	mapper: (row: Row) => Value,
): Map<string, Array<Value>> {
	const map = new Map<string, Array<Value>>()

	for (const row of rows) {
		const values = map.get(row.enterprise_id) ?? []
		values.push(mapper(row))
		map.set(row.enterprise_id, values)
	}

	return map
}

async function replaceEnterpriseRelations(
	db: D1Database,
	enterpriseId: string,
	input: UpsertEnterpriseInput,
): Promise<void> {
	const deleteStatements = [
		'DELETE FROM enterprise_categories WHERE enterprise_id = ?',
		'DELETE FROM enterprise_audiences WHERE enterprise_id = ?',
		'DELETE FROM enterprise_business_models WHERE enterprise_id = ?',
		'DELETE FROM enterprise_countries WHERE enterprise_id = ?',
		'DELETE FROM enterprise_sdgs WHERE enterprise_id = ?',
	].map((statement) => db.prepare(statement).bind(enterpriseId))

	await db.batch(deleteStatements)

	const insertStatements = [
		...input.categoryIds.map((id) =>
			db
				.prepare('INSERT INTO enterprise_categories (enterprise_id, category_id) VALUES (?, ?)')
				.bind(enterpriseId, id),
		),
		...input.audienceIds.map((id) =>
			db
				.prepare('INSERT INTO enterprise_audiences (enterprise_id, audience_id) VALUES (?, ?)')
				.bind(enterpriseId, id),
		),
		...input.businessModelIds.map((id) =>
			db
				.prepare(
					'INSERT INTO enterprise_business_models (enterprise_id, business_model_id) VALUES (?, ?)',
				)
				.bind(enterpriseId, id),
		),
		...input.countryCodes.map((code) =>
			db
				.prepare('INSERT INTO enterprise_countries (enterprise_id, country_code) VALUES (?, ?)')
				.bind(enterpriseId, code),
		),
		...input.sdgIds.map((id) =>
			db.prepare('INSERT INTO enterprise_sdgs (enterprise_id, sdg_id) VALUES (?, ?)').bind(enterpriseId, id),
		),
	]

	if (insertStatements.length > 0) {
		await db.batch(insertStatements)
	}
}

async function mapEditorialListRow(
	db: D1Database,
	row: EditorialListRow,
	publishedItemsOnly: boolean,
): Promise<EditorialList> {
	const itemRows = await db
		.prepare(
			`SELECT e.*
				FROM editorial_list_items eli
				INNER JOIN enterprises e ON e.id = eli.enterprise_id
				WHERE eli.editorial_list_id = ?
				${publishedItemsOnly ? 'AND e.status = ?' : ''}
				ORDER BY eli.sort_order`,
		)
		.bind(...(publishedItemsOnly ? [row.id, 'published'] : [row.id]))
		.all<EnterpriseRow>()
	const items = await mapEnterpriseSummaries(db, itemRows.results)

	return {
		id: row.id,
		slug: row.slug,
		title: row.title,
		description: row.description,
		status: row.status,
		items,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	}
}

function mapSubmissionRow(row: SubmissionRow): Submission {
	return {
		id: row.id,
		name: row.name,
		description: row.description,
		contactEmail: row.contact_email,
		websiteUrl: row.website_url,
		problem: row.problem,
		solution: row.solution,
		status: row.status,
		enterpriseId: row.enterprise_id,
		rejectionReason: row.rejection_reason,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	}
}

export async function rejectSubmission(
	db: D1Database,
	submissionId: string,
	reason?: string,
): Promise<Submission> {
	const submission = await getSubmissionById(db, submissionId)
	if (!submission) {
		throw new Error('Submission not found')
	}

	await db
		.prepare(
			'UPDATE submissions SET status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
		)
		.bind('rejected', reason?.trim() || null, submissionId)
		.run()

	const updated = await getSubmissionById(db, submissionId)
	if (!updated) {
		throw new Error('Submission not found after reject')
	}
	return updated
}

export async function getEnterpriseById(db: D1Database, id: string): Promise<Enterprise | null> {
	const row = await db
		.prepare('SELECT * FROM enterprises WHERE id = ? LIMIT 1')
		.bind(id)
		.first<EnterpriseRow>()

	if (!row) return null
	const relations = await loadRelations(db, [row.id])
	return mapEnterpriseRow(row, relations)
}

function mapTaxonomyRow(row: TaxonomyRow): TaxonomyItem {
	return {
		id: row.id,
		name: row.name,
		icon: row.icon,
		sortOrder: row.sort_order,
	}
}

function mapBusinessModelRow(row: BusinessModelRow): TaxonomyItem {
	return {
		id: row.id,
		name: row.name,
		sortOrder: row.sort_order,
	}
}

function mapCountryRow(row: CountryRow): Country {
	return {
		code: row.code,
		name: row.name,
		flag: row.flag,
		sortOrder: row.sort_order,
	}
}

function mapSdgRow(row: SdgRow): Sdg {
	return {
		id: row.id,
		name: row.name,
		color: row.color,
		logoKey: row.logo_key,
	}
}

function slugify(value: string): string {
	return value
		.toLocaleLowerCase('tr')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/ı/g, 'i')
		.replace(/ğ/g, 'g')
		.replace(/ü/g, 'u')
		.replace(/ş/g, 's')
		.replace(/ö/g, 'o')
		.replace(/ç/g, 'c')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}
