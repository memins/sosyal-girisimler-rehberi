import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Toaster } from '@/components/ui/sonner'
import { RouteFallback } from '@/components/StateBlock'
import { getCurrentAdmin, logoutAdmin } from '@/lib/api'
import type { AdminUser } from '@/shared/types'
import { AdminSessionContext } from '@/features/admin/state/useAdminSession'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopbar, AdminTopbarProvider } from './AdminTopbar'

type SessionState =
	| { status: 'loading' }
	| { status: 'authenticated'; user: AdminUser }
	| { status: 'unauthenticated' }

export function AdminShell() {
	const navigate = useNavigate()
	const location = useLocation()
	const [state, setState] = useState<SessionState>({ status: 'loading' })
	const [mobileOpen, setMobileOpen] = useState(false)

	const refresh = useCallback(async () => {
		try {
			const current = await getCurrentAdmin()
			setState({ status: 'authenticated', user: current.user })
		} catch {
			setState({ status: 'unauthenticated' })
		}
	}, [])

	useEffect(() => {
		void refresh()
	}, [refresh])

	useEffect(() => {
		setMobileOpen(false)
	}, [location.pathname])

	const logout = useCallback(async () => {
		try {
			await logoutAdmin()
			toast.success('Çıkış yapıldı.')
		} catch {
			// ignore
		}
		setState({ status: 'unauthenticated' })
		navigate('/admin/login', { replace: true })
	}, [navigate])

	const sessionValue = useMemo(() => {
		if (state.status !== 'authenticated') return null
		return { user: state.user, refresh, logout }
	}, [logout, refresh, state])

	if (state.status === 'loading') {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<RouteFallback />
			</div>
		)
	}

	if (state.status === 'unauthenticated' || !sessionValue) {
		return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
	}

	return (
		<AdminSessionContext.Provider value={sessionValue}>
			<AdminTopbarProvider>
				<div className="flex min-h-screen bg-background">
					<div className="sticky top-0 hidden h-screen self-start md:block">
						<AdminSidebar />
					</div>
					<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
						<SheetContent side="left" className="w-72 p-0">
							<SheetHeader className="sr-only">
								<SheetTitle>Admin menüsü</SheetTitle>
							</SheetHeader>
							<AdminSidebar onNavigate={() => setMobileOpen(false)} />
						</SheetContent>
					</Sheet>
					<div className="flex min-h-screen flex-1 flex-col">
						<AdminTopbar onOpenSidebar={() => setMobileOpen(true)} />
						<main className="flex-1 px-4 py-8 md:px-8 md:py-10">
							<Suspense key={location.pathname} fallback={<RouteFallback />}>
								<Outlet />
							</Suspense>
						</main>
					</div>
				</div>
			</AdminTopbarProvider>
			<Toaster richColors position="top-right" />
		</AdminSessionContext.Provider>
	)
}
