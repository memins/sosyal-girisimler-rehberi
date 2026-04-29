import type { ComponentType, ReactNode, SVGProps } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
	icon?: ComponentType<SVGProps<SVGSVGElement>>
	title: ReactNode
	description?: ReactNode
	action?: ReactNode
	className?: string
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center',
				className,
			)}
		>
			{Icon && (
				<div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
					<Icon className="size-6" aria-hidden="true" />
				</div>
			)}
			<div className="flex flex-col gap-2">
				<h3 className="text-lg font-semibold">{title}</h3>
				{description && (
					<p className="max-w-md text-sm text-muted-foreground">{description}</p>
				)}
			</div>
			{action && <div className="mt-2">{action}</div>}
		</div>
	)
}
