import { ImageOffIcon, RefreshCcwIcon, Trash2Icon, UploadCloudIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface MediaUploaderProps {
	value: string | null
	onChange: (key: string | null) => void
	aspectRatio?: '1:1' | '16:9'
	label?: string
	accept?: string
}

export function MediaUploader({
	value,
	onChange,
	aspectRatio = '1:1',
	label = 'Görsel yükle',
	accept = 'image/*',
}: MediaUploaderProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [progress, setProgress] = useState<number | null>(null)
	const [isDragging, setIsDragging] = useState(false)

	function uploadFile(file: File) {
		setProgress(0)
		const xhr = new XMLHttpRequest()
		const body = new FormData()
		body.set('file', file)

		xhr.upload.addEventListener('progress', (event) => {
			if (event.lengthComputable) {
				setProgress(Math.round((event.loaded / event.total) * 100))
			}
		})

		xhr.addEventListener('load', () => {
			setProgress(null)
			if (xhr.status >= 200 && xhr.status < 300) {
				try {
					const response = JSON.parse(xhr.responseText) as { key?: string }
					if (response.key) {
						onChange(response.key)
						toast.success('Görsel yüklendi')
						return
					}
				} catch {
					// fall through
				}
			}
			toast.error('Görsel yüklenemedi')
		})

		xhr.addEventListener('error', () => {
			setProgress(null)
			toast.error('Görsel yüklenemedi')
		})

		xhr.open('POST', '/api/admin/media')
		xhr.withCredentials = true
		xhr.send(body)
	}

	function handleSelect(file: File | null) {
		if (!file) return
		uploadFile(file)
	}

	function handleDrop(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault()
		setIsDragging(false)
		const file = event.dataTransfer.files?.[0]
		if (file) uploadFile(file)
	}

	const isUploading = progress !== null
	const aspectClass = aspectRatio === '16:9' ? 'aspect-video' : 'aspect-square'

	return (
		<div className="flex flex-col gap-3">
			<div
				onDragOver={(event) => {
					event.preventDefault()
					setIsDragging(true)
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={handleDrop}
				className={cn(
					'group relative overflow-hidden rounded-xl border-2 border-dashed border-border bg-card/40 transition',
					isDragging && 'border-primary bg-primary/5',
					aspectClass,
				)}
			>
				{value ? (
					<>
						<img
							src={`/api/media/${value}`}
							alt={label}
							className="size-full object-cover"
							loading="lazy"
						/>
						<div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => inputRef.current?.click()}
							>
								<RefreshCcwIcon />
								Değiştir
							</Button>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => onChange(null)}
							>
								<Trash2Icon />
								Kaldır
							</Button>
						</div>
					</>
				) : (
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground transition hover:bg-secondary/40"
					>
						{isUploading ? (
							<>
								<UploadCloudIcon className="size-6" />
								<span className="text-sm">Yükleniyor… {progress}%</span>
								<Progress value={progress ?? 0} className="w-3/4" />
							</>
						) : (
							<>
								<UploadCloudIcon className="size-6" />
								<span className="text-sm">{label}</span>
								<span className="text-xs">Sürükle bırak veya tıkla</span>
							</>
						)}
					</button>
				)}
				{!value && !isUploading && (
					<ImageOffIcon className="absolute right-3 top-3 size-4 text-muted-foreground/30" />
				)}
				<input
					ref={inputRef}
					type="file"
					accept={accept}
					hidden
					onChange={(event) => handleSelect(event.target.files?.[0] ?? null)}
				/>
			</div>
			{value && (
				<p className="text-xs text-muted-foreground">
					Anahtar: <span className="font-mono">{value}</span>
				</p>
			)}
		</div>
	)
}
