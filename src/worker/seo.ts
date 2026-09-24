export const SITE_ORIGIN = 'https://sosyal.genclink.com'

export type SitemapEntry = {
	path: string
	lastmod?: string | null
}

const STATIC_SITEMAP_ENTRIES: Array<SitemapEntry> = [{ path: '/' }]

export type RssItem = {
	title: string
	path: string
	description: string
	publishedAt: string
}

export function buildRecentEnterprisesRss(items: Array<RssItem>): string {
	const body = items
		.map((item) => {
			const link = `${SITE_ORIGIN}${normalizeIndexablePath(item.path)}`
			return [
				'    <item>',
				`      <title>${escapeXml(item.title)}</title>`,
				`      <link>${escapeXml(link)}</link>`,
				`      <guid>${escapeXml(link)}</guid>`,
				`      <description>${escapeXml(item.description)}</description>`,
				`      <pubDate>${escapeXml(toRfc822(item.publishedAt))}</pubDate>`,
				'    </item>',
			].join('\n')
		})
		.join('\n')

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0">',
		'  <channel>',
		'    <title>Sosyal Girişimler Rehberi — Son eklenenler</title>',
		`    <link>${SITE_ORIGIN}/</link>`,
		'    <description>Rehbere yeni eklenen sosyal girişimler.</description>',
		`    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
		body,
		'  </channel>',
		'</rss>',
		'',
	]
		.filter((line) => line.length > 0)
		.join('\n')
}

function toRfc822(value: string): string {
	const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`
	const date = new Date(normalized)
	return Number.isNaN(date.getTime()) ? new Date(0).toUTCString() : date.toUTCString()
}

export function buildEnterpriseJsonLd(input: {
	name: string
	description: string
	canonicalUrl: string
	websiteUrl?: string | null
	instagramUrl?: string | null
	imageUrl?: string | null
}): string {
	const sameAs = [input.websiteUrl, input.instagramUrl].filter(
		(value): value is string => Boolean(value),
	)
	return JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: input.name,
		description: input.description,
		url: input.websiteUrl || input.canonicalUrl,
		mainEntityOfPage: input.canonicalUrl,
		...(input.imageUrl ? { image: input.imageUrl } : {}),
		...(sameAs.length > 0 ? { sameAs } : {}),
	}).replace(/</g, '\\u003c')
}

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
