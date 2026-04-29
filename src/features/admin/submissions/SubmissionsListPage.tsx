import { CheckIcon, InboxIcon, Loader2Icon, XIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { approveSubmission, listSubmissions, rejectSubmission } from '@/lib/api'
import type { Submission } from '@/shared/types'

export function SubmissionsListPage() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const [items, setItems] = useState<Array<Submission> | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [confirmApprove, setConfirmApprove] = useState<Submission | null>(null)
	const [confirmReject, setConfirmReject] = useState<Submission | null>(null)
	const [rejectReason, setRejectReason] = useState('')
	const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null)

	const openId = searchParams.get('open')
	const openSubmission = useMemo(
		() => items?.find((s) => s.id === openId) ?? null,
		[items, openId],
	)

	useEffect(() => {
		void loadSubmissions()
	}, [])

	async function loadSubmissions() {
		try {
			setItems(await listSubmissions())
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Veriler yüklenemedi.')
		}
	}

	function setOpen(id: string | null) {
		const next = new URLSearchParams(searchParams)
		if (id) next.set('open', id)
		else next.delete('open')
		setSearchParams(next)
	}

	async function handleApprove() {
		if (!confirmApprove) return
		setPendingAction('approve')
		try {
			const enterprise = await approveSubmission(confirmApprove.id)
			toast.success('Öneri onaylandı.')
			setConfirmApprove(null)
			setOpen(null)
			navigate(`/admin/enterprises/${enterprise.id}/edit`)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Onaylanamadı.')
		} finally {
			setPendingAction(null)
		}
	}

	async function handleReject() {
		if (!confirmReject) return
		setPendingAction('reject')
		try {
			await rejectSubmission(confirmReject.id, rejectReason || undefined)
			toast.success('Öneri reddedildi.')
			setConfirmReject(null)
			setRejectReason('')
			setOpen(null)
			await loadSubmissions()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Reddedilemedi.')
		} finally {
			setPendingAction(null)
		}
	}

	if (error) return <ErrorBlock message={error} />
	if (!items) return <RouteFallback />

	return (
		<div className="flex flex-col gap-8">
			<PageHeader
				eyebrow="Yönetim"
				title="Öneriler"
				description="Kullanıcıların gönderdiği yeni girişim önerilerini incele."
			/>

			{items.length === 0 ? (
				<EmptyState
					icon={InboxIcon}
					title="Henüz öneri yok"
					description="Yeni öneriler geldiğinde burada listelenir."
				/>
			) : (
				<div className="overflow-hidden rounded-xl border border-border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Ad</TableHead>
								<TableHead>İletişim</TableHead>
								<TableHead>Tarih</TableHead>
								<TableHead className="w-28">Durum</TableHead>
								<TableHead className="w-24" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((submission) => (
								<TableRow
									key={submission.id}
									className="cursor-pointer"
									onClick={() => setOpen(submission.id)}
								>
									<TableCell className="font-medium">{submission.name}</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{submission.contactEmail}
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{new Date(submission.createdAt).toLocaleString('tr-TR')}
									</TableCell>
									<TableCell>
										<Badge variant={statusVariant(submission.status)}>
											{statusLabel(submission.status)}
										</Badge>
									</TableCell>
									<TableCell>
										<Button
											size="sm"
											variant="ghost"
											onClick={(event) => {
												event.stopPropagation()
												setOpen(submission.id)
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

			<Sheet open={!!openSubmission} onOpenChange={(open) => !open && setOpen(null)}>
				<SheetContent side="right" className="w-full max-w-lg">
					{openSubmission && (
						<>
							<SheetHeader>
								<SheetTitle>{openSubmission.name}</SheetTitle>
								<SheetDescription>
									{openSubmission.contactEmail} ·{' '}
									{new Date(openSubmission.createdAt).toLocaleString('tr-TR')}
								</SheetDescription>
							</SheetHeader>
							<div className="flex flex-col gap-5 px-4 py-4 text-sm">
								<DetailRow label="Açıklama" value={openSubmission.description} />
								{openSubmission.websiteUrl && (
									<DetailRow
										label="Web sitesi"
										value={
											<a
												href={openSubmission.websiteUrl}
												target="_blank"
												rel="noreferrer"
												className="text-primary underline-offset-4 hover:underline"
											>
												{openSubmission.websiteUrl}
											</a>
										}
									/>
								)}
								{openSubmission.problem && (
									<DetailRow label="Hangi yarayı sarıyor?" value={openSubmission.problem} />
								)}
								{openSubmission.solution && (
									<DetailRow label="Bunu nasıl yapıyor?" value={openSubmission.solution} />
								)}
								{openSubmission.rejectionReason && (
									<DetailRow
										label="Red gerekçesi"
										value={
											<span className="text-destructive">
												{openSubmission.rejectionReason}
											</span>
										}
									/>
								)}
								<DetailRow
									label="Durum"
									value={
										<Badge variant={statusVariant(openSubmission.status)}>
											{statusLabel(openSubmission.status)}
										</Badge>
									}
								/>
							</div>
							<SheetFooter className="flex-col gap-2 border-t border-border p-4 sm:flex-row">
								{openSubmission.status === 'pending' && (
									<>
										<Button
											variant="outline"
											className="flex-1"
											onClick={() => setConfirmReject(openSubmission)}
										>
											<XIcon />
											Reddet
										</Button>
										<Button
											className="flex-1"
											onClick={() => setConfirmApprove(openSubmission)}
										>
											<CheckIcon />
											Onayla
										</Button>
									</>
								)}
							</SheetFooter>
						</>
					)}
				</SheetContent>
			</Sheet>

			<ConfirmDialog
				open={!!confirmApprove}
				onOpenChange={(open) => !open && setConfirmApprove(null)}
				title="Öneriyi onayla"
				description="Bu öneri taslak girişime dönüştürülecek. Devam etmek istiyor musun?"
				confirmLabel={pendingAction === 'approve' ? 'Onaylanıyor…' : 'Onayla'}
				onConfirm={handleApprove}
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
				confirmLabel={pendingAction === 'reject' ? 'Reddediliyor…' : 'Reddet'}
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
				{pendingAction === 'reject' && (
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Loader2Icon className="size-3 animate-spin" />
						İşleniyor…
					</div>
				)}
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

function statusVariant(status: Submission['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
	switch (status) {
		case 'approved':
			return 'default'
		case 'rejected':
			return 'destructive'
		case 'pending':
		default:
			return 'secondary'
	}
}

function statusLabel(status: Submission['status']): string {
	switch (status) {
		case 'approved':
			return 'Onaylandı'
		case 'rejected':
			return 'Reddedildi'
		case 'pending':
		default:
			return 'Beklemede'
	}
}
