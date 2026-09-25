import { Building2Icon, CheckIcon, PlusIcon, SearchIcon, StarIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pager } from '@/components/Pager'
import { ErrorBlock, RouteFallback } from '@/components/StateBlock'
import { EmptyState } from '@/components/layout/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { useTopbarActions } from '@/features/admin/layout/AdminTopbar'
import { listAdminEnterprises, markEnterpriseReviewed } from '@/lib/api'
import type { EnterpriseSummary } from '@/shared/types'

const PAGE_SIZE = 20

const STATUS_LABELS = {
	published: 'Yayında',
	draft: 'Taslak',
	archived: 'Arşiv',
} as const

export function EnterprisesListPage({ variant = 'all' }: { variant?: 'all' | 'review' }) {
	const isReview = variant === 'review'
	const [items, setItems] = useState<Array<EnterpriseSummary> | null>(null)
	const [total, setTotal] = useState(0)
	const [error, setError] = useState<string | null>(null)
	const [searchInput, setSearchInput] = useState('')
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)
	const [loading, setLoading] = useState(false)
	const [reloadKey, setReloadKey] = useState(0)
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useTopbarActions(
		<Button asChild size="sm">
			<Link to="/admin/enterprises/new">
				<PlusIcon />
				Yeni girişim
			</Link>
		</Button>,
	)

	// Debounce the search input → committed `search` value (backend query)
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(() => {
			setSearch(searchInput.trim())
			setPage(1)
		}, 250)
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [searchInput])

	// Fetch from API whenever committed search or page changes
	useEffect(() => {
		setLoading(true)
		const params = new URLSearchParams()
		if (search.length > 0) params.set('query', search)
		params.set('page', String(page))
		params.set('pageSize', String(PAGE_SIZE))
		params.set('sort', isReview ? 'newest' : 'name')
		if (isReview) params.set('review', 'pending')
		listAdminEnterprises(params)
			.then((res) => {
				setItems(res.items)
				setTotal(res.total)
				setError(null)
			})
			.catch((err: Error) => setError(err.message))
			.finally(() => setLoading(false))
	}, [search, page, isReview, reloadKey])

	async function handleMarkReviewed(enterprise: EnterpriseSummary) {
		try {
			await markEnterpriseReviewed(enterprise.id)
			toast.success(`${enterprise.name} kontrol edildi.`)
			setReloadKey((value) => value + 1)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'İşaretlenemedi.')
		}
	}

	if (error) return <ErrorBlock message={error} />
	if (items === null) return <RouteFallback />

	return (
		<div className="flex flex-col gap-8">
			<PageHeader
				eyebrow="Yönetim"
				title={isReview ? 'Otomatik Çekildi' : 'Girişimler'}
				description={
					isReview
						? 'CSV ya da tarayıcı ile otomatik eklenen içerikler. Kaydettiğin ya da “Kontrol edildi” dediğin girişim bu listeden çıkar.'
						: 'Tüm rehber içeriklerini buradan düzenle.'
				}
			/>

			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-3">
					<div className="relative max-w-sm flex-1">
						<SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={searchInput}
							onChange={(event) => setSearchInput(event.target.value)}
							placeholder="İsim, slug, içerik ile ara"
							className="pl-9"
						/>
					</div>
					<span className="text-xs text-muted-foreground tabular-nums">
						{total} sonuç{loading ? ' · yükleniyor…' : ''}
					</span>
				</div>

				{total === 0 ? (
					<EmptyState
						icon={Building2Icon}
						title={
							search
								? 'Eşleşen girişim yok'
								: isReview
									? 'Kontrol bekleyen içerik yok'
									: 'Henüz girişim yok'
						}
						description={
							search
								? 'Aramanı değiştirmeyi dene.'
								: isReview
									? 'Otomatik çekilen tüm girişimler kontrol edildi.'
									: 'İlk girişimi ekleyerek rehberi büyütmeye başla.'
						}
						action={
							!search && !isReview && (
								<Button asChild>
									<Link to="/admin/enterprises/new">Yeni girişim ekle</Link>
								</Button>
							)
						}
					/>
				) : (
					<>
						<div className="overflow-hidden rounded-xl border border-border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-12" />
										<TableHead>Ad</TableHead>
										<TableHead>Kategoriler</TableHead>
										<TableHead>Ülke</TableHead>
										{isReview ? (
											<TableHead className="w-24">Durum</TableHead>
										) : (
											<TableHead className="w-20 text-center">Öne çıkan</TableHead>
										)}
										<TableHead className={isReview ? 'w-56' : 'w-20'} />
									</TableRow>
								</TableHeader>
								<TableBody>
									{items.map((enterprise) => (
										<TableRow key={enterprise.id}>
											<TableCell>
												<Avatar className="size-9 rounded-md">
													{enterprise.logoKey || enterprise.coverKey ? (
														<AvatarImage
															src={`/api/media/${enterprise.logoKey ?? enterprise.coverKey}`}
															alt=""
														/>
													) : null}
													<AvatarFallback className="rounded-md text-xs">
														{enterprise.name.slice(0, 2)}
													</AvatarFallback>
												</Avatar>
											</TableCell>
											<TableCell>
												<div className="flex flex-col gap-0.5">
													<span className="font-medium">{enterprise.name}</span>
													<span className="text-xs text-muted-foreground">
														{enterprise.slug}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1">
													{enterprise.categories.slice(0, 3).map((c) => (
														<Badge key={c.id} variant="outline" className="text-[10px]">
															{c.name}
														</Badge>
													))}
													{enterprise.categories.length > 3 && (
														<Badge variant="outline" className="text-[10px]">
															+{enterprise.categories.length - 3}
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1">
													{enterprise.countries.slice(0, 3).map((country) => (
														<span
															key={country.code}
															title={country.name}
															className="text-base"
															aria-label={country.name}
														>
															{country.flag}
														</span>
													))}
												</div>
											</TableCell>
											{isReview ? (
												<TableCell>
													<Badge variant="secondary" className="text-[10px]">
														{STATUS_LABELS[enterprise.status]}
													</Badge>
												</TableCell>
											) : (
												<TableCell className="text-center">
													{enterprise.isFeatured && (
														<StarIcon
															className="mx-auto size-4 fill-warning text-warning"
															aria-label="Öne çıkan"
														/>
													)}
												</TableCell>
											)}
											<TableCell>
												<div className="flex justify-end gap-1">
													{isReview && (
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleMarkReviewed(enterprise)}
														>
															<CheckIcon />
															Kontrol edildi
														</Button>
													)}
													<Button asChild size="sm" variant="ghost">
														<Link to={`/admin/enterprises/${enterprise.id}/edit`}>
															Düzenle
														</Link>
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
						<Pager
							page={page}
							pageSize={PAGE_SIZE}
							total={total}
							onPageChange={(next) => {
								setPage(next)
								window.scrollTo({ top: 0, behavior: 'smooth' })
							}}
							className="pt-4"
						/>
					</>
				)}
			</div>
		</div>
	)
}
