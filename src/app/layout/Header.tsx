import { MenuIcon } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import { Container } from '@/components/layout/container'

const navigation = [
	{ href: '/', label: 'Ana sayfa' },
	{ href: '/arama', label: 'Rehber' },
	{ href: '/hakkimizda', label: 'Hakkımızda' },
]

export function Header() {
	const location = useLocation()
	const showAdminLink = location.pathname.startsWith('/admin')

	return (
		<header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
			<Container className="flex items-center justify-between gap-4 py-3.5">
				<Link to="/" className="flex items-center gap-2 leading-none">
					<span
						className="size-2.5 rounded-full bg-primary shadow-[0_0_0_3px_oklch(from_var(--primary)_l_c_h_/_0.18)]"
						aria-hidden="true"
					/>
					<span className="text-base font-semibold tracking-tight">Sosyal Girişimler</span>
				</Link>
				<nav className="hidden items-center gap-1 md:flex">
					{navigation.map((item) => (
						<NavLink
							key={item.href}
							to={item.href}
							end={item.href === '/'}
							className={({ isActive }) =>
								`rounded-full px-3.5 py-1.5 text-sm transition ${
									isActive
										? 'bg-secondary text-foreground'
										: 'text-muted-foreground hover:text-foreground'
								}`
							}
						>
							{item.label}
						</NavLink>
					))}
				</nav>
				<div className="hidden items-center gap-2 md:flex">
					<ThemeToggle />
					<Button asChild>
						<Link to="/girisim-ekle">Girişim ekle</Link>
					</Button>
					{showAdminLink && (
						<Button asChild variant="outline">
							<Link to="/admin">Admin</Link>
						</Button>
					)}
				</div>
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
						<nav className="mt-6 flex flex-col gap-1 px-4">
							{navigation.map((item) => (
								<Button
									key={item.href}
									asChild
									variant="ghost"
									className="justify-start"
								>
									<Link to={item.href}>{item.label}</Link>
								</Button>
							))}
							<Button asChild className="mt-2 justify-start">
								<Link to="/girisim-ekle">Girişim ekle</Link>
							</Button>
							{showAdminLink && (
								<Button asChild variant="outline" className="mt-1 justify-start">
									<Link to="/admin">Admin</Link>
								</Button>
							)}
						</nav>
						<div className="mt-6 flex items-center justify-between border-t border-border px-4 pt-4">
							<span className="text-sm text-muted-foreground">Tema</span>
							<ThemeToggle />
						</div>
					</SheetContent>
				</Sheet>
			</Container>
		</header>
	)
}
