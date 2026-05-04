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

interface NavChild {
	to: string
	label: string
	matchSearch?: string
}

interface NavItem {
	to: string
	label: string
	icon: LucideIcon
	end?: boolean
	ownerOnly?: boolean
	children?: ReadonlyArray<NavChild>
}

const NAV_ITEMS: ReadonlyArray<NavItem> = [
	{ to: '/admin', label: 'Panel', icon: LayoutDashboardIcon, end: true },
	{ to: '/admin/enterprises', label: 'Girişimler', icon: Building2Icon },
	{ to: '/admin/submissions', label: 'Yeni öneriler', icon: InboxIcon },
	{
		to: '/admin/edit-suggestions',
		label: 'Düzenleme önerileri',
		icon: MessagesSquareIcon,
	},
	{ to: '/admin/editorial-lists', label: 'Editöryel listeler', icon: HomeIcon },
	{
		to: '/admin/taxonomy',
		label: 'Sınıflandırma',
		icon: TagsIcon,
		children: [
			{
				to: '/admin/taxonomy?tab=categories',
				label: 'Kategoriler',
				matchSearch: 'tab=categories',
			},
			{
				to: '/admin/taxonomy?tab=audiences',
				label: 'Hedef kitle',
				matchSearch: 'tab=audiences',
			},
			{
				to: '/admin/taxonomy?tab=business-models',
				label: 'Kurum türü',
				matchSearch: 'tab=business-models',
			},
		],
	},
	{ to: '/admin/users', label: 'Kullanıcılar', icon: UsersIcon, ownerOnly: true },
]

interface AdminSidebarProps {
	onNavigate?: () => void
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
	const { user, logout } = useAdminSession()
	const initials = user.email.slice(0, 2).toUpperCase()

	return (
		<aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card/40">
			<Link to="/admin" className="group flex items-center gap-2 px-5 py-5">
				<Logomark animated className="size-6" />
				<span className="text-base font-semibold tracking-tight transition-colors group-hover:text-primary">
					Admin paneli
				</span>
			</Link>
			<nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4">
				{NAV_ITEMS.filter((item) => !item.ownerOnly || user.role === 'owner').map((item) =>
					item.children && item.children.length > 0 ? (
						<NavItemWithChildren
							key={item.to}
							item={item}
							onNavigate={onNavigate}
						/>
					) : (
						<NavItemLink key={item.to} item={item} onNavigate={onNavigate} />
					),
				)}
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

function NavItemLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
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

function NavItemWithChildren({
	item,
	onNavigate,
}: {
	item: NavItem
	onNavigate?: () => void
}) {
	const location = useLocation()
	const isOnRoute =
		location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
	const [open, setOpen] = useState(isOnRoute)

	useEffect(() => {
		if (isOnRoute) setOpen(true)
	}, [isOnRoute])

	const search = location.search.replace(/^\?/, '')

	return (
		<div className="flex flex-col gap-0.5">
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				aria-expanded={open}
				className={cn(
					'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
					isOnRoute
						? 'bg-secondary text-foreground'
						: 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
				)}
			>
				<item.icon className="size-4" />
				<span className="flex-1 text-left">{item.label}</span>
				<ChevronRightIcon
					className={cn(
						'size-3.5 shrink-0 transition-transform duration-200',
						open && 'rotate-90',
					)}
				/>
			</button>
			{open && item.children && (
				<div className="ml-4 flex flex-col gap-0.5 border-l border-border pl-3">
					{item.children.map((child, index) => {
						const isActive =
							isOnRoute &&
							(child.matchSearch
								? search === child.matchSearch ||
									(index === 0 && search.length === 0)
								: false)
						return (
							<Link
								key={child.to}
								to={child.to}
								onClick={onNavigate}
								className={cn(
									'rounded-md px-3 py-1.5 text-sm transition',
									isActive
										? 'text-foreground'
										: 'text-muted-foreground hover:text-foreground',
								)}
							>
								{child.label}
							</Link>
						)
					})}
				</div>
			)}
		</div>
	)
}
