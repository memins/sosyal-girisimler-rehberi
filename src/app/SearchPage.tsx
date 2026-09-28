import { SearchIcon, SearchXIcon, SlidersHorizontalIcon, Trash2Icon } from 'lucide-react'
import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EnterpriseCard } from '@/features/directory/EnterpriseCard'
import { FilterSidebar } from '@/features/directory/FilterSidebar'
import { ActiveFilterBar } from '@/features/directory/ActiveFilterBar'
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import { usePublicAdmin } from '@/features/admin/state/usePublicAdmin'
import { deleteEnterprise, getDirectoryMeta, listEnterprises } from '@/lib/api'
import type { DirectoryMeta, EnterpriseSort, ListEnterprisesPayload } from '@/shared/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { ErrorBlock, LoadingGrid } from '@/components/StateBlock'
import { EmptyState } from '@/components/layout/empty-state'
import { Pager } from '@/components/Pager'
import { PageHeader } from '@/components/layout/page-header'
import { scrollBehavior, useDocumentTitle } from '@/lib/a11y'

const SORT_OPTIONS: Array<{ value: EnterpriseSort; label: string }> = [
	{ value: 'featured', label: 'Öne çıkanlar' },
	{ value: 'newest', label: 'En yeni' },
	{ value: 'name', label: 'İsme göre' },
]

