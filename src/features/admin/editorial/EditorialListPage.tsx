import { BookOpenIcon, PlusIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { ErrorBlock, RouteFallback } from '@/components/StateBlock'
import { EmptyState } from '@/components/layout/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { useTopbarActions } from '@/features/admin/layout/AdminTopbar'
import { listAdminEditorialLists } from '@/lib/api'
import type { EditorialList } from '@/shared/types'

export function EditorialListPage() {
	const [items, setItems] = useState<Array<EditorialList> | null>(null)
	const [error, setError] = useState<string | null>(null)

	useTopbarActions(
		<Button asChild size="sm">
			<Link to="/admin/editorial-lists/new">
				<PlusIcon />
				Yeni liste
			</Link>
		</Button>,
	)

	useEffect(() => {
		listAdminEditorialLists()
			.then(setItems)
			.catch((err: Error) => setError(err.message))
	}, [])

	if (error) return <ErrorBlock message={error} />
	if (!items) return <RouteFallback />

	return (
		<div className="flex flex-col gap-8">
			<PageHeader
				eyebrow="Yönetim"
				title="Editöryel listeler"
				description="Tematik veya zamanlı koleksiyonları buradan yönet."
			/>

			{items.length === 0 ? (
				<EmptyState
					icon={BookOpenIcon}
					title="Henüz liste yok"
					description="Editöryel listeler oluşturarak öne çıkardığın girişimleri tematik gruplayabilirsin."
					action={
						<Button asChild>
							<Link to="/admin/editorial-lists/new">İlk listeyi oluştur</Link>
						</Button>
					}
				/>
			) : (
				<div className="overflow-hidden rounded-xl border border-border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Başlık</TableHead>
								<TableHead>Slug</TableHead>
								<TableHead className="w-24 text-center">Girişim</TableHead>
								<TableHead className="w-28">Durum</TableHead>
								<TableHead className="w-24" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((list) => (
								<TableRow key={list.id}>
									<TableCell className="font-medium">{list.title}</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{list.slug}
									</TableCell>
									<TableCell className="text-center text-sm">
										{list.items.length}
									</TableCell>
									<TableCell>
										<Badge variant={list.status === 'published' ? 'default' : 'secondary'}>
											{list.status === 'published'
												? 'Yayında'
												: list.status === 'archived'
													? 'Arşivde'
													: 'Taslak'}
										</Badge>
									</TableCell>
									<TableCell>
										<Button asChild size="sm" variant="ghost">
											<Link to={`/admin/editorial-lists/${list.id}/edit`}>Düzenle</Link>
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	)
}
