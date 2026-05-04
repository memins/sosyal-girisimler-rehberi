import { CheckIcon, ExternalLinkIcon, MessagesSquareIcon, XIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import { ErrorBlock, RouteFallback } from '@/components/StateBlock'
import { EmptyState } from '@/components/layout/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import {
	applyAdminEditSuggestion,
	listAdminEditSuggestions,
	rejectAdminEditSuggestion,
} from '@/lib/api'
import type { EditSuggestion, EditSuggestionStatus } from '@/shared/types'

export function EditSuggestionsListPage() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const [items, setItems] = useState<Array<EditSuggestion> | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [confirmApply, setConfirmApply] = useState<EditSuggestion | null>(null)
	const [confirmReject, setConfirmReject] = useState<EditSuggestion | null>(null)
	const [rejectReason, setRejectReason] = useState('')

	const openId = searchParams.get('open')
	const openItem = useMemo(
		() => items?.find((s) => s.id === openId) ?? null,
		[items, openId],
	)

	useEffect(() => {
		void load()
	}, [])

	async function load() {
		try {
			setItems(await listAdminEditSuggestions())
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Yüklenemedi.')
		}
	}

	function setOpen(id: string | null) {
		const next = new URLSearchParams(searchParams)
		if (id) next.set('open', id)
		else next.delete('open')
		setSearchParams(next)
	}

	async function handleApply() {
		if (!confirmApply) return
		try {
			await applyAdminEditSuggestion(confirmApply.id)
			toast.success('Öneri uygulandı olarak işaretlendi.')
			const target = confirmApply
			setConfirmApply(null)
			setOpen(null)
			navigate(`/admin/enterprises/${target.enterpriseId}/edit`)
			await load()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Güncellenemedi.')
		}
	}

	async function handleReject() {
		if (!confirmReject) return
		try {
			await rejectAdminEditSuggestion(confirmReject.id, rejectReason || undefined)
			toast.success('Öneri reddedildi.')
			setConfirmReject(null)
			setRejectReason('')
			setOpen(null)
			await load()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Güncellenemedi.')
		}
	}

	if (error) return <ErrorBlock message={error} />
	if (!items) return <RouteFallback />

	return (
		<div className="flex flex-col gap-8">
			<PageHeader
				eyebrow="Yönetim"
				title="Düzenleme önerileri"
				description="Kullanıcıların gönderdiği içerik düzeltme önerilerini incele ve uygula."
			/>

			{items.length === 0 ? (
				<EmptyState
					icon={MessagesSquareIcon}
					title="Henüz öneri yok"
					description="Kullanıcılar bir girişim sayfasından öneri yolladığında burada görünür."
				/>
			) : (
				<div className="overflow-hidden rounded-xl border border-border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Girişim</TableHead>
								<TableHead>Mesaj</TableHead>
								<TableHead className="w-32">İletişim</TableHead>
								<TableHead className="w-28">Durum</TableHead>
								<TableHead className="w-24" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => (
								<TableRow
									key={item.id}
									className="cursor-pointer"
									onClick={() => setOpen(item.id)}
								>
									<TableCell className="font-medium">{item.enterpriseName}</TableCell>
									<TableCell className="max-w-xl">
										<span className="line-clamp-2 text-sm text-muted-foreground">
											{item.message}
										</span>
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{item.contactEmail ?? '—'}
									</TableCell>
									<TableCell>
										<Badge variant={statusVariant(item.status)}>
											{statusLabel(item.status)}
										</Badge>
									</TableCell>
									<TableCell>
										<Button
											size="sm"
											variant="ghost"
											onClick={(event) => {
												event.stopPropagation()
												setOpen(item.id)
											}}
										>
											Detay
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			<Sheet open={!!openItem} onOpenChange={(open) => !open && setOpen(null)}>
				<SheetContent side="right" className="w-full max-w-lg">
					{openItem && (
						<>
							<SheetHeader>
								<SheetTitle>Düzenleme önerisi</SheetTitle>
								<SheetDescription>
									{new Date(openItem.createdAt).toLocaleString('tr-TR')}
								</SheetDescription>
							</SheetHeader>
							<div className="flex flex-col gap-5 px-4 py-4 text-sm">
								<DetailRow
									label="Girişim"
									value={
										<Link
											to={`/girisimler/${openItem.enterpriseSlug}`}
											target="_blank"
											rel="noreferrer"
											className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
										>
											{openItem.enterpriseName}
											<ExternalLinkIcon className="size-3" />
										</Link>
									}
								/>
								<DetailRow
									label="Mesaj"
									value={
										<p className="whitespace-pre-line leading-relaxed text-foreground">
											{openItem.message}
										</p>
									}
								/>
								{openItem.contactEmail && (
									<DetailRow label="İletişim" value={openItem.contactEmail} />
								)}
								{openItem.rejectionReason && (
									<DetailRow
										label="Red gerekçesi"
										value={
											<span className="text-destructive">
												{openItem.rejectionReason}
											</span>
										}
									/>
								)}
								<DetailRow
									label="Durum"
									value={
										<Badge variant={statusVariant(openItem.status)}>
											{statusLabel(openItem.status)}
										</Badge>
									}
								/>
							</div>
							<SheetFooter className="flex-col gap-2 border-t border-border p-4 sm:flex-row">
								{openItem.status === 'pending' && (
									<>
										<Button
											variant="outline"
											className="flex-1"
											onClick={() => setConfirmReject(openItem)}
										>
											<XIcon />
											Reddet
										</Button>
										<Button
											className="flex-1"
											onClick={() => setConfirmApply(openItem)}
										>
											<CheckIcon />
											Uygula
										</Button>
									</>
								)}
								{openItem.status !== 'pending' && (
									<Button
										variant="outline"
										className="flex-1"
										onClick={() =>
											navigate(`/admin/enterprises/${openItem.enterpriseId}/edit`)
										}
									>
										Girişimi düzenle
									</Button>
								)}
							</SheetFooter>
						</>
					)}
				</SheetContent>
			</Sheet>

			<ConfirmDialog
				open={!!confirmApply}
				onOpenChange={(open) => !open && setConfirmApply(null)}
				title="Öneriyi uygula"
				description="Öneri 'uygulandı' olarak işaretlenecek ve girişim düzenleme sayfası açılacak — değişiklikleri orada manuel uygulayabilirsin."
				confirmLabel="Devam"
				onConfirm={handleApply}
			/>

			<ConfirmDialog
				open={!!confirmReject}
				onOpenChange={(open) => {
					if (!open) {
						setConfirmReject(null)
						setRejectReason('')
					}
				}}
				title="Öneriyi reddet"
				description="Reddetme nedenini opsiyonel olarak ekleyebilirsin."
				confirmLabel="Reddet"
				variant="destructive"
				onConfirm={handleReject}
			>
				<Textarea
					value={rejectReason}
					onChange={(event) => setRejectReason(event.target.value)}
					placeholder="Red gerekçesi (opsiyonel)"
					rows={3}
					className="my-3"
				/>
			</ConfirmDialog>
		</div>
	)
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
				{label}
			</span>
			<div className="text-sm leading-relaxed text-foreground">{value}</div>
		</div>
	)
}

function statusVariant(
	status: EditSuggestionStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
	switch (status) {
		case 'applied':
			return 'default'
		case 'rejected':
			return 'destructive'
		case 'pending':
		default:
			return 'secondary'
	}
}

function statusLabel(status: EditSuggestionStatus): string {
	switch (status) {
		case 'applied':
			return 'Uygulandı'
		case 'rejected':
			return 'Reddedildi'
		case 'pending':
		default:
			return 'Beklemede'
	}
}