export function SearchPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [meta, setMeta] = useState<DirectoryMeta | null>(null)
	const [results, setResults] = useState<ListEnterprisesPayload | null>(null)
	const [isFetching, setIsFetching] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [queryInput, setQueryInput] = useState(() => searchParams.get('query') ?? '')
	const queryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const resultsRef = useRef<HTMLElement>(null)
	const currentParams = useMemo(() => new URLSearchParams(searchParams), [searchParams])
	const sort = (searchParams.get('sort') as EnterpriseSort) || 'featured'
	const admin = usePublicAdmin()
	const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
	const [isConfirmOpen, setIsConfirmOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	useDocumentTitle('Girişimler')

	// Seçim yalnızca görünen sayfaya aittir; filtre ya da sayfa değişince sıfırlanır.
	useEffect(() => {
		setSelectedIds(new Set())
	}, [currentParams])

	useEffect(() => {
		getDirectoryMeta()
			.then(setMeta)
			.catch((err: Error) => setError(err.message))
	}, [])

	// Yeni sonuçlar gelene kadar eskileri soluk göster: iskelete geri dönmek
	// sayfa yüksekliğini değiştirip düzen kaymasına (CLS) yol açıyordu.
	useEffect(() => {
		let ignore = false
		setIsFetching(true)
		listEnterprises(currentParams)
			.then((payload) => {
				if (ignore) return
				startTransition(() => {
					setResults(payload)
					setIsFetching(false)
				})
			})
			.catch((err: Error) => {
				if (ignore) return
				setError(err.message)
				setIsFetching(false)
			})
		return () => {
			ignore = true
		}
	}, [currentParams])

	useEffect(() => {
		setQueryInput(searchParams.get('query') ?? '')
	}, [searchParams])

	function updateParams(mutator: (next: URLSearchParams) => void, resetPage = true) {
		const next = new URLSearchParams(searchParams)
		mutator(next)
		if (resetPage) next.delete('page')
		setSearchParams(next)
	}

	function handleQueryInput(value: string) {
		setQueryInput(value)
		if (queryDebounceRef.current) clearTimeout(queryDebounceRef.current)
		queryDebounceRef.current = setTimeout(() => {
			updateParams((next) => {
				if (value.trim().length > 0) next.set('query', value.trim())
				else next.delete('query')
			})
		}, 280)
	}

	function handleToggle(key: string, value: string) {
		updateParams((next) => {
			const values = new Set((next.get(key) ?? '').split(',').filter(Boolean))
			if (values.has(value)) values.delete(value)
			else values.add(value)
			const serialized = Array.from(values).join(',')
			if (serialized.length > 0) next.set(key, serialized)
			else next.delete(key)
		})
	}

	function handleRemoveChip(key: string, value: string) {
		updateParams((next) => {
			if (key === 'query') {
				next.delete('query')
				return
			}
			const values = new Set((next.get(key) ?? '').split(',').filter(Boolean))
			values.delete(value)
			const serialized = Array.from(values).join(',')
			if (serialized.length > 0) next.set(key, serialized)
			else next.delete(key)
		})
	}

	function handleClearAll() {
		setSearchParams(new URLSearchParams())
	}

	function handleSortChange(value: string) {
		updateParams((next) => {
			if (value === 'featured') next.delete('sort')
			else next.set('sort', value)
		})
	}

	function handlePageChange(nextPage: number) {
		const next = new URLSearchParams(searchParams)
		if (nextPage <= 1) next.delete('page')
		else next.set('page', String(nextPage))
		setSearchParams(next)
		window.scrollTo({ top: 0, behavior: scrollBehavior() })
		// Klavye kullanıcısı yeni sayfanın başına taşınsın, sayfalamada kalmasın.
		resultsRef.current?.focus({ preventScroll: true })
	}

	function handleSelect(id: string, selected: boolean) {
		setSelectedIds((current) => {
			const next = new Set(current)
			if (selected) next.add(id)
			else next.delete(id)
			return next
		})
	}

	function handleSelectAllOnPage() {
		setSelectedIds(new Set(results?.items.map((item) => item.id) ?? []))
	}

	async function handleBulkDelete() {
		const ids = Array.from(selectedIds)
		setIsDeleting(true)
		const outcomes = await Promise.allSettled(ids.map((id) => deleteEnterprise(id)))
		setIsDeleting(false)

		const deleted = new Set(ids.filter((_, index) => outcomes[index].status === 'fulfilled'))
		const failedCount = ids.length - deleted.size
		// Uç önbellek listeyi bir süre eski gösterebileceği için yeniden çekmek
		// yerine silinenleri yerelde düşürüyoruz.
		setResults((current) =>
			current
				? {
						...current,
						items: current.items.filter((item) => !deleted.has(item.id)),
						total: current.total - deleted.size,
					}
				: current,
		)
		setSelectedIds(new Set(ids.filter((id) => !deleted.has(id))))

		if (deleted.size > 0) toast.success(`${deleted.size} girişim silindi.`)
		if (failedCount > 0) toast.error(`${failedCount} girişim silinemedi.`)
	}

	const total = results?.total ?? 0
	const isEmpty = results !== null && total === 0
	const pageItemCount = results?.items.length ?? 0
	const selectedCount = selectedIds.size

	return (
		<div className="flex flex-col gap-10">
			<PageHeader
				eyebrow="Rehber"
				title="Sosyal girişimleri keşfet"
				description="Kategori, hedef kitle, ülke, iş modeli ve SKA uyumuna göre filtreleyerek araştırmana yön ver."
				actions={
					<div className="flex items-center gap-2">
						<div role="search" className="relative">
							<SearchIcon
								className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
								aria-hidden="true"
							/>
							<Input
								type="search"
								aria-label="Girişim veya konu ara"
								aria-controls="search-results"
								value={queryInput}
								onChange={(event) => handleQueryInput(event.target.value)}
								placeholder="Girişim veya konu ara"
								className="pl-9 md:w-80"
							/>
						</div>
						{/* Meta gelmeden de yer tutulur; buton sonradan belirip arama kutusunu kaydırmaz. */}
						{!meta ? (
							<Button variant="outline" className="md:hidden" disabled>
								<SlidersHorizontalIcon />
								Filtre
							</Button>
						) : (
							<Sheet>
								<SheetTrigger asChild>
									<Button variant="outline" className="md:hidden">
										<SlidersHorizontalIcon />
										Filtre
									</Button>
								</SheetTrigger>
								<SheetContent side="right" className="flex w-full max-w-sm flex-col p-0">
									<SheetHeader>
										<SheetTitle>Filtreler</SheetTitle>
									</SheetHeader>
									<div className="flex-1 overflow-y-auto px-4 pb-6">
										<FilterSidebar
											meta={meta}
											selected={searchParams}
											onToggle={handleToggle}
										/>
									</div>
									<SheetFooter className="border-t border-border bg-background">
										<Button variant="ghost" onClick={handleClearAll}>
											Temizle
										</Button>
										<SheetClose asChild>
											<Button>Sonuçları gör</Button>
										</SheetClose>
									</SheetFooter>
								</SheetContent>
							</Sheet>
						)}
					</div>
				}
			/>

			{error ? <ErrorBlock message={error} /> : null}

			<div className="grid gap-10 md:grid-cols-[260px_1fr]">
				<aside aria-label="Filtreler" className="hidden md:block">
					{meta ? (
						<div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
							<FilterSidebar meta={meta} selected={searchParams} onToggle={handleToggle} />
						</div>
					) : null}
				</aside>
				<section
					id="search-results"
					ref={resultsRef}
					tabIndex={-1}
					aria-label="Arama sonuçları"
					aria-busy={isFetching}
					className="flex scroll-mt-24 flex-col gap-6"
				>
					{meta && <ActiveFilterBar meta={meta} params={searchParams} onRemove={handleRemoveChip} onClear={handleClearAll} />}

					<div className="flex flex-col items-start justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
						{/* Filtre/arama değişince sonuç sayısı ekran okuyucuya bildirilir. */}
						<p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-muted-foreground">
							{results
								? total === 0
									? 'Eşleşen girişim bulunamadı'
									: `${total} girişim · sayfa ${results.page} / ${Math.max(1, Math.ceil(total / (results.pageSize || 24)))}`
								: 'Girişimler yükleniyor…'}
						</p>
						<div className="flex items-center gap-2">
							<span id="sort-label" className="text-sm text-muted-foreground">
								Sırala
							</span>
							<Select value={sort} onValueChange={handleSortChange}>
								<SelectTrigger id="sort-trigger" aria-labelledby="sort-label sort-trigger" className="w-44">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SORT_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{!results ? (
						<LoadingGrid />
					) : isEmpty ? (
						<EmptyState
							icon={SearchXIcon}
							title="Eşleşen girişim bulunamadı"
							description="Filtrelerini gözden geçir ya da tüm rehbere göz at."
							action={
								<Button onClick={handleClearAll}>Filtreleri temizle</Button>
							}
						/>
					) : (
						<>
							<div
								className={`grid gap-5 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${
									isFetching ? 'opacity-60' : ''
								}`}
							>
								{results.items.map((enterprise, index) => (
									<EnterpriseCard
										key={enterprise.id}
										enterprise={enterprise}
										priority={index === 0 && results.page <= 1}
										selected={admin ? selectedIds.has(enterprise.id) : undefined}
										onSelectedChange={
											admin ? (selected) => handleSelect(enterprise.id, selected) : undefined
										}
									/>
								))}
							</div>
							<Pager
								page={results.page}
								pageSize={results.pageSize}
								total={results.total}
								onPageChange={handlePageChange}
								className="pt-6"
							/>
						</>
					)}

					{admin && selectedCount > 0 && (
						<div
							role="toolbar"
							aria-label="Toplu işlemler"
							className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/40 bg-background/95 p-3 shadow-lg backdrop-blur"
						>
							<p className="mr-auto text-sm font-medium">{selectedCount} girişim seçili</p>
							{selectedCount < pageItemCount && (
								<Button size="sm" variant="outline" onClick={handleSelectAllOnPage}>
									Sayfadakilerin tümünü seç ({pageItemCount})
								</Button>
							)}
							<Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
								Seçimi temizle
							</Button>
							<Button
								size="sm"
								variant="destructive"
								disabled={isDeleting}
								onClick={() => setIsConfirmOpen(true)}
							>
								<Trash2Icon aria-hidden="true" />
								{isDeleting ? 'Siliniyor…' : 'Seçilenleri sil'}
							</Button>
						</div>
					)}
				</section>

				{admin && (
					<ConfirmDialog
						open={isConfirmOpen}
						onOpenChange={setIsConfirmOpen}
						title={`${selectedCount} girişim kalıcı olarak silinsin mi?`}
						description="Bu işlem geri alınamaz."
						confirmLabel="Sil"
						variant="destructive"
						onConfirm={handleBulkDelete}
					/>
				)}
			</div>
		</div>
	)
}
