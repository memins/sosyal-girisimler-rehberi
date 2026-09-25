import { zodResolver } from '@hookform/resolvers/zod'
import {
	CheckCircle2Icon,
	CheckIcon,
	ClipboardListIcon,
	ImageIcon,
	Loader2Icon,
	SendIcon,
	UserCheckIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { createSubmission, uploadSubmissionImage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/layout/page-header'
import { useDocumentTitle } from '@/lib/a11y'

const optionalUrl = z
	.string()
	.trim()
	.optional()
	.transform((value) => (value && value.length > 0 ? value : undefined))
	.refine(
		(value) => {
			if (!value) return true
			try {
				const url = new URL(value)
				return url.protocol === 'http:' || url.protocol === 'https:'
			} catch {
				return false
			}
		},
		{ message: 'URL http veya https ile başlamalı.' },
	)

const submissionSchema = z.object({
	name: z.string().trim().min(1, 'Girişim adı gerekli.'),
	contactEmail: z.string().trim().email('Geçerli bir e-posta adresi girin.'),
	websiteUrl: optionalUrl,
	description: z
		.string()
		.trim()
		.min(20, 'Kısa açıklama en az 20 karakter olmalı.'),
	problem: z.string().trim().optional(),
	solution: z.string().trim().optional(),
	acceptsTerms: z
		.boolean()
		.refine((value) => value === true, {
			message: 'Yayın koşullarını onaylamanız gerekiyor.',
		}),
})

type SubmissionFormValues = z.input<typeof submissionSchema>

const defaultValues: SubmissionFormValues = {
	name: '',
	contactEmail: '',
	websiteUrl: '',
	description: '',
	problem: '',
	solution: '',
	acceptsTerms: false,
}

export function SubmissionPage() {
	const [isSuccess, setIsSuccess] = useState(false)
	const [imageKey, setImageKey] = useState<string | null>(null)
	const [imageError, setImageError] = useState<string | null>(null)
	const [isUploadingImage, setIsUploadingImage] = useState(false)
	useDocumentTitle(isSuccess ? 'Önerin alındı' : 'Girişim ekle')

	const form = useForm<SubmissionFormValues>({
		resolver: zodResolver(submissionSchema),
		defaultValues,
		mode: 'onBlur',
	})

	async function onSubmit(values: SubmissionFormValues) {
		try {
			const parsed = submissionSchema.parse(values)
			await createSubmission({
				name: parsed.name,
				description: parsed.description,
				contactEmail: parsed.contactEmail,
				websiteUrl: parsed.websiteUrl,
				problem: parsed.problem || undefined,
				solution: parsed.solution || undefined,
				imageKey: imageKey ?? undefined,
			})
			setIsSuccess(true)
			toast.success('Öneriniz alındı.')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Öneri gönderilemedi.')
		}
	}

	function handleReset() {
		form.reset(defaultValues)
		setImageKey(null)
		setImageError(null)
		setIsSuccess(false)
	}

	async function handleImageSelect(file: File | null) {
		if (!file) return
		setIsUploadingImage(true)
		setImageError(null)
		try {
			const uploaded = await uploadSubmissionImage(file)
			setImageKey(uploaded.key)
		} catch (error) {
			setImageKey(null)
			setImageError(error instanceof Error ? error.message : 'Görsel yüklenemedi.')
		} finally {
			setIsUploadingImage(false)
		}
	}

	if (isSuccess) {
		return (
			<div
				role="status"
				className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-10 text-center"
			>
				<span className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
					<CheckCircle2Icon className="size-8" />
				</span>
				<div className="space-y-3">
					<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
						Teşekkürler
					</p>
					<h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
						Önerin alındı
					</h1>
					<p className="text-base leading-relaxed text-muted-foreground">
						Editör ekibi yaklaşık 7 gün içinde inceleyip rehbere ekleyecek. Eklendiğinde
						bildirilmesini istediğin bir e-posta varsa formu kontrol etmeyi unutma.
					</p>
				</div>
				<div className="flex flex-wrap justify-center gap-2">
					<Button onClick={handleReset}>Başka bir girişim öner</Button>
					<Button asChild variant="outline">
						<Link to="/arama">Girişimlere dön</Link>
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-10">
			<PageHeader
				eyebrow="Girişim ekle"
				title="Rehbere yeni bir sosyal girişim öner"
				description="Önerin önce editör paneline düşer. Doğrulandıktan sonra rehberde yayınlanır."
			/>

			<ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<Step icon={SendIcon} label="1. Sen önerirsin" />
				<Step icon={UserCheckIcon} label="2. Editör inceler" />
				<Step icon={ClipboardListIcon} label="3. Yayına alınır" />
			</ol>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-6"
					noValidate
				>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Girişim adı <RequiredMark />
								</FormLabel>
								<FormControl>
									<Input placeholder="Fazla" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid gap-6 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="contactEmail"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										İletişim e-postası <RequiredMark />
									</FormLabel>
									<FormControl>
										<Input type="email" placeholder="editor@example.com" {...field} />
									</FormControl>
									<FormDescription>Sadece editör ekibimiz görür.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="websiteUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Web sitesi</FormLabel>
									<FormControl>
										<Input type="url" placeholder="https://..." {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<label htmlFor="submission-image" className="text-sm font-medium">
							Görsel
						</label>
						{imageKey ? (
							<div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
								<img
									src={`/api/media/${imageKey}`}
									alt="Yüklenen girişim görseli"
									className="size-16 rounded-lg object-cover"
								/>
								<div className="flex flex-col gap-1">
									<p className="text-sm">Görsel eklendi</p>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setImageKey(null)}
									>
										Kaldır
									</Button>
								</div>
							</div>
						) : null}
						{/* Gizli dosya girdisi etiketten önce gelir; odaklanınca etiket peer-focus-visible ile halka gösterir. */}
						<input
							id="submission-image"
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
							className="peer sr-only"
							disabled={isUploadingImage}
							aria-describedby={imageError ? 'submission-image-error' : undefined}
							onChange={(event) => {
								void handleImageSelect(event.target.files?.[0] ?? null)
								event.target.value = ''
							}}
						/>
						{imageKey ? null : (
							<label
								htmlFor="submission-image"
								aria-busy={isUploadingImage}
								className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:bg-secondary/40"
							>
								{isUploadingImage ? (
									<Loader2Icon className="size-5 animate-spin" />
								) : (
									<ImageIcon className="size-5" />
								)}
								<span>{isUploadingImage ? 'Yükleniyor…' : 'Logo veya kapak görseli yükle'}</span>
								<span className="text-xs">JPEG, PNG, WebP, GIF veya AVIF · en fazla 5 MB</span>
							</label>
						)}
						{imageError && (
							<p id="submission-image-error" role="alert" className="text-sm text-destructive">
								{imageError}
							</p>
						)}
					</div>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Kısa açıklama <RequiredMark />
								</FormLabel>
								<FormControl>
									<Textarea rows={4} {...field} />
								</FormControl>
								<FormDescription>En az 20 karakter.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="problem"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Hangi yarayı sarıyor?</FormLabel>
								<FormControl>
									<Textarea rows={3} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="solution"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Bunu nasıl yapıyor?</FormLabel>
								<FormControl>
									<Textarea rows={3} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="acceptsTerms"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start gap-3 rounded-xl border border-border bg-card/40 p-4">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={(checked) => field.onChange(checked === true)}
									/>
								</FormControl>
								<div className="flex flex-col gap-1">
									<FormLabel className="cursor-pointer font-normal leading-relaxed">
										Bilgilerin kamuya açık bir rehberde yayınlanmasını onaylıyorum.{' '}
										<Link
											to="/kosullar"
											className="text-primary underline-offset-4 hover:underline"
										>
											Koşullar
										</Link>
										.
									</FormLabel>
									<FormMessage />
								</div>
							</FormItem>
						)}
					/>

					<div className="flex justify-end">
						<Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
							{form.formState.isSubmitting ? (
								<>
									<Loader2Icon className="animate-spin" />
									Gönderiliyor…
								</>
							) : (
								<>
									<CheckIcon />
									Öneriyi gönder
								</>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	)
}

function RequiredMark() {
	return (
		<span aria-hidden="true" className="text-destructive">
			*
		</span>
	)
}

function Step({ icon: Icon, label }: { icon: typeof SendIcon; label: string }) {
	return (
		<li className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
			<span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
				<Icon className="size-4" />
			</span>
			<span className="text-sm font-medium">{label}</span>
		</li>
	)
}
