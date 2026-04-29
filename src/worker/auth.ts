export const SESSION_COOKIE_NAME = 'sgr_admin_session'

const PASSWORD_ITERATIONS = 100000
const PASSWORD_KEY_LENGTH_BITS = 256

export type PasswordHash = {
	hash: string
	salt: string
}

export async function hashPassword(password: string, salt = createRandomToken(16)): Promise<PasswordHash> {
	const key = await crypto.subtle.importKey('raw', encode(password), 'PBKDF2', false, ['deriveBits'])
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			hash: 'SHA-256',
			salt: decodeBase64Url(salt),
			iterations: PASSWORD_ITERATIONS,
		},
		key,
		PASSWORD_KEY_LENGTH_BITS,
	)

	return {
		hash: encodeBase64Url(new Uint8Array(derivedBits)),
		salt,
	}
}

export async function verifyPassword(password: string, expected: PasswordHash): Promise<boolean> {
	const actual = await hashPassword(password, expected.salt)

	return timingSafeEqual(actual.hash, expected.hash)
}

export function createSessionToken(): string {
	return createRandomToken(32)
}

export async function hashSessionToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', encode(token))

	return encodeBase64Url(new Uint8Array(digest))
}

export function createSessionCookie(token: string, maxAgeSeconds: number): string {
	return [
		`${SESSION_COOKIE_NAME}=${token}`,
		'Path=/',
		'HttpOnly',
		'Secure',
		'SameSite=Lax',
		`Max-Age=${maxAgeSeconds}`,
	].join('; ')
}

export function clearSessionCookie(): string {
	return [`${SESSION_COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Max-Age=0'].join(
		'; ',
	)
}

export function parseSessionToken(request: Request): string | null {
	const cookieHeader = request.headers.get('cookie')

	if (!cookieHeader) {
		return null
	}

	const cookies = cookieHeader.split(';').map((cookie) => cookie.trim())
	const sessionCookie = cookies.find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`))

	if (!sessionCookie) {
		return null
	}

	return sessionCookie.slice(SESSION_COOKIE_NAME.length + 1) || null
}

function createRandomToken(byteLength: number): string {
	const bytes = new Uint8Array(byteLength)
	crypto.getRandomValues(bytes)

	return encodeBase64Url(bytes)
}

function encode(value: string): Uint8Array {
	return new TextEncoder().encode(value)
}

function encodeBase64Url(bytes: Uint8Array): string {
	let binary = ''

	for (const byte of bytes) {
		binary += String.fromCharCode(byte)
	}

	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(value: string): Uint8Array {
	const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
	const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
	const binary = atob(padded)
	const bytes = new Uint8Array(binary.length)

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index)
	}

	return bytes
}

function timingSafeEqual(left: string, right: string): boolean {
	const leftBytes = decodeBase64Url(left)
	const rightBytes = decodeBase64Url(right)

	if (leftBytes.length !== rightBytes.length) {
		return false
	}

	let diff = 0

	for (let index = 0; index < leftBytes.length; index += 1) {
		diff |= leftBytes[index] ^ rightBytes[index]
	}

	return diff === 0
}
