import { describe, expect, it } from 'vitest'
import { buildRobotsTxt, buildSitemapXml } from './seo'

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
