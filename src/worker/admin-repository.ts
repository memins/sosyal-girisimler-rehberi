import type {
	AdminLoginInput,
	AdminRole,
	AdminUser,
	BootstrapOwnerInput,
	CreateAdminUserInput,
	CurrentAdmin,
	UpdateAdminUserInput,
} from '@/shared/types'
import {
	createSessionToken,
	hashPassword,
	hashSessionToken,
	parseSessionToken,
	verifyPassword,
} from './auth'

export const FIRST_OWNER_EMAIL = 'm.emins@yahoo.com'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

type AdminUserRow = {
	id: string
	email: string
	password_hash: string
	password_salt: string
	role: AdminRole
	is_active: number
	created_at: string
	updated_at: string
}

type CountRow = {
	count: number
}

type AdminSessionRow = AdminUserRow & {
	session_id: string
	expires_at: string
}

export async function needsBootstrap(db: D1Database): Promise<boolean> {
	const row = await db.prepare('SELECT COUNT(*) as count FROM admin_users').first<CountRow>()

	return (row?.count ?? 0) === 0
}

export async function bootstrapOwner(
	db: D1Database,
	input: BootstrapOwnerInput,
): Promise<AdminUser> {
	if (!(await needsBootstrap(db))) {
		throw new Error('Admin kurulumu zaten tamamlanmış.')
	}

	if (normalizeEmail(input.email) !== FIRST_OWNER_EMAIL) {
		throw new Error('İlk owner hesabı sadece belirlenen e-posta ile oluşturulabilir.')
	}

	return createAdminUser(db, {
		email: FIRST_OWNER_EMAIL,
		password: input.password,
		role: 'owner',
	})
}

export async function createAdminUser(
	db: D1Database,
	input: CreateAdminUserInput,
	actorUserId?: string,
): Promise<AdminUser> {
	const id = crypto.randomUUID()
	const password = await hashPassword(input.password)
	await db
		.prepare(
			`INSERT INTO admin_users (
				id,
				email,
				password_hash,
				password_salt,
				role
			) VALUES (?, ?, ?, ?, ?)`,
		)
		.bind(id, normalizeEmail(input.email), password.hash, password.salt, input.role)
		.run()

	if (actorUserId) {
		await writeAuditLog(db, actorUserId, 'admin_user.create', id)
	}

	const user = await getAdminUserById(db, id)

	if (!user) {
		throw new Error('Admin kullanıcısı oluşturulduktan sonra bulunamadı.')
	}

	return user
}

export async function authenticateAdmin(
	db: D1Database,
	input: AdminLoginInput,
): Promise<AdminUser | null> {
	const row = await getAdminUserRowByEmail(db, input.email)

	if (!row || row.is_active !== 1) {
		return null
	}

	const isValid = await verifyPassword(input.password, {
		hash: row.password_hash,
		salt: row.password_salt,
	})

	return isValid ? mapAdminUserRow(row) : null
}

export async function createAdminSession(
	db: D1Database,
	userId: string,
): Promise<{ token: string; expiresAt: string }> {
	const token = createSessionToken()
	const tokenHash = await hashSessionToken(token)
	const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString()

	await db
		.prepare(
			'INSERT INTO admin_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
		)
		.bind(crypto.randomUUID(), userId, tokenHash, expiresAt)
		.run()

	return { token, expiresAt }
}

export async function getCurrentAdmin(
	db: D1Database,
	request: Request,
): Promise<CurrentAdmin | null> {
	const token = parseSessionToken(request)

	if (!token) {
		return null
	}

	const tokenHash = await hashSessionToken(token)
	const row = await db
		.prepare(
			`SELECT
				admin_users.*,
				admin_sessions.id as session_id,
				admin_sessions.expires_at as expires_at
			FROM admin_sessions
			INNER JOIN admin_users ON admin_users.id = admin_sessions.user_id
			WHERE admin_sessions.token_hash = ?
				AND admin_sessions.expires_at > ?
				AND admin_users.is_active = 1
			LIMIT 1`,
		)
		.bind(tokenHash, new Date().toISOString())
		.first<AdminSessionRow>()

	if (!row) {
		return null
	}

	return {
		user: mapAdminUserRow(row),
	}
}

