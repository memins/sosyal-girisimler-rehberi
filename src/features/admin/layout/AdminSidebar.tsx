import {
	Building2Icon,
	ChevronRightIcon,
	HomeIcon,
	InboxIcon,
	LayoutDashboardIcon,
	LogOutIcon,
	MessagesSquareIcon,
	TagsIcon,
	UsersIcon,
	type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Logomark } from '@/components/logomark'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAdminSession } from '@/features/admin/state/useAdminSession'
import { cn } from '@/lib/utils'

interface NavItem {
	to: string
	label: string
	icon: LucideIcon
	end?: boolean
	ownerOnly?: boolean
}

interface NavGroup {
	id: string
	label?: string
	items: Array<NavItem>
}

const NAV_GROUPS: ReadonlyArray<NavGroup> = [
	{
		id: 'panel',
		items: [{ to: '/admin', label: 'Panel', icon: LayoutDashboardIcon, end: true }],
	},
	{
		id: 'icerik',
		label: 'İçerik',
		items: [
			{ to: '/admin/enterprises', label: 'Girişimler', icon: Building2Icon },
			{ to: '/admin/editorial-lists', label: 'Editöryel listeler', icon: HomeIcon },
		],
	},
	{
		id: 'topluluk',
		label: 'Topluluk',
		items: [
			{ to: '/admin/submissions', label: 'Yeni öneriler', icon: InboxIcon },
			{
				to: '/admin/edit-suggestions',
				label: 'Düzenleme önerileri',
				icon: MessagesSquareIcon,
			},
		],
	},
	{
		id: 'sistem',
		label: 'Sistem',
		items: [
			{ to: '/admin/taxonomy', label: 'Sınıflandırma', icon: TagsIcon },
			{ to: '/admin/users', label: 'Kullanıcılar', icon: UsersIcon, ownerOnly: true },
		],
	},
]

const STORAGE_KEY = 'sgr-admin-sidebar-groups'

function readStoredExpansion(): Record<string, boolean> {
	if (typeof window === 'undefined') return {}
	try {
		const value = localStorage.getItem(STORAGE_KEY)
		if (value) return JSON.parse(value) as Record<string, boolean>
	} catch {
		// ignore
	}
	return {}
}

interface AdminSidebarProps {
	onNavigate?: () => void
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
	const { user, logout } = useAdminSession()
	const location = useLocation()
	const initials = user.email.slice(0, 2).toUpperCase()

	const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
		const stored = readStoredExpansion()
		const defaults: Record<string, boolean> = {}
		for (const group of NAV_GROUPS) {
			if (group.label) defaults[group.id] = true
		}
		return { ...defaults, ...stored }
	})

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded))
		} catch {
			// ignore quota errors
		}
	}, [expanded])

	// Auto-open the group that contains the active route, but never collapse
	// other groups the user already expanded.
	useEffect(() => {
		const active = NAV_GROUPS.find((group) =>
			group.items.some((item) =>
				item.end
					? location.pathname === item.to
					: location.pathname === item.to ||
						location.pathname.startsWith(`${item.to}/`),
			),
		)
		if (active?.label && !expanded[active.id]) {
			setExpanded((prev) => ({ ...prev, [active.id]: true }))
		}
	}, [location.pathname, expanded])

	function toggleGroup(id: string) {
		setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
	}

	return (
		<aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card/40">
			<Link to="/admin" className="group flex items-center gap-2 px-5 py-5">
				<Logomark animated className="size-6" />
				<span className="text-base font-semibold tracking-tight transition-colors group-hover:text-primary">
					Admin paneli
				</span>
			</Link>
			<nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 pb-4">
				{NAV_GROUPS.map((group) => {
					const visibleItems = group.items.filter(
						(item) => !item.ownerOnly || user.role === 'owner',
					)
					if (visibleItems.length === 0) return null

					if (!group.label) {
						return (
							<div key={group.id} className="flex flex-col gap-0.5">
								{visibleItems.map((item) => (
									<NavItemLink
										key={item.to}
										item={item}
										onNavigate={onNavigate}
									/>
								))}
							</div>
						)
					}

					const isOpen = expanded[group.id] ?? true
					return (
						<div key={group.id} className="flex flex-col gap-0.5">
							<button
								type="button"
								onClick={() => toggleGroup(group.id)}
								className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/70 uppercase transition hover:text-foreground"
								aria-expanded={isOpen}
							>
								<ChevronRightIcon
									className={cn(
										'size-3 transition-transform duration-200',
										isOpen && 'rotate-90',
									)}
								/>
								{group.label}
							</button>
							{isOpen && (
								<div className="flex flex-col gap-0.5">
									{visibleItems.map((item) => (
										<NavItemLink
											key={item.to}
											item={item}
											onNavigate={onNavigate}
										/>
									))}
								</div>
							)}
						</div>
					)
				})}
			</nav>
			<div className="flex items-center gap-2 border-t border-border px-3 py-3">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="flex-1 justify-start gap-2 px-2">
							<Avatar className="size-7">
								<AvatarFallback className="text-xs">{initials}</AvatarFallback>
							</Avatar>
							<div className="flex flex-col items-start text-xs">
								<span className="font-medium text-foreground">{user.email}</span>
								<span className="text-[10px] tracking-wider text-muted-foreground uppercase">
									{user.role}
								</span>
							</div>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuLabel>Hesap</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link to="/">Siteye dön</Link>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={logout}>
							<LogOutIcon className="size-4" />
							Çıkış yap
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<ThemeToggle />
			</div>
		</aside>
	)
}

function NavItemLink({
	item,
	onNavigate,
}: {
	item: NavItem
	onNavigate?: () => void
}) {
	return (
		<NavLink
			to={item.to}
			end={item.end}
			onClick={onNavigate}
			className={({ isActive }) =>
				cn(
					'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
					isActive
						? 'bg-secondary text-foreground'
						: 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
				)
			}
		>
			<item.icon className="size-4" />
			{item.label}
		</NavLink>
	)
}
