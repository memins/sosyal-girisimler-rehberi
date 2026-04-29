import type {
	AdminLoginInput,
	BootstrapOwnerInput,
	CreateAdminUserInput,
	SubmissionInput,
	UpdateAdminUserInput,
	UpsertEditorialListInput,
	UpsertEnterpriseInput,
} from '@/shared/types'
import {
	FIRST_OWNER_EMAIL,
	SESSION_MAX_AGE_SECONDS,
	authenticateAdmin,
	bootstrapOwner,
	createAdminSession,
	createAdminUser,
	deleteAdminSession,
	getCurrentAdmin,
	listAdminUsers,
	needsBootstrap,
	updateAdminUser,
} from './admin-repository'
import { canManageAdminUsers, validateAdminUserUpdateInput } from './admin-policy'
import { clearSessionCookie, createSessionCookie } from './auth'
import {
	parseEnterpriseFilters,
	validateEditorialListInput,
	validateEnterpriseInput,
	validateSubmissionInput,
} from './request'
import {
	addEnterpriseMedia,
	approveSubmission,
	createSubmission,
	deleteEnterpriseMedia,
	getDirectoryMeta,
	getEnterpriseById,
	getEnterpriseDetailBySlug,
	getHomePayload,
	listEditorialLists,
	listEnterpriseGallery,
	listEnterprises,
	listSubmissions,
	rejectSubmission,
	reorderEnterpriseMedia,
	updateEnterpriseMedia,
	upsertEditorialList,
	upsertEnterprise,
} from './repository'
import { apiError, json, readJsonBody } from './responses'

export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			const url = new URL(request.url)

			if (url.pathname.startsWith('/api/')) {
				return await handleApiRequest(request, env, ctx, url)
			}

			return await env.ASSETS.fetch(request)
		} catch (error) {
			console.error(JSON.stringify({ level: 'error', message: 'Unhandled worker error', error: String(error) }))

			return apiError('internal_error', 'Beklenmeyen bir hata oluştu.', 500)
		}
	},
} satisfies ExportedHandler<Env>

async function handleApiRequest(
	request: Request,
	env: Env,
	ctx: ExecutionContext,
	url: URL,
): Promise<Response> {
	const pathname = url.pathname

	if (request.method === 'GET' && pathname === '/api/health') {
		return json({ ok: true })
	}

	if (request.method === 'GET' && pathname === '/api/meta') {
		return json(await getDirectoryMeta(env.DB))
	}

	if (request.method === 'GET' && pathname === '/api/home') {
		return handleCachedHome(env, ctx)
	}

	if (request.method === 'GET' && pathname === '/api/enterprises') {
		return json(await listEnterprises(env.DB, parseEnterpriseFilters(url)))
	}

	const enterpriseMatch = pathname.match(/^\/api\/enterprises\/([^/]+)$/)
	if (request.method === 'GET' && enterpriseMatch) {
		const enterprise = await getEnterpriseDetailBySlug(
			env.DB,
			decodeURIComponent(enterpriseMatch[1]),
		)

		if (!enterprise || enterprise.status !== 'published') {
			return apiError('not_found', 'Girişim bulunamadı.', 404)
		}

		return json(enterprise)
	}

	if (request.method === 'POST' && pathname === '/api/submissions') {
		const body = (await readJsonBody(request)) as SubmissionInput
		const validation = validateSubmissionInput(body)

		if (!validation.ok) {
			return json(validation, { status: 422 })
		}

		return json(await createSubmission(env.DB, body), { status: 201 })
	}

	if (request.method === 'GET' && pathname === '/api/editorial-lists') {
		return json(await listEditorialLists(env.DB, true))
	}

	const mediaMatch = pathname.match(/^\/api\/media\/(.+)$/)
	if (request.method === 'GET' && mediaMatch) {
		return getMedia(env, decodeURIComponent(mediaMatch[1]))
	}

	if (pathname.startsWith('/api/admin/')) {
		return handleAdminRequest(request, env, url)
	}

	return apiError('not_found', 'API rotası bulunamadı.', 404)
}

async function handleCachedHome(env: Env, ctx: ExecutionContext): Promise<Response> {
	const cacheKey = 'home:v1'
	const cached = await env.CACHE.get(cacheKey)

	if (cached) {
		return new Response(cached, {
			headers: {
				'content-type': 'application/json; charset=utf-8',
				'x-cache': 'hit',
			},
		})
	}

	const payload = await getHomePayload(env.DB)
	const body = JSON.stringify(payload)
	ctx.waitUntil(env.CACHE.put(cacheKey, body, { expirationTtl: 300 }))

	return new Response(body, {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'x-cache': 'miss',
		},
	})
}

