import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
	eyebrow?: ReactNode
	title: ReactNode
	description?: ReactNode
	actions?: ReactNode
	breadcrumb?: ReactNode
	align?: 'start' | 'center'
	className?: string
}

export function PageHeader({
	eyebrow,
	title,
	description,
	actions,
	breadcrumb,
	align = 'start',
	className,
}: PageHeaderProps) {
	return (
		<header className={cn('flex flex-col gap-4', className)}>
			{breadcrumb && <div>{breadcrumb}</div>}
			<div
				className={cn(
					'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
					align === 'center' && 'items-center text-center md:flex-col md:items-center',
				)}
			>
				<div className="flex flex-col gap-3">
					{eyebrow && (
						<span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
							{eyebrow}
						</span>
					)}
					<h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
					{description && (
						<p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
							{description}
						</p>
					)}
				</div>
				{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
			</div>
		</header>
	)
}
