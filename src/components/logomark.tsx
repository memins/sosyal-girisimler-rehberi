import { cn } from '@/lib/utils'

interface LogomarkProps {
	className?: string
	animated?: boolean
}

/**
 * Sosyal Girişimler Rehberi marka simgesi.
 * Merkez nokta + üç concentric halka — sosyal etkinin yayılması metaforu.
 * `animated` aktifse `.group:hover` ile yumuşak bir genişleme animasyonu uygulanır.
 */
export function Logomark({ className, animated = false }: LogomarkProps) {
	return (
		<svg
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			className={cn('size-7 shrink-0 text-primary', className)}
		>
			<g className="origin-center">
				<circle
					cx="16"
					cy="16"
					r="13.5"
					stroke="currentColor"
					strokeWidth="1"
					strokeOpacity="0.18"
					className={cn(
						'origin-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
						animated &&
							'group-hover:scale-[1.06] group-hover:[stroke-opacity:0.32]',
					)}
					style={{ transformOrigin: '16px 16px' }}
				/>
				<circle
					cx="16"
					cy="16"
					r="9"
					stroke="currentColor"
					strokeWidth="1.2"
					strokeOpacity="0.4"
					className={cn(
						'origin-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75',
						animated &&
							'group-hover:scale-[1.08] group-hover:[stroke-opacity:0.6]',
					)}
					style={{ transformOrigin: '16px 16px' }}
				/>
				<circle
					cx="16"
					cy="16"
					r="4.5"
					fill="currentColor"
					className={cn(
						'origin-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
						animated && 'group-hover:scale-110',
					)}
					style={{ transformOrigin: '16px 16px' }}
				/>
			</g>
		</svg>
	)
}
