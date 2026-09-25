// Minimal Cloudflare REST helpers for one-off data scripts (import, media
// migration). Auth: CLOUDFLARE_API_TOKEN, or the token `wrangler login` stored.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const ACCOUNT_ID = '32bfb6425bcdc0a0bc569e7332ce4d21'
export const DATABASE_ID = 'd37902c1-4337-4d94-867e-e5443cb84331'
export const DATABASE_NAME = 'sosyal-girisimler-rehberi'
export const BUCKET = 'sosyal-girisimler-media'

const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}`

let cachedToken = null
let tokenReadAt = 0

function token() {
	if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN
	// Wrangler OAuth tokens live ~1h; `wrangler whoami` refreshes them.
	if (!cachedToken || Date.now() - tokenReadAt > 10 * 60 * 1000) {
		execFileSync('npx', ['wrangler', 'whoami'], { stdio: 'ignore' })
		const configPath = join(homedir(), 'Library/Preferences/.wrangler/config/default.toml')
		const match = readFileSync(configPath, 'utf8').match(/oauth_token = "([^"]+)"/)
		if (!match) throw new Error('No wrangler OAuth token; run `npx wrangler login`.')
		cachedToken = match[1]
		tokenReadAt = Date.now()
	}
	return cachedToken
}

export async function d1Query(sql, params = []) {
	const response = await fetch(`${API}/d1/database/${DATABASE_ID}/query`, {
		method: 'POST',
		headers: { authorization: `Bearer ${token()}`, 'content-type': 'application/json' },
		body: JSON.stringify({ sql, params }),
	})
	const body = await response.json()
	if (!body.success) throw new Error(`D1 query failed: ${JSON.stringify(body.errors)}`)
	return body.result[0].results
}

export async function r2Put(key, data, contentType) {
	for (let attempt = 1; ; attempt += 1) {
		const response = await fetch(`${API}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(key)}`, {
			method: 'PUT',
			headers: { authorization: `Bearer ${token()}`, 'content-type': contentType },
			body: data,
		})
		if (response.ok) return
		if (attempt >= 3) throw new Error(`R2 put ${key} failed: ${response.status} ${await response.text()}`)
		await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
	}
}

export async function r2Get(key) {
	const response = await fetch(`${API}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(key)}`, {
		headers: { authorization: `Bearer ${token()}` },
	})
	if (!response.ok) throw new Error(`R2 get ${key} failed: ${response.status}`)
	return Buffer.from(await response.arrayBuffer())
}

export async function mapLimit(items, limit, worker) {
	const results = new Array(items.length)
	let next = 0
	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, async () => {
			while (next < items.length) {
				const index = next++
				results[index] = await worker(items[index], index)
			}
		}),
	)
	return results
}

export function sqlString(value) {
	if (value === null || value === undefined) return 'NULL'
	return `'${String(value).replace(/'/g, "''")}'`
}

export function slugify(value) {
	return value
		.toLocaleLowerCase('tr')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/ı/g, 'i')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

export function foldKey(value) {
	return slugify(value ?? '').replace(/-/g, '')
}

// Shared AVIF encoding settings: long edge ≤ 1600px keeps gallery/lightbox
// sharp while cutting typical Instagram JPEGs by ~70–85%.
export async function toAvif(sharp, input) {
	return sharp(input, { failOn: 'none' })
		.rotate()
		.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
		.avif({ quality: 55, effort: 4 })
		.toBuffer()
}
