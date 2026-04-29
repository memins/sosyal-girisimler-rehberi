import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

type ErrorBlockProps = {
	title?: string
	message: string
}

export function LoadingGrid() {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: 6 }).map((_, index) => (
				<Skeleton key={index} className="h-72 rounded-xl" />
			))}
		</div>
	)
}

export function ErrorBlock({ title = 'Bir şey ters gitti', message }: ErrorBlockProps) {
	return (
		<Alert variant="destructive">
			<AlertTitle>{title}</AlertTitle>
			<AlertDescription>{message}</AlertDescription>
		</Alert>
	)
}

export function RouteFallback() {
	return (
		<div className="space-y-12">
			<div className="space-y-4">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-12 w-full max-w-xl" />
				<Skeleton className="h-6 w-full max-w-md" />
			</div>
			<LoadingGrid />
		</div>
	)
}
