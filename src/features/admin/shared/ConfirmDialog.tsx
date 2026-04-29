import type { ReactNode } from 'react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	title: ReactNode
	description?: ReactNode
	confirmLabel?: string
	cancelLabel?: string
	variant?: 'default' | 'destructive'
	onConfirm: () => void | Promise<void>
	children?: ReactNode
}

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = 'Onayla',
	cancelLabel = 'Vazgeç',
	variant = 'default',
	onConfirm,
	children,
}: ConfirmDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					{description && <AlertDialogDescription>{description}</AlertDialogDescription>}
				</AlertDialogHeader>
				{children}
				<AlertDialogFooter>
					<AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
					<AlertDialogAction
						onClick={(event) => {
							event.preventDefault()
							void Promise.resolve(onConfirm()).then(() => onOpenChange(false))
						}}
						className={cn(
							variant === 'destructive' &&
								'bg-destructive text-white hover:bg-destructive/90',
						)}
					>
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
