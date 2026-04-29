import {
	Building2Icon,
	HomeIcon,
	InboxIcon,
	LayoutDashboardIcon,
	LogOutIcon,
	TagsIcon,
	UsersIcon,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
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

const NAV_ITEMS = [
	{ to: '/admin', label: 'Panel', icon: LayoutDashboardIcon, end: true },
	{ to: '/admin/enterprises', label: 'Girişimler', icon: Building2Icon },
	{ to: '/admin/submissions', label: 'Öneriler', icon: InboxIcon },
	{ to: '/admin/editorial-lists', label: 'Editöryel listeler', icon: HomeIcon },
	{ to: '/admin/taxonomy', label: 'Sınıflandırma', icon: TagsIcon },
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
			<Link
				to="/admin"
				className="group flex items-center gap-2 px-5 py-5"
			>
				<Logomark animated className="size-6" />
				<span className="text-base font-semibold tracking-tight transition-colors group-hover:text-primary">
					Admin paneli
				</span>
			</Link>
			<nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
				{NAV_ITEMS.filter((item) => !item.ownerOnly || user.role === 'owner').map((item) => (
					<NavLink
						key={item.to}
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
				))}
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
								<span className="text-[10px] uppercase tracking-wider text-muted-foreground">
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
