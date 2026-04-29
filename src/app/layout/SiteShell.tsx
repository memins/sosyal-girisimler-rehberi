import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Container } from '@/components/layout/container'
import { RouteFallback } from '@/components/StateBlock'
import { Footer } from './Footer'
import { Header } from './Header'

export function SiteShell() {
	const location = useLocation()
	return (
		<>
			<div className="flex min-h-screen flex-col bg-background">
				<Header />
				<main className="flex-1">
					<Container className="py-10 md:py-16">
						<Suspense key={location.pathname} fallback={<RouteFallback />}>
							<Outlet />
						</Suspense>
					</Container>
				</main>
				<Footer />
			</div>
			<Toaster richColors position="top-right" />
		</>
	)
}
