import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon, SaveIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ErrorBlock, RouteFallback } from '@/components/StateBlock'
import { PageHeader } from '@/components/layout/page-header'
import { MultiSelect } from '@/features/admin/shared/MultiSelect'
import { MediaUploader } from '@/features/admin/shared/MediaUploader'
import {
	enterpriseFormSchema,
	type EnterpriseFormValues,
} from '@/features/admin/schemas/enterprise'
import { getAdminEnterprise, getDirectoryMeta, saveEnterprise } from '@/lib/api'
import { slugify } from '@/lib/slug'
import { cn } from '@/lib/utils'
import type { DirectoryMeta, Enterprise } from '@/shared/types'

interface EnterpriseFormPageProps {
	mode: 'create' | 'edit'
}

const emptyValues: EnterpriseFormValues = {
	name: '',
	slug: '',
	shortDescription: '',
	problem: '',
	solution: '',
	impact: '',
	longContent: '',
	websiteUrl: '',
	instagramUrl: '',
	logoKey: null,
	coverKey: null,
	status: 'draft',
	isFeatured: false,
	categoryIds: [],
	audienceIds: [],
	businessModelIds: [],
	countryCodes: [],
	sdgIds: [],
}

export function EnterpriseFormPage({ mode }: EnterpriseFormPageProps) {
	const { id } = useParams()
	const navigate = useNavigate()
	const [meta, setMeta] = useState<DirectoryMeta | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
	const [slugTouched, setSlugTouched] = useState(false)

	useEffect(() => {
		getDirectoryMeta()
			.then(setMeta)
			.catch((err: Error) => setError(err.message))
	}, [])

	useEffect(() => {
		if (mode !== 'edit' || !id) return
		getAdminEnterprise(id)
			.then(setEnterprise)
			.catch((err: Error) => setError(err.message))
	}, [id, mode])

	const form = useForm<EnterpriseFormValues>({
		resolver: zodResolver(enterpriseFormSchema),
		defaultValues: emptyValues,
		mode: 'onBlur',
	})

	useEffect(() => {
		if (mode === 'edit' && enterprise) {
			form.reset({
				id: enterprise.id,
				name: enterprise.name,
				slug: enterprise.slug,
				shortDescription: enterprise.shortDescription,
				problem: enterprise.problem,
				solution: enterprise.solution,
				impact: enterprise.impact,
				longContent: enterprise.longContent ?? '',
				websiteUrl: enterprise.websiteUrl ?? '',
				instagramUrl: enterprise.instagramUrl ?? '',
				logoKey: enterprise.logoKey,
				coverKey: enterprise.coverKey,
				status: enterprise.status,
				isFeatured: enterprise.isFeatured,
				categoryIds: enterprise.categories.map((c) => c.id),
				audienceIds: enterprise.audiences.map((a) => a.id),
				businessModelIds: enterprise.businessModels.map((m) => m.id),
				countryCodes: enterprise.countries.map((c) => c.code),
				sdgIds: enterprise.sdgs.map((s) => s.id),
			})
			setSlugTouched(true)
		}
	}, [enterprise, form, mode])

	const watchedName = form.watch('name')
	useEffect(() => {
		if (mode === 'create' && !slugTouched && watchedName) {
			form.setValue('slug', slugify(watchedName), { shouldValidate: false })
		}
	}, [watchedName, slugTouched, mode, form])

	const categoryOptions = useMemo(
		() => meta?.categories.map((c) => ({ value: c.id, label: c.name })) ?? [],
		[meta],
	)
	const audienceOptions = useMemo(
		() => meta?.audiences.map((a) => ({ value: a.id, label: a.name })) ?? [],
		[meta],
	)
	const businessModelOptions = useMemo(
		() => meta?.businessModels.map((m) => ({ value: m.id, label: m.name })) ?? [],
		[meta],
	)
	const countryOptions = useMemo(
		() =>
			meta?.countries.map((c) => ({
				value: c.code,
				label: c.name,
				leading: <span aria-hidden="true">{c.flag}</span>,
				hint: c.code,
			})) ?? [],
		[meta],
	)

	if (error) return <ErrorBlock message={error} />
	if (!meta || (mode === 'edit' && !enterprise)) return <RouteFallback />

	async function onSubmit(values: EnterpriseFormValues) {
		try {
			const parsed = enterpriseFormSchema.parse(values)
			await saveEnterprise({
				id: parsed.id,
				name: parsed.name,
				slug: parsed.slug,
				shortDescription: parsed.shortDescription,
				problem: parsed.problem,
				solution: parsed.solution,
				impact: parsed.impact,
				longContent: parsed.longContent || undefined,
				websiteUrl: parsed.websiteUrl,
				instagramUrl: parsed.instagramUrl,
				logoKey: parsed.logoKey ?? undefined,
				coverKey: parsed.coverKey ?? undefined,
				status: parsed.status,
				isFeatured: parsed.isFeatured,
				categoryIds: parsed.categoryIds,
				audienceIds: parsed.audienceIds,
				businessModelIds: parsed.businessModelIds,
				countryCodes: parsed.countryCodes,
				sdgIds: parsed.sdgIds,
			})
			toast.success('Girişim kaydedildi.')
			navigate('/admin/enterprises')
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Kaydedilemedi.')
		}
	}

	return (
		<div className="flex flex-col gap-8 pb-24">
			<PageHeader
				eyebrow={mode === 'create' ? 'Yeni' : 'Düzenle'}
				title={mode === 'create' ? 'Yeni girişim oluştur' : enterprise!.name}
				description={
					mode === 'create'
						? 'Tüm temel bilgileri eksiksiz girmeye çalış. Detaylar sonradan da güncellenebilir.'
						: 'İçeriği güncelle ve değişiklikleri kaydet.'
				}
				actions={
					<Button asChild variant="outline" size="sm">
						<Link to="/admin/enterprises">İptal</Link>
					</Button>
				}
			/>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-10">
					<Section title="Temel bilgiler">
						<div className="grid gap-5 md:grid-cols-2">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Girişim adı</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="slug"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Slug</FormLabel>
										<FormControl>
											<Input
												{...field}
												onChange={(event) => {
													setSlugTouched(true)
													field.onChange(event)
												}}
											/>
										</FormControl>
										<FormDescription>Sadece küçük harf, sayı ve tire.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="shortDescription"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Kısa açıklama</FormLabel>
									<FormControl>
										<Textarea rows={3} {...field} />
									</FormControl>
									<FormDescription>En az 20 karakter.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid gap-5 md:grid-cols-2">
							<FormField
								control={form.control}
								name="websiteUrl"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Web sitesi</FormLabel>
										<FormControl>
											<Input type="url" placeholder="https://" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="instagramUrl"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Instagram</FormLabel>
										<FormControl>
											<Input type="url" placeholder="https://instagram.com/..." {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</Section>

					<Separator />

					<Section title="İçerik">
						<FormField
							control={form.control}
							name="problem"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Gündem (Problem)</FormLabel>
									<FormControl>
										<Textarea rows={4} {...field} />
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
									<FormLabel>Çözüm</FormLabel>
									<FormControl>
										<Textarea rows={4} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="impact"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Sosyal etki</FormLabel>
									<FormControl>
										<Textarea rows={4} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="longContent"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Uzun içerik (opsiyonel)</FormLabel>
									<FormControl>
										<Textarea rows={6} {...field} />
									</FormControl>
									<FormDescription>Detaylı açıklama, hikaye ya da basın metni.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</Section>

					<Separator />

					<Section title="Sınıflandırma">
						<FormField
							control={form.control}
							name="categoryIds"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Kategoriler</FormLabel>
									<FormControl>
										<MultiSelect
											options={categoryOptions}
											value={field.value}
											onChange={field.onChange}
											placeholder="Kategori seç"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid gap-5 md:grid-cols-2">
							<FormField
								control={form.control}
								name="audienceIds"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Hedef kitle</FormLabel>
										<FormControl>
											<MultiSelect
												options={audienceOptions}
												value={field.value}
												onChange={field.onChange}
												placeholder="Hedef kitle seç"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="businessModelIds"
								render={({ field }) => (
									<FormItem>
										<FormLabel>İş modeli</FormLabel>
										<FormControl>
											<MultiSelect
												options={businessModelOptions}
												value={field.value}
												onChange={field.onChange}
												placeholder="İş modeli seç"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="countryCodes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Ülkeler</FormLabel>
									<FormControl>
										<MultiSelect
											options={countryOptions}
											value={field.value}
											onChange={field.onChange}
											placeholder="Ülke seç"
											searchPlaceholder="Ülke ara"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="sdgIds"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Sürdürülebilir Kalkınma Amaçları</FormLabel>
									<FormControl>
										<div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-9">
											{meta!.sdgs.map((sdg) => {
												const selected = field.value.includes(sdg.id)
												return (
													<button
														type="button"
														key={sdg.id}
														onClick={() => {
															if (selected) {
																field.onChange(field.value.filter((v) => v !== sdg.id))
															} else {
																field.onChange([...field.value, sdg.id])
															}
														}}
														title={sdg.name}
														className={cn(
															'group flex aspect-square items-center justify-center rounded-md border text-base font-semibold transition',
															selected
																? 'text-white shadow-sm'
																: 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
														)}
														style={
															selected
																? { background: sdg.color, borderColor: sdg.color }
																: undefined
														}
													>
														{sdg.id}
													</button>
												)
											})}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</Section>

					<Separator />

					<Section title="Medya">
						<div className="grid gap-6 md:grid-cols-2">
							<FormField
								control={form.control}
								name="logoKey"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Logo (1:1)</FormLabel>
										<FormControl>
											<MediaUploader
												value={field.value ?? null}
												onChange={field.onChange}
												aspectRatio="1:1"
												label="Logo yükle"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="coverKey"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Kapak görseli (16:9)</FormLabel>
										<FormControl>
											<MediaUploader
												value={field.value ?? null}
												onChange={field.onChange}
												aspectRatio="16:9"
												label="Kapak yükle"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</Section>

					<Separator />

					<Section title="Yayın">
						<div className="grid gap-5 md:grid-cols-2">
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Durum</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="draft">Taslak</SelectItem>
												<SelectItem value="published">Yayında</SelectItem>
												<SelectItem value="archived">Arşivlenmiş</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="isFeatured"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between rounded-xl border border-border p-4">
										<div className="flex flex-col gap-1">
											<FormLabel>Öne çıkar</FormLabel>
											<FormDescription>
												Anasayfada haftanın girişimleri arasında gösterilir.
											</FormDescription>
										</div>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
					</Section>

					<div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border bg-background/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
						<Button asChild variant="ghost" type="button">
							<Link to="/admin/enterprises">İptal</Link>
						</Button>
						<Button type="submit" disabled={form.formState.isSubmitting}>
							{form.formState.isSubmitting ? (
								<>
									<Loader2Icon className="animate-spin" />
									Kaydediliyor…
								</>
							) : (
								<>
									<SaveIcon />
									Kaydet
								</>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="flex flex-col gap-5">
			<h2 className="text-lg font-semibold tracking-tight">{title}</h2>
			<div className="flex flex-col gap-5">{children}</div>
		</section>
	)
}