async function handleAdminRequest(request: Request, env: Env, url: URL): Promise<Response> {
	const pathname = url.pathname

	if (request.method === 'GET' && pathname === '/api/admin/bootstrap-status') {
		return json({
			needsSetup: await needsBootstrap(env.DB),
			ownerEmail: FIRST_OWNER_EMAIL,
		})
	}

	if (request.method === 'POST' && pathname === '/api/admin/bootstrap') {
		const body = (await readJsonBody(request)) as BootstrapOwnerInput
		const validation = validateAuthCredentials(body.email, body.password)

		if (!validation.ok) {
			return json(validation, { status: 422 })
		}

		const rateLimitKey = getAuthRateLimitKey(request, body.email, 'bootstrap')
		if (await isRateLimited(env, rateLimitKey)) {
			return apiError('bad_request', 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.', 429)
		}

		let user
		try {
			user = await bootstrapOwner(env.DB, body)
		} catch (error) {
			return json(
				{
					ok: false,
					errors: {
						email: error instanceof Error ? error.message : 'Admin kurulumu tamamlanamadı.',
					},
				},
				{ status: 422 },
			)
		}
		const session = await createAdminSession(env.DB, user.id)
		await clearRateLimit(env, rateLimitKey)

		return json(
			{ user },
			{
				status: 201,
				headers: {
					'set-cookie': createSessionCookie(session.token, SESSION_MAX_AGE_SECONDS),
				},
			},
		)
	}

	if (request.method === 'POST' && pathname === '/api/admin/login') {
		const body = (await readJsonBody(request)) as AdminLoginInput
		const validation = validateAuthCredentials(body.email, body.password)

		if (!validation.ok) {
			return json(validation, { status: 422 })
		}

		const rateLimitKey = getAuthRateLimitKey(request, body.email, 'login')
		if (await isRateLimited(env, rateLimitKey)) {
			return apiError('bad_request', 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.', 429)
		}

		const user = await authenticateAdmin(env.DB, body)

		if (!user) {
			await recordFailedAuthAttempt(env, rateLimitKey)
			return apiError('unauthorized', 'E-posta veya şifre hatalı.', 401)
		}

		const session = await createAdminSession(env.DB, user.id)
		await clearRateLimit(env, rateLimitKey)

		return json(
			{ user },
			{
				headers: {
					'set-cookie': createSessionCookie(session.token, SESSION_MAX_AGE_SECONDS),
				},
			},
		)
	}

	if (request.method === 'POST' && pathname === '/api/admin/logout') {
		await deleteAdminSession(env.DB, request)

		return json(
			{ ok: true },
			{
				headers: {
					'set-cookie': clearSessionCookie(),
				},
			},
		)
	}

	const currentAdmin = await getCurrentAdmin(env.DB, request)

	if (!currentAdmin) {
		return apiError('unauthorized', 'Admin erişimi için giriş yapmanız gerekli.', 401)
	}

	if (isProtectedMutation(request.method) && !hasValidOrigin(request)) {
		return apiError('unauthorized', 'Admin işlemi için geçerli origin gerekli.', 403)
	}

	if (request.method === 'GET' && pathname === '/api/admin/me') {
		return json(currentAdmin)
	}

	if (request.method === 'GET' && pathname === '/api/admin/users') {
		if (!canManageAdminUsers(currentAdmin.user)) {
			return apiError('unauthorized', 'Admin kullanıcılarını sadece owner yönetebilir.', 403)
		}

		return json(await listAdminUsers(env.DB))
	}

	if (request.method === 'POST' && pathname === '/api/admin/users') {
		if (!canManageAdminUsers(currentAdmin.user)) {
			return apiError('unauthorized', 'Admin kullanıcılarını sadece owner yönetebilir.', 403)
		}

		const body = (await readJsonBody(request)) as CreateAdminUserInput
		const validation = validateAdminUserInput(body)

		if (!validation.ok) {
			return json(validation, { status: 422 })
		}

		return json(await createAdminUser(env.DB, body, currentAdmin.user.id), { status: 201 })
	}

	const userMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/)
	if (request.method === 'PATCH' && userMatch) {
		if (!canManageAdminUsers(currentAdmin.user)) {
			return apiError('unauthorized', 'Admin kullanıcılarını sadece owner yönetebilir.', 403)
		}

		const body = (await readJsonBody(request)) as UpdateAdminUserInput
		const validation = validateAdminUserUpdateInput(body)

		if (!validation.ok) {
			return json(validation, { status: 422 })
		}

		const user = await updateAdminUser(
			env.DB,
			decodeURIComponent(userMatch[1]),
			body,
			currentAdmin.user.id,
		)

		return json(user)
	}

	if (request.method === 'GET' && pathname === '/api/admin/summary') {
		const [enterprises, submissions, editorialLists] = await Promise.all([
			listEnterprises(env.DB, parseEnterpriseFilters(new URL('https://local/api/enterprises')), true),
			listSubmissions(env.DB),
			listEditorialLists(env.DB, false),
		])

		return json({
			enterprises: enterprises.total,
			pendingSubmissions: submissions.filter((submission) => submission.status === 'pending').length,
			editorialLists: editorialLists.length,
		})
	}

	if (request.method === 'GET' && pathname === '/api/admin/enterprises') {
		return json(await listEnterprises(env.DB, parseEnterpriseFilters(url), true))
	}

	const adminEnterpriseMatch = pathname.match(/^\/api\/admin\/enterprises\/([^/]+)$/)
	if (request.method === 'GET' && adminEnterpriseMatch) {
		const enterprise = await getEnterpriseById(env.DB, decodeURIComponent(adminEnterpriseMatch[1]))
		if (!enterprise) {
			return apiError('not_found', 'Girişim bulunamadı.', 404)
		}
		return json(enterprise)
	}

	if (request.method === 'POST' && pathname === '/api/admin/enterprises') {
		const body = (await readJsonBody(request)) as UpsertEnterpriseInput
		const validation = validateEnterpriseInput(body)

		if (!validation.ok) {
			return json(validation, { status: 422 })
		}

		const enterprise = await upsertEnterprise(env.DB, body)
		await env.CACHE.delete('home:v1')

		return json(enterprise, { status: 201 })
	}

	if (request.method === 'GET' && pathname === '/api/admin/submissions') {
		return json(await listSubmissions(env.DB))
	}

	const approveMatch = pathname.match(/^\/api\/admin\/submissions\/([^/]+)\/approve$/)
	if (request.method === 'POST' && approveMatch) {
		const enterprise = await approveSubmission(env.DB, decodeURIComponent(approveMatch[1]))
		await env.CACHE.delete('home:v1')

		return json(enterprise, { status: 201 })
	}

	const rejectMatch = pathname.match(/^\/api\/admin\/submissions\/([^/]+)\/reject$/)
	if (request.method === 'POST' && rejectMatch) {
		const body = (await readJsonBody(request).catch(() => ({}))) as { reason?: unknown }
		const reason = typeof body.reason === 'string' ? body.reason : undefined
		const submission = await rejectSubmission(env.DB, decodeURIComponent(rejectMatch[1]), reason)
		return json(submission)
	}

	if (request.method === 'GET' && pathname === '/api/admin/editorial-lists') {
		return json(await listEditorialLists(env.DB, false))
	}

	if (request.method === 'POST' && pathname === '/api/admin/editorial-lists') {
		const body = (await readJsonBody(request)) as UpsertEditorialListInput
		const validation = validateEditorialListInput(body)

		if (!validation.ok) {
			return json(validation, { status: 422 })
		}

		const editorialList = await upsertEditorialList(env.DB, body)
		await env.CACHE.delete('home:v1')

		return json(editorialList, { status: 201 })
	}

	if (request.method === 'POST' && pathname === '/api/admin/media') {
		return uploadMedia(request, env)
	}

	if (request.method === 'GET' && pathname === '/api/admin/media') {
		return listMedia(env)
	}

	const galleryListMatch = pathname.match(/^\/api\/admin\/enterprises\/([^/]+)\/media$/)
	if (galleryListMatch) {
		const enterpriseId = decodeURIComponent(galleryListMatch[1])
		if (request.method === 'GET') {
			return json(await listEnterpriseGallery(env.DB, enterpriseId))
		}
		if (request.method === 'POST') {
			const body = (await readJsonBody(request)) as { key?: unknown; caption?: unknown }
			if (typeof body.key !== 'string' || body.key.length === 0) {
				return apiError('bad_request', 'media key gerekli.', 400)
			}
			const item = await addEnterpriseMedia(env.DB, enterpriseId, {
				key: body.key,
				caption: typeof body.caption === 'string' ? body.caption : undefined,
			})
			await env.CACHE.delete('home:v1')
			return json(item, { status: 201 })
		}
		if (request.method === 'PATCH') {
			const body = (await readJsonBody(request)) as { keys?: unknown }
			if (!Array.isArray(body.keys) || !body.keys.every((k) => typeof k === 'string')) {
				return apiError('bad_request', 'keys liste olmalı.', 400)
			}
			await reorderEnterpriseMedia(env.DB, enterpriseId, body.keys as Array<string>)
			await env.CACHE.delete('home:v1')
			return json({ ok: true })
		}
	}

	const galleryItemMatch = pathname.match(
		/^\/api\/admin\/enterprises\/([^/]+)\/media\/(.+)$/,
	)
	if (galleryItemMatch) {
		const enterpriseId = decodeURIComponent(galleryItemMatch[1])
		const mediaKey = decodeURIComponent(galleryItemMatch[2])
		if (request.method === 'PATCH') {
			const body = (await readJsonBody(request)) as { caption?: unknown }
			await updateEnterpriseMedia(env.DB, enterpriseId, mediaKey, {
				caption: typeof body.caption === 'string' ? body.caption : null,
			})
			await env.CACHE.delete('home:v1')
			return json({ ok: true })
		}
		if (request.method === 'DELETE') {
			await deleteEnterpriseMedia(env.DB, enterpriseId, mediaKey)
			await env.CACHE.delete('home:v1')
			return json({ ok: true })
		}
	}

	return apiError('not_found', 'Admin API rotası bulunamadı.', 404)
}

async function listMedia(env: Env): Promise<Response> {
	const list = await env.MEDIA.list({ prefix: 'uploads/', limit: 1000 })
	return json(
		list.objects.map((obj) => ({
			key: obj.key,
			size: obj.size,
			uploaded: obj.uploaded.toISOString(),
			contentType: obj.httpMetadata?.contentType ?? null,
		})),
	)
}

function validateAuthCredentials(email: unknown, password: unknown) {
	const errors: Record<string, string> = {}

	if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
		errors.email = 'Geçerli bir e-posta adresi girin.'
	}

	if (typeof password !== 'string' || password.length < 10) {
		errors.password = 'Şifre en az 10 karakter olmalı.'
	}

	return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true }
}

