import { describe, expect, it } from 'vitest'
import { buildRecentEnterprisesRss, buildRobotsTxt, buildSitemapXml } from './seo'

describe('buildRobotsTxt', () => {
	it('allows public crawling, blocks private surfaces, and links the canonical sitemap', () => {
		const robots = buildRobotsTxt()

		expect(robots).toBe(
			[
				'User-agent: *',
				'Allow: /',
				'Disallow: /admin',
				'Disallow: /api/',
				'',
				'Sitemap: https://sosyal.genclink.com/sitemap.xml',
				'',
			].join('\n'),
		)
		expect(robots).not.toContain('<html')
	})
})

describe('buildRecentEnterprisesRss', () => {
	it('lists recently added enterprises as an RSS channel', () => {
		const rss = buildRecentEnterprisesRss([
			{
				title: 'Fazla',
				path: '/girisimler/fazla',
				description: 'Gıda israfını azaltır.',
				publishedAt: '2026-09-20T10:00:00.000Z',
			},
		])

		expect(rss).toContain('<rss version="2.0">')
		expect(rss).toContain('<title>Fazla</title>')
		expect(rss).toContain('<link>https://sosyal.genclink.com/girisimler/fazla</link>')
		expect(rss).toContain('<description>Gıda israfını azaltır.</description>')
		expect(rss).toContain('<pubDate>Sun, 20 Sep 2026')
	})
})

describe('buildSitemapXml', () => {
	it('emits valid sitemap XML for canonical public URLs only', () => {
		const sitemap = buildSitemapXml([
			{ path: '/girisimler/fazla', lastmod: '2026-05-20T12:30:00.000Z' },
		])

		expect(sitemap).toContain(
			'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		)
		expect(sitemap).toContain('<loc>https://sosyal.genclink.com/</loc>')
		expect(sitemap).toContain('<loc>https://sosyal.genclink.com/girisimler/fazla</loc>')
		expect(sitemap).toContain('<lastmod>2026-05-20</lastmod>')
		expect(sitemap).not.toContain('<html')
		expect(sitemap).not.toContain('https://sosyal.genclink.com/admin')
		expect(sitemap).not.toContain('https://sosyal.genclink.com/api/')
	})

	it('rejects entries outside the canonical public path set', () => {
		expect(() => buildSitemapXml([{ path: '/admin' }])).toThrow(/non-indexable/)
		expect(() => buildSitemapXml([{ path: '/api/health' }])).toThrow(/non-indexable/)
		expect(() => buildSitemapXml([{ path: 'https://example.com/' }])).toThrow(/non-indexable/)
	})
})
