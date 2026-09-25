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
	isSubmissionImageKey,
	validateNewsletterEmail,
	validateSubmissionInput,
} from './request'
import {
	addEnterpriseMedia,
	applyEditSuggestion,
	approveSubmission,
	createEditSuggestion,
	countNewsletterSubscribers,
	createSubmission,
	subscribeNewsletter,
	createTaxonomyItem,
	deleteEnterprise,
	deleteEnterpriseMedia,
	deleteTaxonomyItem,
	getDirectoryMeta,
	getEnterpriseById,
	getEnterpriseBySlug,
	getEnterpriseDetailBySlug,
	getEnterpriseSupport,
	getHomePayload,
	listEditSuggestions,
	listEditorialLists,
	listEnterpriseGallery,
	listEnterprises,
	listSubmissions,
	listTaxonomyAdmin,
	rejectEditSuggestion,
	rejectSubmission,
	reorderEnterpriseMedia,
	updateEnterpriseMedia,
	toggleEnterpriseSupport,
	updateTaxonomyItem,
	upsertEditorialList,
	upsertEnterprise,
} from './repository'
import type { TaxonomyType, UpdateTaxonomyInput, UpsertTaxonomyInput } from '@/shared/types'
import { AutofillError, autofillEnterprise } from './autofill'
import { apiError, json, readJsonBody } from './responses'
import {
	buildEnterpriseJsonLd,
	buildRecentEnterprisesRss,
	buildRobotsTxt,
	buildSitemapXml,
	type SitemapEntry,
} from './seo'

export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			const url = new URL(request.url)
			const seoResponse = await handleSeoAssetRequest(request, env, url)
			if (seoResponse) return seoResponse

			if (url.pathname.startsWith('/api/')) {
				return await handleApiRequest(request, env, ctx, url)
			}

			// Per-enterprise SEO/social-share metadata: rewrite index.html
			// OG/Twitter tags so previews are enterprise-specific.
			const enterprisePageMatch = url.pathname.match(
				/^\/girisimler\/([^/]+)\/?$/,
			)
			if (enterprisePageMatch && request.method === 'GET') {
				const rewritten = await renderEnterpriseHtml(
					request,
					env,
					url,
					decodeURIComponent(enterprisePageMatch[1]),
				)
				if (rewritten) return rewritten
			}

			return await env.ASSETS.fetch(request)
		} catch (error) {
			console.error(JSON.stringify({ level: 'error', message: 'Unhandled worker error', error: String(error) }))

			return apiError('internal_error', 'Beklenmeyen bir hata oluştu.', 500)
		}
	},
} satisfies ExportedHandler<Env>

async function handleSeoAssetRequest(
	request: Request,
	env: Env,
	url: URL,
): Promise<Response | null> {
	if (
		url.pathname !== '/robots.txt' &&
		url.pathname !== '/sitemap.xml' &&
		url.pathname !== '/feed.xml'
	) {
		return null
	}

	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return new Response(null, {
			status: 405,
			headers: {
				allow: 'GET, HEAD',
			},
		})
	}

	if (url.pathname === '/robots.txt') {
		return seoTextResponse(buildRobotsTxt(), 'text/plain; charset=utf-8', request.method)
	}

	if (url.pathname === '/feed.xml') {
		return seoTextResponse(
			buildRecentEnterprisesRss(await listRecentEnterpriseRssItems(env)),
			'application/rss+xml; charset=utf-8',
			request.method,
		)
	}

	const entries = await listPublishedEnterpriseSitemapEntries(env)
	return seoTextResponse(
		buildSitemapXml(entries),
		'application/xml; charset=utf-8',
		request.method,
	)
}

async function listPublishedEnterpriseSitemapEntries(env: Env): Promise<Array<SitemapEntry>> {
	try {
		const rows = await env.DB.prepare(
			'SELECT slug, updated_at FROM enterprises WHERE status = ? ORDER BY updated_at DESC',
		)
			.bind('published')
			.all<{ slug: string; updated_at: string }>()

		return rows.results.map((row) => ({
			path: `/girisimler/${row.slug}`,
			lastmod: row.updated_at,
		}))
	} catch (error) {
		console.error(
			JSON.stringify({
				level: 'error',
				message: 'Failed to build dynamic sitemap entries',
				error: String(error),
			}),
		)

		return []
	}
}

