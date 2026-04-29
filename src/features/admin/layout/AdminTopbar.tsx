import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MenuIcon } from 'lucide-react'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'

interface ActionSlotContextValue {
	actions: ReactNode
	setActions: (node: ReactNode) => void
}

const ActionSlotContext = createContext<ActionSlotContextValue | null>(null)

export function AdminTopbarProvider({ children }: { children: ReactNode }) {
	const [actions, setActions] = useState<ReactNode>(null)
	return (
		<ActionSlotContext.Provider value={{ actions, setActions }}>
			{children}
		</ActionSlotContext.Provider>
	)
}

export function useTopbarActions(actions: ReactNode) {
	const ctx = useContext(ActionSlotContext)
	useEffect(() => {
		ctx?.setActions(actions)
		return () => ctx?.setActions(null)
	}, [actions, ctx])
}

interface AdminTopbarProps {
	onOpenSidebar: () => void
}

interface Crumb {
	label: string
	to?: string
}

export function AdminTopbar({ onOpenSidebar }: AdminTopbarProps) {
	const location = useLocation()
	const ctx = useContext(ActionSlotContext)
	const crumbs = buildCrumbs(location.pathname)

	return (
		<header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:px-8">
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					onClick={onOpenSidebar}
					aria-label="Menüyü aç"
					className="md:hidden"
				>
					<MenuIcon />
				</Button>
				{crumbs.length > 0 && (
					<Breadcrumb>
						<BreadcrumbList>
							{crumbs.map((crumb, index) => {
								const isLast = index === crumbs.length - 1
								return (
									<BreadcrumbItem key={`${crumb.label}-${index}`}>
										{isLast || !crumb.to ? (
											<BreadcrumbPage>{crumb.label}</BreadcrumbPage>
										) : (
											<>
												<BreadcrumbLink asChild>
													<Link to={crumb.to}>{crumb.label}</Link>
												</BreadcrumbLink>
												<BreadcrumbSeparator />
											</>
										)}
									</BreadcrumbItem>
								)
							})}
						</BreadcrumbList>
					</Breadcrumb>
				)}
			</div>
			<div className="flex items-center gap-2">{ctx?.actions}</div>
		</header>
	)
}

function buildCrumbs(pathname: string): Array<Crumb> {
	if (pathname === '/admin' || pathname === '/admin/') {
		return [{ label: 'Panel' }]
	}

	const segments = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean)
	if (segments.length === 0) return [{ label: 'Panel' }]

	const root: Record<string, { label: string; to: string }> = {
		enterprises: { label: 'Girişimler', to: '/admin/enterprises' },
		submissions: { label: 'Öneriler', to: '/admin/submissions' },
		'editorial-lists': { label: 'Editöryel listeler', to: '/admin/editorial-lists' },
		users: { label: 'Kullanıcılar', to: '/admin/users' },
		media: { label: 'Medya', to: '/admin/media' },
	}

	const [first, second, third] = segments
	const rootEntry = root[first]
	if (!rootEntry) return [{ label: 'Panel' }]

	const crumbs: Array<Crumb> = [{ label: rootEntry.label, to: rootEntry.to }]

	if (second === 'new') {
		crumbs.push({ label: 'Yeni' })
	} else if (third === 'edit') {
		crumbs.push({ label: 'Düzenle' })
	}

	return crumbs
}
