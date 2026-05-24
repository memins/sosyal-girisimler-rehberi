export const SITE_ORIGIN = 'https://sosyal.genclink.com'

export type SitemapEntry = {
	path: string
	lastmod?: string | null
}

const STATIC_SITEMAP_ENTRIES: Array<SitemapEntry> = [{ path: '/' }]

export function buildRobotsTxt(): string {
	return [
		'User-agent: *',
		'Allow: /',
		'Disallow: /admin',
		'Disallow: /api/',
		'',
		`Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
		'',
	].join('\n')
}

export function buildSitemapXml(entries: Array<SitemapEntry> = []): string {
	const seen = new Set<string>()
	const urls = [...STATIC_SITEMAP_ENTRIES, ...entries].map((entry) => {
		const path = normalizeIndexablePath(entry.path)
		const loc = `${SITE_ORIGIN}${path}`
		if (seen.has(loc)) return null
		seen.add(loc)

		return {
			loc,
			lastmod: normalizeLastmod(entry.lastmod),
		}
	})

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls.flatMap((url) => {
			if (!url) return []

			return [
				'  <url>',
				`    <loc>${escapeXml(url.loc)}</loc>`,
				...(url.lastmod ? [`    <lastmod>${url.lastmod}</lastmod>`] : []),
				'  </url>',
			]
		}),
		'</urlset>',
		'',
	].join('\n')
}

function normalizeIndexablePath(path: string): string {
	const normalized = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path

	if (normalized === '/') return normalized
	if (/^\/girisimler\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) return normalized

	throw new Error(`non-indexable sitemap path: ${path}`)
}

function normalizeLastmod(value: string | null | undefined): string | null {
	if (!value) return null

	const date = value.slice(0, 10)
	return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
}
