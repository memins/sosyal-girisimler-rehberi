import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getCurrentAdmin } from '@/lib/api'
import type { AdminUser } from '@/shared/types'

const PublicAdminContext = createContext<AdminUser | null>(null)

export function PublicAdminProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AdminUser | null>(null)

	useEffect(() => {
		getCurrentAdmin()
			.then((session) => setUser(session.user))
			.catch(() => setUser(null))
	}, [])

	return <PublicAdminContext.Provider value={user}>{children}</PublicAdminContext.Provider>
}

export function usePublicAdmin(): AdminUser | null {
	return useContext(PublicAdminContext)
}
