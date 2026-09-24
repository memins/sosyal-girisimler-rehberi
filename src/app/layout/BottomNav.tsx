import { HomeIcon, InfoIcon, PlusIcon, SearchIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
	{ href: '/', label: 'Ana sayfa', icon: HomeIcon, end: true },
	{ href: '/arama', label: 'Girişimler', icon: SearchIcon, end: false },
	{ href: '/girisim-ekle', label: 'Ekle', icon: PlusIcon, end: false },
	{ href: '/hakkimizda', label: 'Hakkında', icon: InfoIcon, end: false },
]

export function BottomNav() {
	return (
		<nav
			aria-label="Alt menü"
			className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
		>
			<ul className="grid grid-cols-4">
				{tabs.map((tab) => {
					const Icon = tab.icon
					return (
						<li key={tab.href}>
							<NavLink
								to={tab.href}
								end={tab.end}
								className={({ isActive }) =>
									`flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] ${
										isActive ? 'text-primary' : 'text-muted-foreground'
									}`
								}
							>
								<Icon className="size-5" aria-hidden="true" />
								{tab.label}
							</NavLink>
						</li>
					)
				})}
			</ul>
		</nav>
	)
}
