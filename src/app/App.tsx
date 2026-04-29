import { MenuIcon } from 'lucide-react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { AboutPage } from './AboutPage'
import { EnterpriseDetailPage } from './EnterpriseDetailPage'
import { HomePage } from './HomePage'
import { SearchPage } from './SearchPage'
import { SubmissionPage } from './SubmissionPage'
import { AdminPage } from '@/features/admin/AdminPage'

const navigation = [
	{ href: '/', label: 'Ana sayfa' },
	{ href: '/arama', label: 'Arama' },
	{ href: '/girisim-ekle', label: 'Girişim ekle' },
	{ href: '/hakkimizda', label: 'Hakkımızda' },
]

export function App() {
	return (
		<>
			<div className="min-h-screen bg-background">
				<header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
					<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
						<Link to="/" className="flex flex-col leading-none">
							<span className="text-lg font-semibold">Sosyal Girişimler</span>
							<span className="text-xs text-muted-foreground">Rehberi</span>
						</Link>
						<nav className="hidden items-center gap-1 md:flex">
							{navigation.map((item) => (
								<NavLink
									key={item.href}
									to={item.href}
									className={({ isActive }) =>
										`rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`
									}
								>
									{item.label}
								</NavLink>
							))}
							<Button asChild variant="outline">
								<Link to="/admin">Admin</Link>
							</Button>
						</nav>
						<Sheet>
							<SheetTrigger asChild>
								<Button variant="outline" size="icon" className="md:hidden" aria-label="Menüyü aç">
									<MenuIcon />
								</Button>
							</SheetTrigger>
							<SheetContent>
								<SheetHeader>
									<SheetTitle>Menü</SheetTitle>
								</SheetHeader>
								<nav className="mt-8 flex flex-col gap-2">
									{navigation.map((item) => (
										<Button key={item.href} asChild variant="ghost" className="justify-start">
											<Link to={item.href}>{item.label}</Link>
										</Button>
									))}
									<Button asChild variant="outline" className="justify-start">
										<Link to="/admin">Admin</Link>
									</Button>
								</nav>
							</SheetContent>
						</Sheet>
					</div>
				</header>
				<main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/arama" element={<SearchPage />} />
						<Route path="/girisimler/:slug" element={<EnterpriseDetailPage />} />
						<Route path="/girisim-ekle" element={<SubmissionPage />} />
						<Route path="/hakkimizda" element={<AboutPage />} />
						<Route path="/admin" element={<AdminPage />} />
					</Routes>
				</main>
			</div>
			<Toaster richColors position="top-right" />
		</>
	)
}