async function listRecentEnterpriseRssItems(env: Env) {
	try {
		const rows = await env.DB.prepare(
			`SELECT name, slug, short_description, created_at
				FROM enterprises
				WHERE status = ?
				ORDER BY created_at DESC
				LIMIT 30`,
		)
			.bind('published')
			.all<{
				name: string
				slug: string
				short_description: string
				created_at: string
			}>()

		return rows.results.map((row) => ({
			title: row.name,
			path: `/girisimler/${row.slug}`,
			description: row.short_description,
			publishedAt: row.created_at,
		}))
	} catch (error) {
		console.error(
			JSON.stringify({
				level: 'error',
				message: 'Failed to build recent enterprise RSS',
				error: String(error),
			}),
		)
		return []
	}
}

function seoTextResponse(body: string, contentType: string, method: string): Response {
	return new Response(method === 'HEAD' ? null : body, {
		status: 200,
		headers: {
			'content-type': contentType,
			'cache-control': 'public, max-age=3600',
		},
	})
}

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
		return withEdgeCache(request, ctx, 300, async () => json(await getDirectoryMeta(env.DB)))
	}

	if (request.method === 'GET' && pathname === '/api/home') {
		return handleCachedHome(env, ctx)
	}

	if (request.method === 'GET' && pathname === '/api/enterprises') {
		return withEdgeCache(request, ctx, 60, async () =>
			json(await listEnterprises(env.DB, parseEnterpriseFilters(url))),
		)
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

		let support: { supportCount: number; supported: boolean }
		try {
			support = await getEnterpriseSupport(env.DB, enterprise.id, await visitorKey(request))
		} catch {
			support = { supportCount: 0, supported: false }
		}

		return json({ ...enterprise, ...support })
	}

	const supportMatch = pathname.match(/^\/api\/enterprises\/([^/]+)\/votes$/)
	if (request.method === 'POST' && supportMatch) {
		try {
			const result = await toggleEnterpriseSupport(
				env.DB,
				decodeURIComponent(supportMatch[1]),
				await visitorKey(request),
			)
			return json(result)
		} catch (error) {
			return apiError('bad_request', errorMessage(error), 400)
		}
	}

	const editSuggestionMatch = pathname.match(
		/^\/api\/enterprises\/([^/]+)\/edit-suggestions$/,
	)
	if (request.method === 'POST' && editSuggestionMatch) {
		if (!(await allowPublicWrite(env, request, 'edit-suggestion', 10))) {
			return apiError('bad_request', 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.', 429)
		}
		const slug = decodeURIComponent(editSuggestionMatch[1])
		const body = (await readJsonBody(request)) as {
			message?: unknown
			contactEmail?: unknown
		}
		if (typeof body.message !== 'string' || body.message.trim().length < 10) {
			return apiError('bad_request', 'En az 10 karakter mesaj gerekli.', 422)
		}
		try {
			const suggestion = await createEditSuggestion(env.DB, slug, {
				message: body.message,
				contactEmail:
					typeof body.contactEmail === 'string' ? body.contactEmail : undefined,
			})
			return json(suggestion, { status: 201 })
		} catch (error) {
			return apiError('bad_request', errorMessage(error), 400)
		}
	}

	if (request.method === 'POST' && pathname === '/api/submissions/media') {
		return uploadSubmissionImage(request, env)
	}

	if (request.method === 'POST' && pathname === '/api/newsletter') {
		return subscribeToNewsletter(request, env)
	}

	if (request.method === 'POST' && pathname === '/api/submissions') {
		if (!(await allowPublicWrite(env, request, 'submission', 10))) {
			return apiError('bad_request', 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.', 429)
		}
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
		return withEdgeCache(request, ctx, 31536000, () =>
			getMedia(env, decodeURIComponent(mediaMatch[1])),
		)
	}

	if (pathname.startsWith('/api/admin/')) {
		return handleAdminRequest(request, env, url)
	}

	return apiError('not_found', 'API rotası bulunamadı.', 404)
}

// Public, visitor-independent GET responses are kept in the Cloudflare edge
// cache for a short TTL so filter/search traffic doesn't hit D1 every time.
async function withEdgeCache(
	request: Request,
	ctx: ExecutionContext,
	ttlSeconds: number,
	produce: () => Promise<Response>,
): Promise<Response> {
	const cache = caches.default
	const cacheKey = new Request(request.url, { method: 'GET' })
	// Short-lived API data: edge cache only (s-maxage), browsers revalidate.
	// Set on every return because the zone's browser-TTL rewrites cached copies.
	const cacheControl =
		ttlSeconds >= 31536000
			? 'public, max-age=31536000, immutable'
			: `public, max-age=0, s-maxage=${ttlSeconds}, must-revalidate`
	const cached = await cache.match(cacheKey)
	if (cached) {
		const hit = new Response(cached.body, cached)
		hit.headers.set('cache-control', cacheControl)
		return hit
	}

	const response = await produce()
	if (response.ok) {
		response.headers.set('cache-control', cacheControl)
		ctx.waitUntil(cache.put(cacheKey, response.clone()))
	}
	return response
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

		let newsletterSubscribers: number
		try {
			newsletterSubscribers = await countNewsletterSubscribers(env.DB)
		} catch {
			newsletterSubscribers = 0
		}

		const pendingReview = await env.DB.prepare(
			'SELECT COUNT(*) AS count FROM enterprises WHERE needs_review = 1',
		).first<{ count: number }>()

		return json({
			enterprises: enterprises.total,
			pendingReview: pendingReview?.count ?? 0,
			pendingSubmissions: submissions.filter((submission) => submission.status === 'pending').length,
			editorialLists: editorialLists.length,
			newsletterSubscribers,
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

	if (request.method === 'DELETE' && adminEnterpriseMatch) {
		try {
			await deleteEnterprise(env.DB, decodeURIComponent(adminEnterpriseMatch[1]))
			await env.CACHE.delete('home:v1')
			return json({ ok: true })
		} catch (error) {
			return apiError('not_found', errorMessage(error), 404)
		}
	}

	if (request.method === 'POST' && pathname === '/api/admin/enterprises/autofill') {
		return handleAutofill(request, env)
	}

	const reviewMatch = pathname.match(/^\/api\/admin\/enterprises\/([^/]+)\/review$/)
	if (request.method === 'POST' && reviewMatch) {
		await env.DB.prepare('UPDATE enterprises SET needs_review = 0 WHERE id = ?')
			.bind(decodeURIComponent(reviewMatch[1]))
			.run()
		return json({ ok: true })
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

	if (request.method === 'GET' && pathname === '/api/admin/edit-suggestions') {
		return json(await listEditSuggestions(env.DB))
	}

	const editSuggestionApplyMatch = pathname.match(
		/^\/api\/admin\/edit-suggestions\/([^/]+)\/apply$/,
	)
	if (request.method === 'POST' && editSuggestionApplyMatch) {
		try {
			const updated = await applyEditSuggestion(
				env.DB,
				decodeURIComponent(editSuggestionApplyMatch[1]),
			)
			return json(updated)
		} catch (error) {
			return apiError('not_found', errorMessage(error), 404)
		}
	}

	const editSuggestionRejectMatch = pathname.match(
		/^\/api\/admin\/edit-suggestions\/([^/]+)\/reject$/,
	)
	if (request.method === 'POST' && editSuggestionRejectMatch) {
		const body = (await readJsonBody(request).catch(() => ({}))) as { reason?: unknown }
		const reason = typeof body.reason === 'string' ? body.reason : undefined
		try {
			const updated = await rejectEditSuggestion(
				env.DB,
				decodeURIComponent(editSuggestionRejectMatch[1]),
				reason,
			)
			return json(updated)
		} catch (error) {
			return apiError('not_found', errorMessage(error), 404)
		}
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

	const taxonomyListMatch = pathname.match(/^\/api\/admin\/taxonomy\/([a-z-]+)$/)
	if (taxonomyListMatch) {
		const type = taxonomyListMatch[1]
		if (!isTaxonomyType(type)) {
			return apiError('not_found', 'Bilinmeyen sınıflandırma türü.', 404)
		}
		if (request.method === 'GET') {
			return json(await listTaxonomyAdmin(env.DB, type))
		}
		if (request.method === 'POST') {
			const body = (await readJsonBody(request)) as Partial<UpsertTaxonomyInput>
			console.log('taxonomy.create.received', { type, body })
			if (typeof body.id !== 'string' || typeof body.name !== 'string') {
				return apiError(
					'bad_request',
					`id ve name gerekli. Gelen: id=${typeof body.id}, name=${typeof body.name}`,
					400,
				)
			}
			try {
				const created = await createTaxonomyItem(env.DB, type, {
					id: body.id,
					name: body.name,
					icon: typeof body.icon === 'string' ? body.icon : null,
					sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
				})
				await env.CACHE.delete('home:v1')
				return json(created, { status: 201 })
			} catch (error) {
				console.error('taxonomy.create.error', { type, body, error: String(error) })
				return apiError('bad_request', errorMessage(error), 400)
			}
		}
	}

	const taxonomyItemMatch = pathname.match(/^\/api\/admin\/taxonomy\/([a-z-]+)\/([^/]+)$/)
	if (taxonomyItemMatch) {
		const type = taxonomyItemMatch[1]
		const id = decodeURIComponent(taxonomyItemMatch[2])
		if (!isTaxonomyType(type)) {
			return apiError('not_found', 'Bilinmeyen sınıflandırma türü.', 404)
		}
		if (request.method === 'PATCH') {
			const body = (await readJsonBody(request)) as UpdateTaxonomyInput
			try {
				await updateTaxonomyItem(env.DB, type, id, body)
				await env.CACHE.delete('home:v1')
				return json({ ok: true })
			} catch (error) {
				return apiError('bad_request', errorMessage(error), 400)
			}
		}
		if (request.method === 'DELETE') {
			try {
				await deleteTaxonomyItem(env.DB, type, id)
				await env.CACHE.delete('home:v1')
				return json({ ok: true })
			} catch (error) {
				return apiError('bad_request', errorMessage(error), 409)
			}
		}
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

function isTaxonomyType(value: string): value is TaxonomyType {
	return value === 'categories' || value === 'audiences' || value === 'business-models'
}

function errorMessage(error: unknown): string {
	const raw = error instanceof Error ? error.message : 'İşlem tamamlanamadı.'
	if (raw.includes('UNIQUE constraint failed')) {
		if (raw.endsWith('.name')) return 'Bu isim zaten kullanılıyor.'
		if (raw.endsWith('.id') || raw.endsWith('.code')) {
			return 'Bu kimlik zaten kullanılıyor.'
		}
		return 'Bu kayıt zaten mevcut.'
	}
	return raw
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

async function allowPublicWrite(
	env: Env,
	request: Request,
	action: string,
	limit: number,
): Promise<boolean> {
	const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
	const key = `public:${action}:${ip}`
	const attempts = Number(await env.CACHE.get(key))
	if (Number.isFinite(attempts) && attempts >= limit) return false
	await env.CACHE.put(key, String((Number.isFinite(attempts) ? attempts : 0) + 1), {
		expirationTtl: 60 * 60,
	})
	return true
}

async function visitorKey(request: Request): Promise<string> {
	const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
	const userAgent = request.headers.get('user-agent') ?? ''
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(`${ip}|${userAgent}`),
	)
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
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

const SUBMISSION_IMAGE_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'image/avif',
])
const SUBMISSION_IMAGE_MAX_BYTES = 5 * 1024 * 1024

async function subscribeToNewsletter(request: Request, env: Env): Promise<Response> {
	const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
	const rateKey = `newsletter:${ip}`
	const attempts = Number(await env.CACHE.get(rateKey))
	if (Number.isFinite(attempts) && attempts >= 10) {
		return apiError('bad_request', 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.', 429)
	}

	const body = (await readJsonBody(request)) as { email?: unknown }
	const validation = validateNewsletterEmail(body.email)
	if (!validation.ok) {
		return apiError('bad_request', validation.message, 422)
	}

	await env.CACHE.put(rateKey, String((Number.isFinite(attempts) ? attempts : 0) + 1), {
		expirationTtl: 60 * 60,
	})

	try {
		const result = await subscribeNewsletter(env.DB, validation.email)
		return json({ ok: true, ...result })
	} catch (error) {
		return apiError('internal_error', errorMessage(error), 500)
	}
}

async function uploadSubmissionImage(request: Request, env: Env): Promise<Response> {
	const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
	const rateKey = `submission-upload:${ip}`
	const attempts = Number(await env.CACHE.get(rateKey))
	if (Number.isFinite(attempts) && attempts >= 20) {
		return apiError('bad_request', 'Çok fazla görsel yüklendi. Lütfen daha sonra tekrar deneyin.', 429)
	}

	const formData = await request.formData()
	const file = formData.get('file')
	if (!(file instanceof File)) {
		return apiError('bad_request', 'Yüklenecek dosya bulunamadı.', 400)
	}
	if (!SUBMISSION_IMAGE_TYPES.has(file.type)) {
		return apiError('bad_request', 'Yalnızca JPEG, PNG, WebP, GIF veya AVIF yükleyebilirsiniz.', 400)
	}
	if (file.size <= 0 || file.size > SUBMISSION_IMAGE_MAX_BYTES) {
		return apiError('bad_request', 'Görsel 5 MB’den küçük olmalı.', 400)
	}

	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80) || 'image'
	const objectKey = await storeImage(env, `submissions/${crypto.randomUUID()}-${safeName}`, file)
	if (!isSubmissionImageKey(objectKey)) {
		return apiError('bad_request', 'Görsel yüklemesi geçersiz.', 400)
	}
	await env.CACHE.put(
		rateKey,
		String((Number.isFinite(attempts) ? attempts : 0) + 1),
		{ expirationTtl: 60 * 60 },
	)

	return json({ key: objectKey }, { status: 201 })
}

async function uploadMedia(request: Request, env: Env): Promise<Response> {
	const formData = await request.formData()
	const file = formData.get('file')

	if (!(file instanceof File)) {
		return apiError('bad_request', 'Yüklenecek dosya bulunamadı.', 400)
	}

	const key = await storeImage(
		env,
		`uploads/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`,
		file,
	)

	return json({ key }, { status: 201 })
}

async function handleAutofill(request: Request, env: Env): Promise<Response> {
	const body = (await readJsonBody(request)) as { websiteUrl?: unknown; instagramUrl?: unknown }
	try {
		const { imageUrls, logoUrl, ...fields } = await autofillEnterprise(
			env as Env & { APIFY_API_TOKEN?: string; GEMINI_API_KEY?: string },
			await getDirectoryMeta(env.DB),
			{
				websiteUrl: typeof body.websiteUrl === 'string' ? body.websiteUrl : undefined,
				instagramUrl: typeof body.instagramUrl === 'string' ? body.instagramUrl : undefined,
			},
		)
		const [logoKey, ...imageKeys] = await Promise.all(
			[logoUrl, ...imageUrls].map((imageUrl) => (imageUrl ? importRemoteImage(env, imageUrl) : null)),
		)
		return json({
			...fields,
			logoKey: logoKey ?? undefined,
			imageKeys: imageKeys.filter((key): key is string => key !== null),
		})
	} catch (error) {
		if (error instanceof AutofillError) return apiError('bad_request', error.message, 422)
		throw error
	}
}

async function importRemoteImage(env: Env, imageUrl: string): Promise<string | null> {
	try {
		const response = await fetch(imageUrl, { headers: { 'user-agent': 'Mozilla/5.0 SGR-Autofill' } })
		const type = response.headers.get('content-type')?.split(';')[0] ?? ''
		if (!response.ok || !type.startsWith('image/')) return null
		const blob = await response.blob()
		if (blob.size === 0 || blob.size > 15 * 1024 * 1024) return null
		const extension = type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'img'
		return await storeImage(
			env,
			`uploads/${crypto.randomUUID()}-autofill.${extension}`,
			new File([blob], `autofill.${extension}`, { type }),
		)
	} catch {
		return null
	}
}

// Raster uploads are re-encoded to AVIF (long edge ≤ 1600px) via the Images
// binding. GIF/SVG/AVIF and anything the binding rejects are stored as-is.
const AVIF_SOURCE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

async function storeImage(env: Env, key: string, file: File): Promise<string> {
	if (AVIF_SOURCE_TYPES.has(file.type)) {
		try {
			const result = await env.IMAGES.input(file.stream())
				.transform({ width: 1600, height: 1600, fit: 'scale-down' })
				.output({ format: 'image/avif', quality: 60 })
			const avifKey = key.replace(/\.[a-zA-Z0-9]+$/, '') + '.avif'
			await env.MEDIA.put(avifKey, result.response().body, {
				httpMetadata: { contentType: 'image/avif' },
			})
			return avifKey
		} catch (error) {
			console.warn(JSON.stringify({ level: 'warn', message: 'AVIF conversion failed', key, error: String(error) }))
		}
	}

	await env.MEDIA.put(key, file.stream(), {
		httpMetadata: { contentType: file.type },
	})
	return key
}

async function getMedia(env: Env, key: string): Promise<Response> {
	const object = await env.MEDIA.get(key)

	if (!object) {
		return apiError('not_found', 'Medya dosyası bulunamadı.', 404)
	}

	const headers = new Headers()
	object.writeHttpMetadata(headers)
	headers.set('etag', object.httpEtag)
	// Keys embed a random UUID and are never overwritten, so browsers and the
	// edge can keep them for a year.
	headers.set('cache-control', 'public, max-age=31536000, immutable')

	return new Response(object.body, { headers })
}

const SITE_NAME = 'Sosyal Girişimler Rehberi'

async function renderEnterpriseHtml(
	request: Request,
	env: Env,
	url: URL,
	slug: string,
): Promise<Response | null> {
	const enterprise = await getEnterpriseBySlug(env.DB, slug)
	if (!enterprise || enterprise.status !== 'published') {
		// Let SPA handle 404 / unpublished — return null to fall through.
		return null
	}

	const indexUrl = new URL('/', url).toString()
	const indexResponse = await env.ASSETS.fetch(
		new Request(indexUrl, {
			headers: request.headers,
		}),
	)
	if (!indexResponse.ok) return null

	const title = `${enterprise.name} — ${SITE_NAME}`
	const description = enterprise.shortDescription
	const canonicalUrl = `${url.origin}/girisimler/${enterprise.slug}`
	const imageKey =
		enterprise.coverKey ??
		enterprise.logoKey ??
		enterprise.gallery[0]?.key ??
		null
	const imageUrl = imageKey
		? `${url.origin}/api/media/${imageKey}`
		: `${url.origin}/og-image.png`

	const setMeta = (selector: string, content: string) => ({
		element(el: Element) {
			el.setAttribute('content', content)
		},
	})

	const rewriter = new HTMLRewriter()
		.on('title', {
			element(el) {
				el.setInnerContent(title)
			},
		})
		.on('meta[name="description"]', setMeta('description', description))
		.on('meta[property="og:type"]', setMeta('og:type', 'article'))
		.on('meta[property="og:title"]', setMeta('og:title', title))
		.on(
			'meta[property="og:description"]',
			setMeta('og:description', description),
		)
		.on('meta[property="og:url"]', setMeta('og:url', canonicalUrl))
		.on('meta[property="og:image"]', setMeta('og:image', imageUrl))
		.on(
			'meta[property="og:image:alt"]',
			setMeta('og:image:alt', `${enterprise.name} kapak görseli`),
		)
		.on('meta[name="twitter:title"]', setMeta('twitter:title', title))
		.on(
			'meta[name="twitter:description"]',
			setMeta('twitter:description', description),
		)
		.on('meta[name="twitter:image"]', setMeta('twitter:image', imageUrl))
		.on('link[rel="canonical"]', {
			element(el) {
				el.setAttribute('href', canonicalUrl)
			},
		})
		.on('head', {
			element(el) {
				const jsonLd = buildEnterpriseJsonLd({
					name: enterprise.name,
					description,
					canonicalUrl,
					websiteUrl: enterprise.websiteUrl,
					instagramUrl: enterprise.instagramUrl,
					imageUrl,
				})
				el.append(`<script type="application/ld+json">${jsonLd}</script>`, { html: true })
			},
		})
		// Drop any image:width/height meta because we no longer guarantee 1200×630
		// on per-enterprise covers; absent dimensions let crawlers auto-detect.
		.on('meta[property="og:image:width"]', {
			element(el) {
				el.remove()
			},
		})
		.on('meta[property="og:image:height"]', {
			element(el) {
				el.remove()
			},
		})

	const transformed = rewriter.transform(indexResponse)
	const headers = new Headers(transformed.headers)
	headers.set('content-type', 'text/html; charset=utf-8')
	headers.set('cache-control', 'public, max-age=0, must-revalidate')
	return new Response(transformed.body, {
		status: 200,
		headers,
	})
}
