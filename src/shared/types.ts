export type TaxonomyItem = {
	id: string
	name: string
	icon?: string
	sortOrder: number
}

export type Country = {
	code: string
	name: string
	flag: string
	sortOrder: number
}

export type Sdg = {
	id: number
	name: string
	color: string
	logoKey: string | null
}

export type EnterpriseStatus = 'draft' | 'published' | 'archived'

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export type EditorialListStatus = 'draft' | 'published' | 'archived'

export type AdminRole = 'owner' | 'admin'

export type AdminUser = {
	id: string
	email: string
	role: AdminRole
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export type CurrentAdmin = {
	user: AdminUser
}

export type BootstrapStatus = {
	needsSetup: boolean
	ownerEmail: string
}

export type EnterpriseMediaItem = {
	key: string
	caption: string | null
	sortOrder: number
}

export type Enterprise = {
	id: string
	slug: string
	name: string
	shortDescription: string
	problem: string
	solution: string
	impact: string
	longContent: string | null
	websiteUrl: string | null
	instagramUrl: string | null
	logoKey: string | null
	coverKey: string | null
	status: EnterpriseStatus
	isFeatured: boolean
	categories: Array<TaxonomyItem>
	audiences: Array<TaxonomyItem>
	businessModels: Array<TaxonomyItem>
	countries: Array<Country>
	sdgs: Array<Sdg>
	gallery: Array<EnterpriseMediaItem>
	createdAt: string
	updatedAt: string
}

export type EnterpriseSummary = Pick<
	Enterprise,
	| 'id'
	| 'slug'
	| 'name'
	| 'shortDescription'
	| 'problem'
	| 'logoKey'
	| 'coverKey'
	| 'isFeatured'
	| 'categories'
	| 'countries'
	| 'sdgs'
>

export type EnterpriseDetail = Enterprise & {
	related: Array<EnterpriseSummary>
}

export type Submission = {
	id: string
	name: string
	description: string
	contactEmail: string
	websiteUrl: string | null
	problem: string | null
	solution: string | null
	status: SubmissionStatus
	enterpriseId: string | null
	rejectionReason: string | null
	createdAt: string
	updatedAt: string
}

export type AdminMediaObject = {
	key: string
	size: number
	uploaded: string
	contentType: string | null
}

export type TaxonomyType = 'categories' | 'audiences' | 'business-models'

export type TaxonomyItemAdmin = {
	id: string
	name: string
	icon: string | null
	sortOrder: number
	usageCount: number
}

export type UpsertTaxonomyInput = {
	id: string
	name: string
	icon?: string | null
	sortOrder?: number
}

export type UpdateTaxonomyInput = {
	name?: string
	icon?: string | null
	sortOrder?: number
}

export type EditorialList = {
	id: string
	slug: string
	title: string
	description: string
	status: EditorialListStatus
	items: Array<EnterpriseSummary>
	createdAt: string
	updatedAt: string
}

export type DirectoryMeta = {
	categories: Array<TaxonomyItem>
	audiences: Array<TaxonomyItem>
	businessModels: Array<TaxonomyItem>
	countries: Array<Country>
	sdgs: Array<Sdg>
}

export type SiteStats = {
	enterprises: number
	countries: number
	categories: number
	sdgs: number
}

export type CategoryWithCount = TaxonomyItem & {
	enterpriseCount: number
}

export type HomePayload = {
	stats: SiteStats
	featured: Array<EnterpriseSummary>
	categories: Array<CategoryWithCount>
	editorialLists: Array<EditorialList>
}

export type EnterpriseSort = 'featured' | 'newest' | 'name'

export type ListEnterprisesPayload = {
	items: Array<EnterpriseSummary>
	total: number
	page: number
	pageSize: number
	sort: EnterpriseSort
}

export type SubmissionInput = {
	name: string
	description: string
	contactEmail: string
	websiteUrl?: string
	problem?: string
	solution?: string
}

export type UpsertEnterpriseInput = {
	id?: string
	name: string
	slug: string
	shortDescription: string
	problem: string
	solution: string
	impact: string
	longContent?: string
	websiteUrl?: string
	instagramUrl?: string
	logoKey?: string
	coverKey?: string
	status: EnterpriseStatus
	isFeatured: boolean
	categoryIds: Array<string>
	audienceIds: Array<string>
	businessModelIds: Array<string>
	countryCodes: Array<string>
	sdgIds: Array<number>
}

export type UpsertEditorialListInput = {
	id?: string
	title: string
	slug: string
	description: string
	status: EditorialListStatus
	enterpriseIds: Array<string>
}

export type BootstrapOwnerInput = {
	email: string
	password: string
}

export type AdminLoginInput = {
	email: string
	password: string
}

export type CreateAdminUserInput = {
	email: string
	password: string
	role: AdminRole
}

export type UpdateAdminUserInput = {
	role?: AdminRole
	isActive?: boolean
	password?: string
}
