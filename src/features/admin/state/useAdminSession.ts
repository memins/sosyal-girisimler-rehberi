import { createContext, useContext } from 'react'
import type { AdminUser } from '@/shared/types'

interface AdminSessionContextValue {
	user: AdminUser
	refresh: () => Promise<void>
	logout: () => Promise<void>
}

export const AdminSessionContext = createContext<AdminSessionContextValue | null>(null)

export function useAdminSession(): AdminSessionContextValue {
	const ctx = useContext(AdminSessionContext)
	if (!ctx) {
		throw new Error('useAdminSession must be used inside an AdminShell')
	}
	return ctx
}
