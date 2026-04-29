import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type ContainerSize = 'narrow' | 'default' | 'wide'

interface ContainerProps extends ComponentProps<'div'> {
	size?: ContainerSize
}

const sizeMap: Record<ContainerSize, string> = {
	narrow: 'max-w-3xl',
	default: 'max-w-7xl',
	wide: 'max-w-screen-2xl',
}

export function Container({ size = 'default', className, ...props }: ContainerProps) {
	return (
		<div
			className={cn('mx-auto w-full px-4 md:px-8', sizeMap[size], className)}
			{...props}
		/>
	)
}
