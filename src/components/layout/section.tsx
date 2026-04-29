import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type SectionSize = 'tight' | 'default' | 'loose'

interface SectionProps extends ComponentProps<'section'> {
	size?: SectionSize
	bordered?: boolean
}

const sizeMap: Record<SectionSize, string> = {
	tight: 'py-6 md:py-10',
	default: 'py-12 md:py-20',
	loose: 'py-16 md:py-28',
}

export function Section({
	size = 'default',
	bordered = false,
	className,
	...props
}: SectionProps) {
	return (
		<section
			className={cn(sizeMap[size], bordered && 'border-t border-border', className)}
			{...props}
		/>
	)
}
