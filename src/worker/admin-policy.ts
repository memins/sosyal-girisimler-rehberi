import type { AdminRole, UpdateAdminUserInput } from '@/shared/types'

type AdminRoleHolder = {
	role: AdminRole
}

type ValidationResult =
	| { ok: true }
	| {
			ok: false
			errors: Record<string, string>
	  }

export function canManageAdminUsers(user: AdminRoleHolder): boolean {
	return user.role === 'owner'
}

export function validateAdminUserUpdateInput(input: UpdateAdminUserInput): ValidationResult {
	const errors: Record<string, string> = {}

	if (input.role !== undefined && input.role !== 'owner' && input.role !== 'admin') {
		errors.role = 'Rol owner veya admin olmalı.'
	}

	if (input.password !== undefined && input.password.length > 0 && input.password.length < 10) {
		errors.password = 'Şifre en az 10 karakter olmalı.'
	}

	if (input.isActive !== undefined && typeof input.isActive !== 'boolean') {
		errors.isActive = 'Aktiflik değeri boolean olmalı.'
	}

	return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true }
}
