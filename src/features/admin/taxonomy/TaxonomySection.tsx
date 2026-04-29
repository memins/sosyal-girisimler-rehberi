import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
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
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { ErrorBlock } from '@/components/StateBlock'
import { EmptyState } from '@/components/layout/empty-state'
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import {
	createAdminTaxonomy,
	deleteAdminTaxonomy,
	listAdminTaxonomy,
	updateAdminTaxonomy,
} from '@/lib/api'
import { slugify } from '@/lib/slug'
import { TaxonomyIcon } from '@/lib/taxonomy-icon'
import type { TaxonomyItemAdmin, TaxonomyType } from '@/shared/types'

const slugSchema = z
	.string()
	.trim()
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, 'Sadece küçük harf, sayı ve tire içermeli.')

const formSchema = z.object({
	id: slugSchema,
	name: z.string().trim().min(1, 'İsim gerekli.'),
	icon: z.string().optional(),
	sortOrder: z.coerce.number().int().min(0).optional(),
})

type FormValues = z.input<typeof formSchema>

interface TaxonomySectionProps {
	type: TaxonomyType
	label: string
	description: string
	hasIcon: boolean
}

export function TaxonomySection({ type, label, description, hasIcon }: TaxonomySectionProps) {
	const [items, setItems] = useState<Array<TaxonomyItemAdmin> | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [sheetOpen, setSheetOpen] = useState(false)
	const [editing, setEditing] = useState<TaxonomyItemAdmin | null>(null)
	const [confirmDelete, setConfirmDelete] = useState<TaxonomyItemAdmin | null>(null)
	const [slugTouched, setSlugTouched] = useState(false)

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { id: '', name: '', icon: '', sortOrder: undefined },
	})

	async function loadItems() {
		try {
			setItems(await listAdminTaxonomy(type))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Yüklenemedi.')
		}
	}

	useEffect(() => {
		void loadItems()
	}, [type])

	function openCreate() {
		setEditing(null)
		setSlugTouched(false)
		form.reset({ id: '', name: '', icon: '', sortOrder: undefined })
		setSheetOpen(true)
	}

	function openEdit(item: TaxonomyItemAdmin) {
		setEditing(item)
		setSlugTouched(true)
		form.reset({
			id: item.id,
			name: item.name,
			icon: item.icon ?? '',
			sortOrder: item.sortOrder,
		})
		setSheetOpen(true)
	}

	const watchedName = form.watch('name')
	useEffect(() => {
		if (!editing && !slugTouched && watchedName) {
			form.setValue('id', slugify(watchedName))
		}
	}, [watchedName, slugTouched, editing, form])

	async function onSubmit(values: FormValues) {
		try {
			if (editing) {
				await updateAdminTaxonomy(type, editing.id, {
					name: values.name,
					icon: hasIcon ? values.icon || null : undefined,
					sortOrder: typeof values.sortOrder === 'number' ? values.sortOrder : undefined,
				})
				toast.success('Güncellendi.')
			} else {
				await createAdminTaxonomy(type, {
					id: values.id,
					name: values.name,
					icon: hasIcon ? values.icon || null : null,
					sortOrder:
						typeof values.sortOrder === 'number' && !Number.isNaN(values.sortOrder)
							? values.sortOrder
							: undefined,
				})
				toast.success('Oluşturuldu.')
			}
			setSheetOpen(false)
			await loadItems()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Kaydedilemedi.')
		}
	}

	async function handleDelete() {
		if (!confirmDelete) return
		try {
			await deleteAdminTaxonomy(type, confirmDelete.id)
			toast.success('Silindi.')
			setConfirmDelete(null)
			await loadItems()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Silinemedi.')
		}
	}

	if (error) return <ErrorBlock message={error} />

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
				<p className="text-sm text-muted-foreground">{description}</p>
				<Button onClick={openCreate} size="sm">
					<PlusIcon />
					Yeni {label.toLocaleLowerCase('tr')}
				</Button>
			</div>

			{items === null ? (
				<p className="text-sm text-muted-foreground">Yükleniyor…</p>
			) : items.length === 0 ? (
				<EmptyState
					title={`Henüz ${label.toLocaleLowerCase('tr')} yok`}
					description="İlk öğeyi ekleyerek başla."
					action={<Button onClick={openCreate}>Ekle</Button>}
				/>
			) : (
				<div className="overflow-hidden rounded-xl border border-border">
					<Table>
						<TableHeader>
							<TableRow>
								{hasIcon && <TableHead className="w-12" />}
								<TableHead>İsim</TableHead>
								<TableHead className="hidden md:table-cell">Kimlik</TableHead>
								<TableHead className="w-24 text-center">Sıra</TableHead>
								<TableHead className="w-32 text-center">Kullanım</TableHead>
								<TableHead className="w-24 text-right" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => (
								<TableRow key={item.id}>
									{hasIcon && (
										<TableCell>
											<span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
												<TaxonomyIcon name={item.icon} className="size-4" />
											</span>
										</TableCell>
									)}
									<TableCell className="font-medium">{item.name}</TableCell>
									<TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
										{item.id}
									</TableCell>
									<TableCell className="text-center text-sm text-muted-foreground">
										{item.sortOrder}
									</TableCell>
									<TableCell className="text-center">
										<Badge variant={item.usageCount > 0 ? 'secondary' : 'outline'}>
											{item.usageCount} girişim
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-1">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => openEdit(item)}
												aria-label="Düzenle"
												className="size-8"
											>
												<PencilIcon className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setConfirmDelete(item)}
												aria-label="Sil"
												className="size-8 text-destructive hover:text-destructive"
												disabled={item.usageCount > 0}
												title={
													item.usageCount > 0
														? 'Kullanımda olduğu için silinemez'
														: 'Sil'
												}
											>
												<Trash2Icon className="size-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent side="right" className="w-full max-w-md">
					<SheetHeader>
						<SheetTitle>
							{editing ? 'Düzenle' : `Yeni ${label.toLocaleLowerCase('tr')}`}
						</SheetTitle>
						<SheetDescription>
							{editing
								? 'Bilgileri güncelle. Kimlik (id) sabit kalır.'
								: 'Aşağıdaki bilgileri doldurarak yeni öğe oluştur.'}
						</SheetDescription>
					</SheetHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 py-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>İsim</FormLabel>
										<FormControl>
											<Input {...field} autoFocus />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Kimlik (id)</FormLabel>
										<FormControl>
											<Input
												{...field}
												disabled={!!editing}
												onChange={(event) => {
													setSlugTouched(true)
													field.onChange(event)
												}}
											/>
										</FormControl>
										<FormDescription>
											URL ve filtrelemede kullanılır. Sadece küçük harf, sayı, tire.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							{hasIcon && (
								<FormField
									control={form.control}
									name="icon"
									render={({ field }) => (
										<FormItem>
											<FormLabel>İkon</FormLabel>
											<div className="flex items-center gap-2">
												<span className="flex size-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
													<TaxonomyIcon name={field.value || null} className="size-4" />
												</span>
												<FormControl>
													<Input
														{...field}
														placeholder="briefcase-business"
														className="flex-1"
													/>
												</FormControl>
											</div>
											<FormDescription>
												lucide.dev'deki ikon adı (kebab-case). Boş bırakılırsa varsayılan
												kullanılır.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
							<FormField
								control={form.control}
								name="sortOrder"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sıra</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												name={field.name}
												onBlur={field.onBlur}
												ref={field.ref}
												value={field.value === undefined ? '' : String(field.value)}
												onChange={(event) => {
													const v = event.target.value
													field.onChange(v === '' ? undefined : Number(v))
												}}
											/>
										</FormControl>
										<FormDescription>
											Listede daha önce gözükmesi için küçük sayı kullan. Boş bırakılırsa
											sona eklenir.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<SheetFooter className="gap-2 sm:flex-row">
								<Button type="submit" disabled={form.formState.isSubmitting}>
									{form.formState.isSubmitting && <Loader2Icon className="animate-spin" />}
									{editing ? 'Güncelle' : 'Oluştur'}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>

			<ConfirmDialog
				open={!!confirmDelete}
				onOpenChange={(open) => !open && setConfirmDelete(null)}
				title={`${confirmDelete?.name ?? ''} silinsin mi?`}
				description="Bu işlem geri alınamaz. Kullanımdaki öğeler silinemez."
				confirmLabel="Sil"
				variant="destructive"
				onConfirm={handleDelete}
			/>
		</div>
	)
}
