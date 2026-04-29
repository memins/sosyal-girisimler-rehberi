import { Building2Icon, PlusIcon, SearchIcon, StarIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { listAdminEnterprises } from '@/lib/api'
import type { EnterpriseSummary } from '@/shared/types'

const PAGE_SIZE = 20

export function EnterprisesListPage() {
	const [items, setItems] = useState<Array<EnterpriseSummary> | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)

	useTopbarActions(
		<Button asChild size="sm">
			<Link to="/admin/enterprises/new">
				<PlusIcon />
				Yeni girişim
			</Link>
		</Button>,
	)

	useEffect(() => {
		listAdminEnterprises(new URLSearchParams({ pageSize: '60' }))
			.then((res) => setItems(res.items))
			.catch((err: Error) => setError(err.message))
	}, [])

	const filtered = useMemo(() => {
		if (!items) return null
		const term = search.trim().toLocaleLowerCase('tr')
		if (term.length === 0) return items
		return items.filter(
			(item) =>
				item.name.toLocaleLowerCase('tr').includes(term) ||
				item.slug.toLocaleLowerCase('tr').includes(term),
		)
	}, [items, search])

	const total = filtered?.length ?? 0
	const visible = filtered?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? []

	useEffect(() => {
		setPage(1)
	}, [search])

	if (error) return <ErrorBlock message={error} />
	if (!items) return <RouteFallback />

	return (
		<div className="flex flex-col gap-8">
			<PageHeader
				eyebrow="Yönetim"
				title="Girişimler"
				description="Tüm rehber içeriklerini buradan düzenle."
			/>

			<div className="flex flex-col gap-4">
				<div className="relative max-w-sm">
					<SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="İsim veya slug ile ara"
						className="pl-9"
					/>
				</div>

				{total === 0 ? (
					<EmptyState
						icon={Building2Icon}
						title={search ? 'Eşleşen girişim yok' : 'Henüz girişim yok'}
						description={
							search
								? 'Aramanı değiştirmeyi dene.'
								: 'İlk girişimi ekleyerek rehberi büyütmeye başla.'
						}
						action={
							!search && (
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
										<TableHead className="w-20 text-center">Öne çıkan</TableHead>
										<TableHead className="w-20" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{visible.map((enterprise) => (
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
											<TableCell className="text-center">
												{enterprise.isFeatured && (
													<StarIcon
														className="mx-auto size-4 fill-warning text-warning"
														aria-label="Öne çıkan"
													/>
												)}
											</TableCell>
											<TableCell>
												<Button asChild size="sm" variant="ghost">
													<Link to={`/admin/enterprises/${enterprise.id}/edit`}>
														Düzenle
													</Link>
												</Button>
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
							onPageChange={setPage}
							className="pt-4"
						/>
					</>
				)}
			</div>
		</div>
	)
}
