import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface ImgProps extends ComponentProps<'img'> {
	src: string
	alt: string
}

export function Img({ className, loading = 'lazy', decoding = 'async', ...props }: ImgProps) {
	return (
		<img
			loading={loading}
			decoding={decoding}
			className={cn('block', className)}
			{...props}
		/>
	)
}
