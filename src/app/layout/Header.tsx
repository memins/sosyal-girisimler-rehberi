import { MenuIcon } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import { Container } from '@/components/layout/container'
import { Logomark } from '@/components/logomark'

const navigation = [
	{ href: '/', label: 'Ana sayfa' },
	{ href: '/arama', label: 'Girişimler' },
	{ href: '/hakkimizda', label: 'Hakkımızda' },
]

export function Header() {
	const location = useLocation()
	const showAdminLink = location.pathname.startsWith('/admin')

	return (
		<header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
			<Container className="flex items-center justify-between gap-4 py-3.5">
				<Link
					to="/"
					aria-label="Sosyal Girişimler Rehberi — ana sayfa"
					className="group flex items-center gap-2.5 rounded-md leading-none"
				>
					<Logomark animated className="size-7" />
					<div className="flex flex-col gap-0.5">
						<span className="text-[15px] font-semibold leading-none tracking-tight transition-colors group-hover:text-primary">
							Sosyal Girişimler
						</span>
						<span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
							Rehberi
						</span>
					</div>
				</Link>
				{/* NavLink etkin bağlantıya otomatik olarak aria-current="page" ekler. */}
				<nav aria-label="Ana menü" className="hidden items-center gap-1 md:flex">
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
						<nav aria-label="Mobil menü" className="mt-6 flex flex-col gap-1 px-4">
							{navigation.map((item) => (
								<SheetClose key={item.href} asChild>
									<Button asChild variant="ghost" className="justify-start aria-[current=page]:bg-secondary">
										<NavLink to={item.href} end={item.href === '/'}>
											{item.label}
										</NavLink>
									</Button>
								</SheetClose>
							))}
							<SheetClose asChild>
								<Button asChild className="mt-2 justify-start">
									<NavLink to="/girisim-ekle">Girişim ekle</NavLink>
								</Button>
							</SheetClose>
							{showAdminLink && (
								<SheetClose asChild>
									<Button asChild variant="outline" className="mt-1 justify-start">
										<Link to="/admin">Admin</Link>
									</Button>
								</SheetClose>
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
