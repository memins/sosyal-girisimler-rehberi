import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Link, useMatches } from 'react-router-dom'
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

interface CrumbHandle {
	crumb?: string | ((params: Record<string, string | undefined>) => string)
}

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

export function AdminTopbar({ onOpenSidebar }: AdminTopbarProps) {
	const matches = useMatches()
	const ctx = useContext(ActionSlotContext)

	const crumbs = matches
		.map((match) => {
			const handle = match.handle as CrumbHandle | undefined
			if (!handle?.crumb) return null
			const label =
				typeof handle.crumb === 'function'
					? handle.crumb(match.params as Record<string, string | undefined>)
					: handle.crumb
			return { pathname: match.pathname, label }
		})
		.filter((c): c is { pathname: string; label: string } => c !== null)

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
									<BreadcrumbItem key={crumb.pathname}>
										{isLast ? (
											<BreadcrumbPage>{crumb.label}</BreadcrumbPage>
										) : (
											<>
												<BreadcrumbLink asChild>
													<Link to={crumb.pathname}>{crumb.label}</Link>
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
