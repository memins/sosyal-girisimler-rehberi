import { zodResolver } from '@hookform/resolvers/zod'
import {
	CheckCircle2Icon,
	CheckIcon,
	ClipboardListIcon,
	Loader2Icon,
	SendIcon,
	UserCheckIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { createSubmission } from '@/lib/api'
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
			})
			setIsSuccess(true)
			toast.success('Öneriniz alındı.')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Öneri gönderilemedi.')
		}
	}

	function handleReset() {
		form.reset(defaultValues)
		setIsSuccess(false)
	}

	if (isSuccess) {
		return (
			<div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-10 text-center">
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
						<Link to="/arama">Rehbere dön</Link>
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
