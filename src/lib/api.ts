import type {
	AdminLoginInput,
	AdminUser,
	BootstrapOwnerInput,
	BootstrapStatus,
	CreateAdminUserInput,
	CurrentAdmin,
	DirectoryMeta,
	EditorialList,
	Enterprise,
	EnterpriseDetail,
	HomePayload,
	ListEnterprisesPayload,
	Submission,
	SubmissionInput,
	UpdateAdminUserInput,
	UpsertEditorialListInput,
	UpsertEnterpriseInput,
} from '@/shared/types'

import type { AdminMediaObject } from '@/shared/types'

type AdminSummary = {
	enterprises: number
	pendingSubmissions: number
	editorialLists: number
}

export async function getHome(): Promise<HomePayload> {
	return apiGet('/api/home')
}

export async function getDirectoryMeta(): Promise<DirectoryMeta> {
	return apiGet('/api/meta')
}

export async function listEnterprises(searchParams: URLSearchParams): Promise<ListEnterprisesPayload> {
	const query = searchParams.toString()

	return apiGet(`/api/enterprises${query.length > 0 ? `?${query}` : ''}`)
}

export async function getEnterprise(slug: string): Promise<EnterpriseDetail> {
	return apiGet(`/api/enterprises/${encodeURIComponent(slug)}`)
}

export async function createSubmission(input: SubmissionInput): Promise<Submission> {
	return apiPost('/api/submissions', input)
}

export async function getBootstrapStatus(): Promise<BootstrapStatus> {
	return apiGet('/api/admin/bootstrap-status')
}

export async function bootstrapOwner(input: BootstrapOwnerInput): Promise<CurrentAdmin> {
	return apiPost('/api/admin/bootstrap', input)
}

export async function loginAdmin(input: AdminLoginInput): Promise<CurrentAdmin> {
	return apiPost('/api/admin/login', input)
}

export async function logoutAdmin(): Promise<{ ok: true }> {
	return apiPost('/api/admin/logout', {})
}

export async function getCurrentAdmin(): Promise<CurrentAdmin> {
	return apiGet('/api/admin/me')
}

export async function listAdminUsers(): Promise<Array<AdminUser>> {
	return apiGet('/api/admin/users')
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<AdminUser> {
	return apiPost('/api/admin/users', input)
}

export async function updateAdminUser(id: string, input: UpdateAdminUserInput): Promise<AdminUser> {
	return apiPatch(`/api/admin/users/${encodeURIComponent(id)}`, input)
}

export async function getAdminSummary(): Promise<AdminSummary> {
	return apiGet('/api/admin/summary')
}

export async function listAdminEnterprises(
	searchParams?: URLSearchParams,
): Promise<ListEnterprisesPayload> {
	const query = searchParams?.toString() ?? ''
	return apiGet(`/api/admin/enterprises${query.length > 0 ? `?${query}` : ''}`)
}

export async function getAdminEnterprise(id: string): Promise<Enterprise> {
	return apiGet(`/api/admin/enterprises/${encodeURIComponent(id)}`)
}

export async function saveEnterprise(input: UpsertEnterpriseInput): Promise<Enterprise> {
	return apiPost('/api/admin/enterprises', input)
}

export async function listSubmissions(): Promise<Array<Submission>> {
	return apiGet('/api/admin/submissions')
}

export async function approveSubmission(id: string): Promise<Enterprise> {
	return apiPost(`/api/admin/submissions/${encodeURIComponent(id)}/approve`, {})
}

export async function rejectSubmission(id: string, reason?: string): Promise<Submission> {
	return apiPost(`/api/admin/submissions/${encodeURIComponent(id)}/reject`, { reason })
}

export async function listAdminMedia(): Promise<Array<AdminMediaObject>> {
	return apiGet('/api/admin/media')
}

export async function listAdminEditorialLists(): Promise<Array<EditorialList>> {
	return apiGet('/api/admin/editorial-lists')
}

export async function saveEditorialList(input: UpsertEditorialListInput): Promise<EditorialList> {
	return apiPost('/api/admin/editorial-lists', input)
}

export async function uploadMedia(file: File): Promise<{ key: string }> {
	const body = new FormData()
	body.set('file', file)
	const response = await fetch('/api/admin/media', {
		method: 'POST',
		credentials: 'include',
		body,
	})

	return parseResponse(response)
}

async function apiGet<ResponseBody>(path: string): Promise<ResponseBody> {
	const response = await fetch(path, {
		credentials: 'include',
	})

	return parseResponse(response)
}

async function apiPost<ResponseBody, RequestBody>(
	path: string,
	body: RequestBody,
): Promise<ResponseBody> {
	const response = await fetch(path, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		credentials: 'include',
		body: JSON.stringify(body),
	})

	return parseResponse(response)
}

async function apiPatch<ResponseBody, RequestBody>(
	path: string,
	body: RequestBody,
): Promise<ResponseBody> {
	const response = await fetch(path, {
		method: 'PATCH',
		headers: {
			'content-type': 'application/json',
		},
		credentials: 'include',
		body: JSON.stringify(body),
	})

	return parseResponse(response)
}

async function parseResponse<ResponseBody>(response: Response): Promise<ResponseBody> {
	const body = (await response.json()) as ResponseBody & { error?: { message?: string } }

	if (!response.ok) {
		throw new Error(body.error?.message ?? 'İstek tamamlanamadı.')
	}

	return body
}
