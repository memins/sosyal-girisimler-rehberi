import { CopyIcon, ImageIcon, UploadCloudIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import { ErrorBlock, RouteFallback } from '@/components/StateBlock'
import { EmptyState } from '@/components/layout/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { listAdminMedia, uploadMedia } from '@/lib/api'
import type { AdminMediaObject } from '@/shared/types'
import { cn } from '@/lib/utils'

export function MediaLibraryPage() {
	const [items, setItems] = useState<Array<AdminMediaObject> | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [selected, setSelected] = useState<AdminMediaObject | null>(null)
	const [isDragging, setIsDragging] = useState(false)
	const [uploading, setUploading] = useState<{ name: string } | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	async function loadMedia() {
		try {
			const list = await listAdminMedia()
			list.sort(
				(a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime(),
			)
			setItems(list)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Yüklenemedi.')
		}
	}

	useEffect(() => {
		void loadMedia()
	}, [])

	async function handleUpload(file: File) {
		setUploading({ name: file.name })
		try {
			await uploadMedia(file)
			toast.success('Görsel yüklendi')
			await loadMedia()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Yüklenemedi.')
		} finally {
			setUploading(null)
		}
	}

	function handleDrop(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault()
		setIsDragging(false)
		const file = event.dataTransfer.files?.[0]
		if (file) void handleUpload(file)
	}

	function copyKey(key: string) {
		void navigator.clipboard.writeText(key).then(() => toast.success('Anahtar kopyalandı'))
	}

	if (error) return <ErrorBlock message={error} />
	if (!items) return <RouteFallback />

	return (
		<div className="flex flex-col gap-8">
			<PageHeader
				eyebrow="Yönetim"
				title="Medya kütüphanesi"
				description="R2 üzerinde yüklenmiş tüm görseller burada listelenir."
			/>

			<div
				onDragOver={(event) => {
					event.preventDefault()
					setIsDragging(true)
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={handleDrop}
				className={cn(
					'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/40 px-6 py-10 text-center transition',
					isDragging && 'border-primary bg-primary/5',
				)}
			>
				<UploadCloudIcon className="size-8 text-muted-foreground" />
				<p className="text-sm text-muted-foreground">
					Görseli sürükle bırak veya seçmek için butona tıkla
				</p>
				<Button onClick={() => inputRef.current?.click()} variant="outline" size="sm">
					Dosya seç
				</Button>
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					hidden
					onChange={(event) => {
						const file = event.target.files?.[0]
						if (file) void handleUpload(file)
					}}
				/>
				{uploading && (
					<div className="flex w-full max-w-sm flex-col gap-1.5 pt-2">
						<span className="text-xs text-muted-foreground">{uploading.name}</span>
						<Progress value={70} />
					</div>
				)}
			</div>

			{items.length === 0 ? (
				<EmptyState
					icon={ImageIcon}
					title="Henüz medya yok"
					description="Yukarıdan ilk görseli yükleyerek başlayabilirsin."
				/>
			) : (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{items.map((item) => (
						<button
							key={item.key}
							type="button"
							onClick={() => setSelected(item)}
							className="group flex aspect-square overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-sm"
						>
							{item.contentType?.startsWith('image/') ? (
								<img
									src={`/api/media/${item.key}`}
									alt={item.key}
									className="size-full object-cover transition group-hover:scale-105"
									loading="lazy"
								/>
							) : (
								<div className="flex size-full items-center justify-center text-xs text-muted-foreground">
									{item.contentType ?? 'dosya'}
								</div>
							)}
						</button>
					))}
				</div>
			)}

			<Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
				<SheetContent side="right" className="w-full max-w-md">
					{selected && (
						<>
							<SheetHeader>
								<SheetTitle className="break-all">{selected.key}</SheetTitle>
								<SheetDescription>
									{(selected.size / 1024).toFixed(1)} KB ·{' '}
									{new Date(selected.uploaded).toLocaleString('tr-TR')}
								</SheetDescription>
							</SheetHeader>
							<div className="flex flex-col gap-4 px-4 py-4">
								<div className="overflow-hidden rounded-xl border border-border bg-card">
									{selected.contentType?.startsWith('image/') ? (
										<img
											src={`/api/media/${selected.key}`}
											alt={selected.key}
											className="size-full object-contain"
										/>
									) : (
										<div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
											Önizleme yok
										</div>
									)}
								</div>
							</div>
							<SheetFooter className="border-t border-border p-4">
								<Button onClick={() => copyKey(selected.key)} variant="outline">
									<CopyIcon />
									Anahtarı kopyala
								</Button>
							</SheetFooter>
						</>
					)}
				</SheetContent>
			</Sheet>
		</div>
	)
}
