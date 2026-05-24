import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

function readProjectFile(path: string): string {
	return readFileSync(join(root, path), 'utf8')
}

describe('technical SEO static assets', () => {
	it('serves a plain robots.txt with the canonical sitemap URL', () => {
		const robots = readProjectFile('public/robots.txt')

		expect(robots).toContain('User-agent: *')
		expect(robots).toContain('Allow: /')
		expect(robots).toContain('Disallow: /admin')
		expect(robots).toContain('Disallow: /api/')
		expect(robots).toContain('Sitemap: https://sosyal.genclink.com/sitemap.xml')
		expect(robots).not.toContain('<html')
	})

	it('serves a valid XML sitemap with only canonical public URLs', () => {
		const sitemap = readProjectFile('public/sitemap.xml')

		expect(sitemap).toContain(
			'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		)
		expect(sitemap).toContain('<loc>https://sosyal.genclink.com/</loc>')
		expect(sitemap).not.toContain('<html')
		expect(sitemap).not.toContain('https://sosyal.genclink.com/admin')
		expect(sitemap).not.toContain('https://sosyal.genclink.com/api/')
	})
})

describe('homepage metadata', () => {
	it('uses sosyal.genclink.com for canonical and Open Graph URLs', () => {
		const html = readProjectFile('index.html')

		expect(html).toContain('<link rel="canonical" href="https://sosyal.genclink.com/" />')
		expect(html).toContain('content="https://sosyal.genclink.com/"')
		expect(html).toContain('content="https://sosyal.genclink.com/og-image.png"')
		expect(html).not.toContain('genclink.com/sosyal')
	})
})