export async function deleteAdminSession(db: D1Database, request: Request): Promise<void> {
	const token = parseSessionToken(request)

	if (!token) {
		return
	}

	const tokenHash = await hashSessionToken(token)
	await db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(tokenHash).run()
}

export async function listAdminUsers(db: D1Database): Promise<Array<AdminUser>> {
	const rows = await db
		.prepare('SELECT * FROM admin_users ORDER BY role DESC, email ASC')
		.all<AdminUserRow>()

	return rows.results.map(mapAdminUserRow)
}

export async function updateAdminUser(
	db: D1Database,
	userId: string,
	input: UpdateAdminUserInput,
	actorUserId: string,
): Promise<AdminUser> {
	const current = await getAdminUserById(db, userId)

	if (!current) {
		throw new Error('Admin kullanıcısı bulunamadı.')
	}

	if (actorUserId === userId && input.isActive === false) {
		throw new Error('Kendi admin hesabınızı pasifleştiremezsiniz.')
	}

	if (current.role === 'owner' && (input.role === 'admin' || input.isActive === false)) {
		await ensureAnotherActiveOwner(db, userId)
	}

	const updates: Array<string> = []
	const params: Array<string | number> = []

	if (input.role) {
		updates.push('role = ?')
		params.push(input.role)
	}

	if (typeof input.isActive === 'boolean') {
		updates.push('is_active = ?')
		params.push(input.isActive ? 1 : 0)
	}

	if (input.password && input.password.length > 0) {
		const password = await hashPassword(input.password)
		updates.push('password_hash = ?', 'password_salt = ?')
		params.push(password.hash, password.salt)
	}

	if (updates.length > 0) {
		await db
			.prepare(`UPDATE admin_users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
			.bind(...params, userId)
			.run()
		await writeAuditLog(db, actorUserId, 'admin_user.update', userId)
	}

	const updated = await getAdminUserById(db, userId)

	if (!updated) {
		throw new Error('Admin kullanıcısı güncellendikten sonra bulunamadı.')
	}

	return updated
}

async function ensureAnotherActiveOwner(db: D1Database, userId: string): Promise<void> {
	const row = await db
		.prepare(
			'SELECT COUNT(*) as count FROM admin_users WHERE role = ? AND is_active = 1 AND id != ?',
		)
		.bind('owner', userId)
		.first<CountRow>()

	if ((row?.count ?? 0) === 0) {
		throw new Error('Son aktif owner hesabı pasifleştirilemez veya admin rolüne düşürülemez.')
	}
}

async function getAdminUserById(db: D1Database, id: string): Promise<AdminUser | null> {
	const row = await db.prepare('SELECT * FROM admin_users WHERE id = ? LIMIT 1').bind(id).first<AdminUserRow>()

	return row ? mapAdminUserRow(row) : null
}

async function getAdminUserRowByEmail(db: D1Database, email: string): Promise<AdminUserRow | null> {
	return db
		.prepare('SELECT * FROM admin_users WHERE email = ? LIMIT 1')
		.bind(normalizeEmail(email))
		.first<AdminUserRow>()
}

async function writeAuditLog(
	db: D1Database,
	actorUserId: string,
	action: string,
	targetUserId: string,
): Promise<void> {
	await db
		.prepare(
			'INSERT INTO admin_audit_log (id, actor_user_id, action, target_user_id) VALUES (?, ?, ?, ?)',
		)
		.bind(crypto.randomUUID(), actorUserId, action, targetUserId)
		.run()
}

function mapAdminUserRow(row: AdminUserRow): AdminUser {
	return {
		id: row.id,
		email: row.email,
		role: row.role,
		isActive: row.is_active === 1,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	}
}

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase()
}
