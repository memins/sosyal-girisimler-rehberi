import { Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Container } from '@/components/layout/container'
import { RouteFallback } from '@/components/StateBlock'
import { PublicAdminProvider } from '@/features/admin/state/usePublicAdmin'
import { BottomNav } from './BottomNav'
import { Footer } from './Footer'
import { Header } from './Header'

export function SiteShell() {
	const location = useLocation()
	const mainRef = useRef<HTMLElement>(null)
	const isFirstRender = useRef(true)

	// Sayfa değişince odağı içeriğe taşı; klavye ve ekran okuyucu kullanıcıları
	// menüyü baştan dolaşmak zorunda kalmaz. İlk yüklemede tarayıcıya bırakılır.
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}
		mainRef.current?.focus({ preventScroll: true })
	}, [location.pathname])

	return (
		<PublicAdminProvider>
			<a
				href="#main-content"
				onClick={(event) => {
					event.preventDefault()
					mainRef.current?.focus()
					mainRef.current?.scrollIntoView({ block: 'start' })
				}}
				className="sr-only z-[60] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
			>
				İçeriğe geç
			</a>
			<div className="flex min-h-screen flex-col bg-background pb-16 md:pb-0">
				<Header />
				<main id="main-content" ref={mainRef} tabIndex={-1} className="flex-1 scroll-mt-20">
					<Container className="py-10 md:py-16">
						<Suspense key={location.pathname} fallback={<RouteFallback />}>
							<Outlet />
						</Suspense>
					</Container>
				</main>
				<Footer />
				<BottomNav />
			</div>
			<Toaster richColors position="top-right" />
		</PublicAdminProvider>
	)
}
