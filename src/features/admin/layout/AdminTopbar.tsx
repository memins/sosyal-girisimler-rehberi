import {
	createContext,
	useContext,
	useEffect,
	useState,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
} from 'react'
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

// Split the action slot into two contexts so pages that *register* actions
// don't subscribe to the *value* updates and re-render in a loop.
// `setActions` from useState is referentially stable, so consumers of the
// setter context never re-render due to action changes.
const ActionSetterContext = createContext<Dispatch<SetStateAction<ReactNode>> | null>(null)
const ActionValueContext = createContext<ReactNode>(null)

export function AdminTopbarProvider({ children }: { children: ReactNode }) {
	const [actions, setActions] = useState<ReactNode>(null)
	return (
		<ActionSetterContext.Provider value={setActions}>
			<ActionValueContext.Provider value={actions}>{children}</ActionValueContext.Provider>
		</ActionSetterContext.Provider>
	)
}

export function useTopbarActions(actions: ReactNode) {
	const setActions = useContext(ActionSetterContext)
	useEffect(() => {
		if (!setActions) return
		setActions(actions)
		return () => setActions(null)
	}, [actions, setActions])
}

function useTopbarActionsValue(): ReactNode {
	return useContext(ActionValueContext)
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
	const actions = useTopbarActionsValue()
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
			<div className="flex items-center gap-2">{actions}</div>
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
		submissions: { label: 'Yeni öneriler', to: '/admin/submissions' },
		'edit-suggestions': { label: 'Düzenleme önerileri', to: '/admin/edit-suggestions' },
		'editorial-lists': { label: 'Editöryel listeler', to: '/admin/editorial-lists' },
		taxonomy: { label: 'Sınıflandırma', to: '/admin/taxonomy' },
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
