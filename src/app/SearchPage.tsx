import { SlidersHorizontalIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EnterpriseCard } from '@/features/directory/EnterpriseCard'
import { FilterSidebar } from '@/features/directory/FilterSidebar'
import { getDirectoryMeta, listEnterprises } from '@/lib/api'
import type { DirectoryMeta, ListEnterprisesPayload } from '@/shared/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ErrorBlock, LoadingGrid } from '@/components/StateBlock'

export function SearchPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [meta, setMeta] = useState<DirectoryMeta | null>(null)
	const [results, setResults] = useState<ListEnterprisesPayload | null>(null)
	const [error, setError] = useState<string | null>(null)
	const currentParams = useMemo(() => new URLSearchParams(searchParams), [searchParams])

	useEffect(() => {
		getDirectoryMeta()
			.then(setMeta)
			.catch((currentError: Error) => setError(currentError.message))
	}, [])

	useEffect(() => {
		listEnterprises(currentParams)
			.then(setResults)
			.catch((currentError: Error) => setError(currentError.message))
	}, [currentParams])

	function handleQueryChange(value: string) {
		const next = new URLSearchParams(searchParams)

		if (value.trim().length > 0) {
			next.set('query', value)
		} else {
			next.delete('query')
		}

		setSearchParams(next)
	}

	function handleToggle(key: string, value: string) {
		const next = new URLSearchParams(searchParams)
		const values = new Set((next.get(key) ?? '').split(',').filter(Boolean))

		if (values.has(value)) {
			values.delete(value)
		} else {
			values.add(value)
		}

		const serialized = Array.from(values).join(',')

		if (serialized.length > 0) {
			next.set(key, serialized)
		} else {
			next.delete(key)
		}

		setSearchParams(next)
	}

	return (
		<div className="flex flex-col gap-8">
			<header className="flex flex-col gap-4">
				<p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">Arama</p>
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<h1 className="text-4xl font-semibold tracking-tight">Girişim rehberi</h1>
						<p className="mt-2 max-w-2xl text-muted-foreground">
							Sosyal girişimleri kategori, hedef kitle, ülke, iş modeli ve SKA uyumuna göre filtreleyin.
						</p>
					</div>
					<div className="flex gap-2">
						<Input
							value={searchParams.get('query') ?? ''}
							onChange={(event) => handleQueryChange(event.target.value)}
							placeholder="Girişim veya konu ara"
							className="w-full md:w-80"
						/>
						{meta ? (
							<Sheet>
								<SheetTrigger asChild>
									<Button variant="outline" className="md:hidden">
										<SlidersHorizontalIcon data-icon="inline-start" />
										Filtre
									</Button>
								</SheetTrigger>
								<SheetContent>
									<SheetHeader>
										<SheetTitle>Filtreler</SheetTitle>
									</SheetHeader>
									<div className="mt-6">
										<FilterSidebar meta={meta} selected={searchParams} onToggle={handleToggle} />
									</div>
								</SheetContent>
							</Sheet>
						) : null}
					</div>
				</div>
			</header>

			{error ? <ErrorBlock message={error} /> : null}

			<div className="grid gap-8 md:grid-cols-[280px_1fr]">
				<div className="hidden md:block">
					{meta ? <FilterSidebar meta={meta} selected={searchParams} onToggle={handleToggle} /> : null}
				</div>
				<main className="flex flex-col gap-4">
					<p className="text-sm text-muted-foreground">
						{results ? `${results.total} girişim listeleniyor` : 'Girişimler yükleniyor'}
					</p>
					{results ? (
						<div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
							{results.items.map((enterprise) => (
								<EnterpriseCard key={enterprise.id} enterprise={enterprise} />
							))}
						</div>
					) : (
						<LoadingGrid />
					)}
				</main>
			</div>
		</div>
	)
}
