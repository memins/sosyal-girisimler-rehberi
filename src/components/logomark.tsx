import { cn } from '@/lib/utils'

interface LogomarkProps {
	className?: string
	animated?: boolean
}

/**
 * Sosyal Girişimler Rehberi marka simgesi.
 *
 * Konsept: filiz (sprout). Toprağa atılmış bir tohum, ondan yükselen sap ve
 * yana açılan iki yaprak — sosyal girişimciliğin "ekme, büyütme, etki yayma"
 * temasıyla doğrudan örtüşür.
 *
 * `animated` aktifse `.group:hover` ile yapraklar yana açılır,
 * tohum hafif büyür — yorucu olmayan, tek seferlik bir karşılama animasyonu.
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
			{/* Tohum / temel */}
			<circle
				cx="16"
				cy="25.5"
				r="2.4"
				fill="currentColor"
				className={cn(
					'origin-[16px_25.5px] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
					animated && 'group-hover:scale-110',
				)}
			/>
			{/* Sap */}
			<path
				d="M16 23.5 C 16 19 16 15.5 16 13"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
			/>
			{/* Sağ yaprak (öne çıkan) */}
			<path
				d="M 16 14 C 16 9.5 19 5.5 25 6.5 C 24 11.5 20.5 15 16 14 Z"
				fill="currentColor"
				className={cn(
					'origin-[16px_14px] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
					animated && 'group-hover:rotate-[8deg]',
				)}
			/>
			{/* Sol yaprak (yardımcı) */}
			<path
				d="M 16 16.5 C 16 13 13 9.5 7.5 10.5 C 8.5 14.5 12.5 17.5 16 16.5 Z"
				fill="currentColor"
				fillOpacity="0.55"
				className={cn(
					'origin-[16px_16.5px] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75',
					animated && 'group-hover:rotate-[-8deg]',
				)}
			/>
		</svg>
	)
}
