import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface GalleryLightboxItem {
	key: string
	caption: string | null
}

interface GalleryLightboxProps {
	items: ReadonlyArray<GalleryLightboxItem>
	openIndex: number | null
	onClose: () => void
	fallbackAlt?: string
}

export function GalleryLightbox({
	items,
	openIndex,
	onClose,
	fallbackAlt,
}: GalleryLightboxProps) {
	const [index, setIndex] = useState(0)

	useEffect(() => {
		if (openIndex !== null) setIndex(openIndex)
	}, [openIndex])

	const next = useCallback(() => {
		setIndex((i) => (i + 1) % items.length)
	}, [items.length])

	const prev = useCallback(() => {
		setIndex((i) => (i - 1 + items.length) % items.length)
	}, [items.length])

	useEffect(() => {
		if (openIndex === null) return
		function handleKey(event: KeyboardEvent) {
			if (event.key === 'ArrowRight') {
				event.preventDefault()
				next()
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault()
				prev()
			} else if (event.key === 'Escape') {
				event.preventDefault()
				onClose()
			}
		}
		window.addEventListener('keydown', handleKey)
		return () => window.removeEventListener('keydown', handleKey)
	}, [openIndex, next, prev, onClose])

	useEffect(() => {
		if (openIndex === null) return
		const original = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = original
		}
	}, [openIndex])

	if (openIndex === null) return null
	const item = items[index]
	if (!item) return null

	const hasMany = items.length > 1

	const lightbox = (
		<div
			className="fixed inset-0 z-[100] flex animate-in fade-in flex-col items-center justify-center bg-black/95 px-4 py-6 backdrop-blur-sm duration-200"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
		>
			<button
				type="button"
				onClick={onClose}
				className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
				aria-label="Kapat"
			>
				<XIcon className="size-5" />
			</button>

			<div className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white tabular-nums">
				{index + 1} / {items.length}
			</div>

			{hasMany && (
				<>
					<button
						type="button"
						onClick={(event) => {
							event.stopPropagation()
							prev()
						}}
						className="absolute left-4 top-1/2 z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:flex"
						aria-label="Önceki görsel"
					>
						<ChevronLeftIcon className="size-6" />
					</button>
					<button
						type="button"
						onClick={(event) => {
							event.stopPropagation()
							next()
						}}
						className="absolute right-4 top-1/2 z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:flex"
						aria-label="Sonraki görsel"
					>
						<ChevronRightIcon className="size-6" />
					</button>
				</>
			)}

			<div
				className="flex max-h-[85vh] max-w-5xl items-center justify-center"
				onClick={(event) => event.stopPropagation()}
			>
				<img
					key={item.key}
					src={`/api/media/${item.key}`}
					alt={item.caption ?? fallbackAlt ?? ''}
					className="max-h-[85vh] max-w-full animate-in fade-in zoom-in-95 rounded-md object-contain shadow-2xl duration-300"
				/>
			</div>

			{item.caption && (
				<p
					className="mt-4 max-w-2xl rounded-lg bg-white/10 px-4 py-2 text-center text-sm leading-relaxed text-white"
					onClick={(event) => event.stopPropagation()}
				>
					{item.caption}
				</p>
			)}

			{hasMany && (
				<div
					className="mt-3 flex items-center gap-1.5"
					onClick={(event) => event.stopPropagation()}
				>
					{items.map((it, i) => (
						<button
							key={it.key}
							type="button"
							onClick={() => setIndex(i)}
							className={cn(
								'h-1.5 rounded-full transition-all',
								i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70',
							)}
							aria-label={`Görsel ${i + 1}`}
							aria-current={i === index ? 'true' : undefined}
						/>
					))}
				</div>
			)}

			{hasMany && (
				<div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/50 sm:hidden">
					Yana kaydır
				</div>
			)}
		</div>
	)

	if (typeof document === 'undefined') return null
	return createPortal(lightbox, document.body)
}
