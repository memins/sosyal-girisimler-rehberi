import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownIcon, ArrowUpIcon, Loader2Icon, SaveIcon, XIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { ErrorBlock, RouteFallback } from '@/components/StateBlock'
import { PageHeader } from '@/components/layout/page-header'
import { MultiSelect } from '@/features/admin/shared/MultiSelect'
import { listAdminEditorialLists, listAdminEnterprises, saveEditorialList } from '@/lib/api'
import { slugify } from '@/lib/slug'
import type { EditorialList, EnterpriseSummary } from '@/shared/types'

const editorialSchema = z.object({
	id: z.string().optional(),
	title: z.string().trim().min(1, 'Başlık gerekli.'),
	slug: z
		.string()
		.trim()
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, 'Slug sadece küçük harf, sayı ve tire içermeli.'),
	description: z.string().trim().min(1, 'Açıklama gerekli.'),
	status: z.enum(['draft', 'published', 'archived']),
	enterpriseIds: z.array(z.string()).min(1, 'En az bir girişim seçin.'),
})

type EditorialFormValues = z.input<typeof editorialSchema>

interface EditorialFormPageProps {
	mode: 'create' | 'edit'
}

export function EditorialFormPage({ mode }: EditorialFormPageProps) {
	const { id } = useParams()
	const navigate = useNavigate()
	const [enterprises, setEnterprises] = useState<Array<EnterpriseSummary>>([])
	const [list, setList] = useState<EditorialList | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [slugTouched, setSlugTouched] = useState(false)
	const [loading, setLoading] = useState(true)

	const form = useForm<EditorialFormValues>({
		resolver: zodResolver(editorialSchema),
		defaultValues: {
			title: '',
			slug: '',
			description: '',
			status: 'draft',
			enterpriseIds: [],
		},
		mode: 'onBlur',
	})

	useEffect(() => {
		;(async () => {
			try {
				const [enterprisesPayload, lists] = await Promise.all([
					listAdminEnterprises(new URLSearchParams({ pageSize: '60' })),
					mode === 'edit' ? listAdminEditorialLists() : Promise.resolve([] as Array<EditorialList>),
				])
				setEnterprises(enterprisesPayload.items)
				if (mode === 'edit' && id) {
					const found = lists.find((l) => l.id === id)
					if (!found) {
						setError('Liste bulunamadı.')
						return
					}
					setList(found)
					form.reset({
						id: found.id,
						title: found.title,
						slug: found.slug,
						description: found.description,
						status: found.status,
						enterpriseIds: found.items.map((item) => item.id),
					})
					setSlugTouched(true)
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Veriler yüklenemedi.')
			} finally {
				setLoading(false)
			}
		})()
	}, [id, mode, form])

	const watchedTitle = form.watch('title')
	useEffect(() => {
		if (mode === 'create' && !slugTouched && watchedTitle) {
			form.setValue('slug', slugify(watchedTitle))
		}
	}, [watchedTitle, slugTouched, mode, form])

	const enterpriseOptions = useMemo(
		() => enterprises.map((e) => ({ value: e.id, label: e.name, hint: e.slug })),
		[enterprises],
	)

	const watchedIds = form.watch('enterpriseIds')
	const orderedSelected = useMemo(
		() =>
			watchedIds
				.map((id) => enterprises.find((e) => e.id === id))
				.filter((e): e is EnterpriseSummary => Boolean(e)),
		[watchedIds, enterprises],
	)

	function moveItem(index: number, direction: 1 | -1) {
		const next = [...form.getValues('enterpriseIds')]
		const newIndex = index + direction
		if (newIndex < 0 || newIndex >= next.length) return
		const [item] = next.splice(index, 1)
		next.splice(newIndex, 0, item)
		form.setValue('enterpriseIds', next, { shouldDirty: true })
	}

	function removeItem(idToRemove: string) {
		form.setValue(
			'enterpriseIds',
			form.getValues('enterpriseIds').filter((eId) => eId !== idToRemove),
			{ shouldDirty: true },
		)
	}

	async function onSubmit(values: EditorialFormValues) {
		try {
			const parsed = editorialSchema.parse(values)
			await saveEditorialList(parsed)
			toast.success('Editöryel liste kaydedildi.')
			navigate('/admin/editorial-lists')
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Kaydedilemedi.')
		}
	}

	if (loading) return <RouteFallback />
	if (error) return <ErrorBlock message={error} />

	return (
		<div className="flex flex-col gap-8 pb-24">
			<PageHeader
				eyebrow={mode === 'create' ? 'Yeni' : 'Düzenle'}
				title={mode === 'create' ? 'Yeni editöryel liste' : (list?.title ?? '')}
				description="Tematik girişim koleksiyonu oluştur."
				actions={
					<Button asChild variant="outline" size="sm">
						<Link to="/admin/editorial-lists">İptal</Link>
					</Button>
				}
			/>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
					<div className="grid gap-5 md:grid-cols-2">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Başlık</FormLabel>
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
								<FormLabel>Açıklama</FormLabel>
								<FormControl>
									<Textarea rows={3} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="status"
						render={({ field }) => (
							<FormItem className="md:max-w-xs">
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
										<SelectItem value="archived">Arşivde</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Separator />

					<FormField
						control={form.control}
						name="enterpriseIds"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Girişimler</FormLabel>
								<FormControl>
									<MultiSelect
										options={enterpriseOptions}
										value={field.value}
										onChange={field.onChange}
										placeholder="Girişim seç"
										searchPlaceholder="Girişim ara"
									/>
								</FormControl>
								<FormDescription>
									Sıralama önemli — listede görünecek sıraya göre yeniden düzenle.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{orderedSelected.length > 0 && (
						<div className="flex flex-col gap-2 rounded-xl border border-border bg-card/40 p-3">
							{orderedSelected.map((item, index) => (
								<div
									key={item.id}
									className="flex items-center gap-2 rounded-lg border border-border bg-background p-2"
								>
									<Badge variant="secondary" className="text-xs">
										{index + 1}
									</Badge>
									<div className="flex-1 text-sm">{item.name}</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => moveItem(index, -1)}
										disabled={index === 0}
										aria-label="Yukarı taşı"
									>
										<ArrowUpIcon />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => moveItem(index, 1)}
										disabled={index === orderedSelected.length - 1}
										aria-label="Aşağı taşı"
									>
										<ArrowDownIcon />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => removeItem(item.id)}
										aria-label="Kaldır"
									>
										<XIcon />
									</Button>
								</div>
							))}
						</div>
					)}

					<div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border bg-background/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
						<Button asChild variant="ghost" type="button">
							<Link to="/admin/editorial-lists">İptal</Link>
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