function validateAdminUserInput(input: CreateAdminUserInput) {
	const credentialValidation = validateAuthCredentials(input.email, input.password)
	const errors = credentialValidation.ok ? {} : { ...credentialValidation.errors }

	if (input.role !== 'owner' && input.role !== 'admin') {
		errors.role = 'Rol owner veya admin olmalı.'
	}

	return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true }
}

function isProtectedMutation(method: string): boolean {
	return method === 'POST' || method === 'PATCH' || method === 'DELETE'
}

function hasValidOrigin(request: Request): boolean {
	const origin = request.headers.get('origin')

	if (!origin) {
		return false
	}

	return new URL(origin).origin === new URL(request.url).origin
}

function getAuthRateLimitKey(request: Request, email: string, action: string): string {
	const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown'

	return `admin-auth:${action}:${email.trim().toLowerCase()}:${ip}`
}

async function isRateLimited(env: Env, key: string): Promise<boolean> {
	const attempts = Number(await env.CACHE.get(key))

	return Number.isFinite(attempts) && attempts >= 10
}

async function recordFailedAuthAttempt(env: Env, key: string): Promise<void> {
	const attempts = Number(await env.CACHE.get(key))
	const nextAttempts = Number.isFinite(attempts) ? attempts + 1 : 1
	await env.CACHE.put(key, String(nextAttempts), { expirationTtl: 15 * 60 })
}

async function clearRateLimit(env: Env, key: string): Promise<void> {
	await env.CACHE.delete(key)
}

async function uploadMedia(request: Request, env: Env): Promise<Response> {
	const formData = await request.formData()
	const file = formData.get('file')

	if (!(file instanceof File)) {
		return apiError('bad_request', 'Yüklenecek dosya bulunamadı.', 400)
	}

	const key = `uploads/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
	await env.MEDIA.put(key, file.stream(), {
		httpMetadata: {
			contentType: file.type,
		},
	})

	return json({ key }, { status: 201 })
}

async function getMedia(env: Env, key: string): Promise<Response> {
	const object = await env.MEDIA.get(key)

	if (!object) {
		return apiError('not_found', 'Medya dosyası bulunamadı.', 404)
	}

	const headers = new Headers()
	object.writeHttpMetadata(headers)
	headers.set('etag', object.httpEtag)

	return new Response(object.body, { headers })
}
