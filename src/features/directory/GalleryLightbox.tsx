import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getFocusable } from '@/lib/a11y'
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

/** Siyah zemin üzerinde yeşil `--ring` zayıf kalır; lightbox beyaz halka kullanır. */
const FOCUS_RING =
	'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

/** Parmakla kaydırmanın gezinme sayılması için gereken yatay mesafe (px). */
const SWIPE_THRESHOLD = 40

export function GalleryLightbox({
	items,
	openIndex,
	onClose,
	fallbackAlt,
}: GalleryLightboxProps) {
	const [index, setIndex] = useState(0)
	const dialogRef = useRef<HTMLDivElement>(null)
	const closeButtonRef = useRef<HTMLButtonElement>(null)
	const touchStartX = useRef<number | null>(null)

	useEffect(() => {
		if (openIndex !== null) setIndex(openIndex)
	}, [openIndex])

	const next = useCallback(() => {
		setIndex((i) => (i + 1) % items.length)
	}, [items.length])

	const prev = useCallback(() => {
		setIndex((i) => (i - 1 + items.length) % items.length)
	}, [items.length])

	// Açılınca odağı kapat butonuna al, kapanınca açan öğeye geri ver.
	useEffect(() => {
		if (openIndex === null) return
		const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
		closeButtonRef.current?.focus()
		return () => {
			if (opener?.isConnected) opener.focus()
		}
	}, [openIndex])

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
			} else if (event.key === 'Tab' && dialogRef.current) {
				// Odak tuzağı: Tab/Shift+Tab lightbox dışına çıkmaz.
				const focusable = getFocusable(dialogRef.current)
				if (focusable.length === 0) return
				const first = focusable[0]
				const last = focusable[focusable.length - 1]
				const active = document.activeElement
				if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
					event.preventDefault()
					last.focus()
				} else if (!event.shiftKey && (active === last || !dialogRef.current.contains(active))) {
					event.preventDefault()
					first.focus()
				}
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
	const alt = item.caption ?? fallbackAlt ?? ''

	const lightbox = (
		<div
			ref={dialogRef}
			className="fixed inset-0 z-[100] flex animate-in fade-in flex-col items-center justify-center bg-black/95 px-4 py-6 backdrop-blur-sm duration-200"
			onClick={onClose}
			onTouchStart={(event) => {
				touchStartX.current = event.touches[0]?.clientX ?? null
			}}
			onTouchEnd={(event) => {
				const start = touchStartX.current
				touchStartX.current = null
				const end = event.changedTouches[0]?.clientX
				if (!hasMany || start === null || end === undefined) return
				const delta = end - start
				if (Math.abs(delta) < SWIPE_THRESHOLD) return
				if (delta < 0) next()
				else prev()
			}}
			role="dialog"
			aria-modal="true"
			aria-label={fallbackAlt ? `${fallbackAlt} galerisi` : 'Galeri'}
			aria-roledescription="galeri"
		>
			<button
				ref={closeButtonRef}
				type="button"
				onClick={onClose}
				className={cn(
					'absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20',
					FOCUS_RING,
				)}
				aria-label="Galeriyi kapat"
			>
				<XIcon className="size-5" />
			</button>

			<div
				className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white tabular-nums"
				aria-live="polite"
				aria-atomic="true"
			>
				<span className="sr-only">Görsel </span>
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
						className={cn(
							'absolute left-4 top-1/2 z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:flex',
							FOCUS_RING,
						)}
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
						className={cn(
							'absolute right-4 top-1/2 z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:flex',
							FOCUS_RING,
						)}
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
					alt={alt}
					decoding="async"
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
								FOCUS_RING,
								i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70',
							)}
							aria-label={`Görsel ${i + 1} / ${items.length}`}
							aria-current={i === index ? 'true' : undefined}
						/>
					))}
				</div>
			)}

			{hasMany && (
				<div
					className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/70 sm:hidden"
					aria-hidden="true"
				>
					Yana kaydır
				</div>
			)}
		</div>
	)

	if (typeof document === 'undefined') return null
	return createPortal(lightbox, document.body)
}
