import { describe, expect, it } from 'vitest'
import { canManageAdminUsers, validateAdminUserUpdateInput } from './admin-policy'

describe('canManageAdminUsers', () => {
	it('allows only owner users to manage admin accounts', () => {
		expect(canManageAdminUsers({ role: 'owner' })).toBe(true)
		expect(canManageAdminUsers({ role: 'admin' })).toBe(false)
	})
})

describe('validateAdminUserUpdateInput', () => {
	it('accepts safe partial updates', () => {
		expect(validateAdminUserUpdateInput({ role: 'admin', isActive: false, password: 'new-password-123' })).toEqual({
			ok: true,
		})
	})

	it('rejects invalid roles and weak passwords', () => {
		expect(validateAdminUserUpdateInput({ role: 'superadmin' as never, password: 'short' })).toEqual({
			ok: false,
			errors: {
				role: 'Rol owner veya admin olmalı.',
				password: 'Şifre en az 10 karakter olmalı.',
			},
		})
	})
})
