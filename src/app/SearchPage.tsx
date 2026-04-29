import { SearchIcon, SearchXIcon, SlidersHorizontalIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EnterpriseCard } from '@/features/directory/EnterpriseCard'
import { FilterSidebar } from '@/features/directory/FilterSidebar'
import { ActiveFilterBar } from '@/features/directory/ActiveFilterBar'
import { getDirectoryMeta, listEnterprises } from '@/lib/api'
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

const SORT_OPTIONS: Array<{ value: EnterpriseSort; label: string }> = [
	{ value: 'featured', label: 'Öne çıkanlar' },
	{ value: 'newest', label: 'En yeni' },
	{ value: 'name', label: 'İsme göre' },
]

export function SearchPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [meta, setMeta] = useState<DirectoryMeta | null>(null)
	const [results, setResults] = useState<ListEnterprisesPayload | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [queryInput, setQueryInput] = useState(() => searchParams.get('query') ?? '')
	const queryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const currentParams = useMemo(() => new URLSearchParams(searchParams), [searchParams])
	const sort = (searchParams.get('sort') as EnterpriseSort) || 'featured'
	const page = Number(searchParams.get('page')) || 1

	useEffect(() => {
		getDirectoryMeta()
			.then(setMeta)
			.catch((err: Error) => setError(err.message))
	}, [])

	useEffect(() => {
		setResults(null)
		listEnterprises(currentParams)
			.then(setResults)
			.catch((err: Error) => setError(err.message))
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
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const total = results?.total ?? 0
	const isEmpty = results !== null && total === 0

	return (
		<div className="flex flex-col gap-10">
			<PageHeader
				eyebrow="Rehber"
				title="Sosyal girişimleri keşfet"
				description="Kategori, hedef kitle, ülke, iş modeli ve SKA uyumuna göre filtreleyerek araştırmana yön ver."
				actions={
					<div className="flex items-center gap-2">
						<div className="relative">
							<SearchIcon
								className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
								aria-hidden="true"
							/>
							<Input
								value={queryInput}
								onChange={(event) => handleQueryInput(event.target.value)}
								placeholder="Girişim veya konu ara"
								className="pl-9 md:w-80"
							/>
						</div>
						{meta && (
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
				<aside className="hidden md:block">
					{meta ? (
						<div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
							<FilterSidebar meta={meta} selected={searchParams} onToggle={handleToggle} />
						</div>
					) : null}
				</aside>
				<main className="flex flex-col gap-6">
					{meta && <ActiveFilterBar meta={meta} params={searchParams} onRemove={handleRemoveChip} onClear={handleClearAll} />}

					<div className="flex flex-col items-start justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
						<p className="text-sm text-muted-foreground">
							{results
								? total === 0
									? 'Eşleşen girişim bulunamadı'
									: `${total} girişim · sayfa ${page} / ${Math.max(1, Math.ceil(total / (results.pageSize || 24)))}`
								: 'Girişimler yükleniyor…'}
						</p>
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">Sırala</span>
							<Select value={sort} onValueChange={handleSortChange}>
								<SelectTrigger className="w-44">
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
							<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
								{results.items.map((enterprise) => (
									<EnterpriseCard key={enterprise.id} enterprise={enterprise} />
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
				</main>
			</div>
		</div>
	)
}
