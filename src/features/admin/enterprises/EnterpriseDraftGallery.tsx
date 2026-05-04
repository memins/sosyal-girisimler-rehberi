import {
	ArrowDownIcon,
	ArrowUpIcon,
	ImageIcon,
	Loader2Icon,
	Trash2Icon,
	UploadCloudIcon,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import type { DraftGalleryItem } from '@/shared/types'
import { cn } from '@/lib/utils'

interface EnterpriseDraftGalleryProps {
	value: ReadonlyArray<DraftGalleryItem>
	onChange: (next: Array<DraftGalleryItem>) => void
}

/**
 * Gallery editor used while creating a new enterprise — operates entirely in
 * form state until the enterprise is persisted. Files are uploaded to R2
 * immediately so previews work, but the {key, caption} list is only written
 * to the DB when the enterprise upsert request runs.
 */
export function EnterpriseDraftGallery({ value, onChange }: EnterpriseDraftGalleryProps) {
	const [isDragging, setIsDragging] = useState(false)
	const [uploadProgress, setUploadProgress] = useState<{ name: string; percent: number } | null>(
		null,
	)
	const inputRef = useRef<HTMLInputElement>(null)
	const items = value ?? []

	function uploadFile(file: File): Promise<{ key: string }> {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest()
			const body = new FormData()
			body.set('file', file)
			xhr.upload.addEventListener('progress', (event) => {
				if (event.lengthComputable) {
					setUploadProgress({
						name: file.name,
						percent: Math.round((event.loaded / event.total) * 100),
					})
				}
			})
			xhr.addEventListener('load', () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					try {
						const response = JSON.parse(xhr.responseText) as { key?: string }
						if (response.key) {
							resolve({ key: response.key })
							return
						}
					} catch {
						// fall through
					}
				}
				reject(new Error('Yükleme başarısız'))
			})
			xhr.addEventListener('error', () => reject(new Error('Yükleme başarısız')))
			xhr.open('POST', '/api/admin/media')
			xhr.withCredentials = true
			xhr.send(body)
		})
	}

	async function handleFiles(files: FileList | null) {
		if (!files || files.length === 0) return
		const next: Array<DraftGalleryItem> = [...items]
		for (const file of Array.from(files)) {
			try {
				const { key } = await uploadFile(file)
				next.push({ key, caption: null })
			} catch (error) {
				toast.error(error instanceof Error ? error.message : 'Yüklenemedi.')
			}
		}
		setUploadProgress(null)
		onChange(next)
		toast.success('Görsel(ler) eklendi — kaydet bastığında galeriye işlenir.')
	}

	function updateCaption(index: number, caption: string) {
		const next = [...items]
		next[index] = { ...next[index], caption }
		onChange(next)
	}

	function removeItem(index: number) {
		const next = items.filter((_, i) => i !== index)
		onChange(next)
	}

	function moveItem(index: number, direction: 1 | -1) {
		const newIndex = index + direction
		if (newIndex < 0 || newIndex >= items.length) return
		const next = [...items]
		const [moved] = next.splice(index, 1)
		next.splice(newIndex, 0, moved)
		onChange(next)
	}

	function onDrop(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault()
		setIsDragging(false)
		void handleFiles(event.dataTransfer.files)
	}

	const isUploading = uploadProgress !== null

	return (
		<div className="flex flex-col gap-4">
			<div
				onDragOver={(event) => {
					event.preventDefault()
					setIsDragging(true)
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={onDrop}
				className={cn(
					'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/40 px-6 py-8 text-center transition',
					isDragging && 'border-primary bg-primary/5',
				)}
			>
				<UploadCloudIcon className="size-6 text-muted-foreground" />
				<p className="text-sm text-muted-foreground">
					Çoklu seçim için sürükle bırak veya butona tıkla
				</p>
				<Button
					type="button"
					onClick={() => inputRef.current?.click()}
					variant="outline"
					size="sm"
					disabled={isUploading}
				>
					{isUploading ? <Loader2Icon className="animate-spin" /> : <UploadCloudIcon />}
					Görsel ekle
				</Button>
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					multiple
					hidden
					onChange={(event) => {
						void handleFiles(event.target.files)
						if (inputRef.current) inputRef.current.value = ''
					}}
				/>
				{uploadProgress && (
					<div className="mt-2 flex w-full max-w-sm flex-col gap-1.5">
						<span className="text-xs text-muted-foreground">
							{uploadProgress.name} · {uploadProgress.percent}%
						</span>
						<Progress value={uploadProgress.percent} />
					</div>
				)}
			</div>

			{items.length === 0 ? (
				<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card/40 px-6 py-8 text-center text-sm text-muted-foreground">
					<ImageIcon className="size-5" />
					Henüz görsel yok. Yukarıdan ekle.
				</div>
			) : (
				<ul className="grid gap-3 sm:grid-cols-2">
					{items.map((item, index) => (
						<li
							key={item.key}
							className="flex gap-3 rounded-xl border border-border bg-card p-3"
						>
							<div className="size-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
								<img
									src={`/api/media/${item.key}`}
									alt={item.caption ?? ''}
									className="size-full object-cover"
									loading="lazy"
								/>
							</div>
							<div className="flex flex-1 flex-col gap-2">
								<Input
									value={item.caption ?? ''}
									onChange={(event) => updateCaption(index, event.target.value)}
									placeholder="Açıklama (opsiyonel)"
									className="h-8 text-sm"
								/>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => moveItem(index, -1)}
											disabled={index === 0}
											aria-label="Yukarı taşı"
											className="size-7"
										>
											<ArrowUpIcon className="size-3.5" />
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => moveItem(index, 1)}
											disabled={index === items.length - 1}
											aria-label="Aşağı taşı"
											className="size-7"
										>
											<ArrowDownIcon className="size-3.5" />
										</Button>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => removeItem(index)}
										aria-label="Görseli kaldır"
										className="size-7 text-destructive hover:text-destructive"
									>
										<Trash2Icon className="size-3.5" />
									</Button>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
