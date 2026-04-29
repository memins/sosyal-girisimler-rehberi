import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PagerProps {
	page: number
	pageSize: number
	total: number
	onPageChange: (page: number) => void
	className?: string
}

export function Pager({ page, pageSize, total, onPageChange, className }: PagerProps) {
	const totalPages = Math.max(1, Math.ceil(total / pageSize))
	if (totalPages <= 1) return null

	const pages = computePageNumbers(page, totalPages)

	return (
		<nav
			className={cn('flex items-center justify-center gap-1', className)}
			aria-label="Sayfalama"
		>
			<Button
				variant="ghost"
				size="icon"
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				aria-label="Önceki sayfa"
			>
				<ChevronLeftIcon />
			</Button>
			{pages.map((entry, index) =>
				entry === 'gap' ? (
					<span
						key={`gap-${index}`}
						className="px-2 text-sm text-muted-foreground"
						aria-hidden="true"
					>
						…
					</span>
				) : (
					<Button
						key={entry}
						variant={entry === page ? 'default' : 'ghost'}
						size="sm"
						onClick={() => onPageChange(entry)}
						aria-current={entry === page ? 'page' : undefined}
						className="min-w-9"
					>
						{entry}
					</Button>
				),
			)}
			<Button
				variant="ghost"
				size="icon"
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
				aria-label="Sonraki sayfa"
			>
				<ChevronRightIcon />
			</Button>
		</nav>
	)
}

function computePageNumbers(current: number, total: number): Array<number | 'gap'> {
	if (total <= 7) {
		return Array.from({ length: total }, (_, i) => i + 1)
	}

	const pages: Array<number | 'gap'> = [1]
	const left = Math.max(2, current - 1)
	const right = Math.min(total - 1, current + 1)
	if (left > 2) pages.push('gap')
	for (let i = left; i <= right; i++) pages.push(i)
	if (right < total - 1) pages.push('gap')
	pages.push(total)
	return pages
}
