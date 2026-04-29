import { describe, expect, it } from 'vitest'
import {
	SESSION_COOKIE_NAME,
	createSessionCookie,
	hashPassword,
	hashSessionToken,
	parseSessionToken,
	verifyPassword,
} from './auth'

describe('password hashing', () => {
	it('verifies the original password and rejects a wrong password', async () => {
		const hashed = await hashPassword('new-secure-password')

		await expect(verifyPassword('new-secure-password', hashed)).resolves.toBe(true)
		await expect(verifyPassword('wrong-password', hashed)).resolves.toBe(false)
		expect(hashed.hash).not.toBe('new-secure-password')
		expect(hashed.salt.length).toBeGreaterThan(20)
	})
})

describe('session tokens', () => {
	it('hashes session tokens deterministically without storing the raw token', async () => {
		const first = await hashSessionToken('session-token')
		const second = await hashSessionToken('session-token')

		expect(first).toBe(second)
		expect(first).not.toBe('session-token')
	})

	it('sets an httpOnly secure cookie and parses it back', () => {
		const cookie = createSessionCookie('abc123', 60 * 60)
		const request = new Request('https://sosyal.example.com/admin', {
			headers: {
				cookie: `${SESSION_COOKIE_NAME}=abc123; theme=light`,
			},
		})

		expect(cookie).toContain(`${SESSION_COOKIE_NAME}=abc123`)
		expect(cookie).toContain('HttpOnly')
		expect(cookie).toContain('Secure')
		expect(cookie).toContain('SameSite=Lax')
		expect(parseSessionToken(request)).toBe('abc123')
	})
})
