import { ArrowRightIcon, Building2Icon, ImageIcon, InboxIcon, StarIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorBlock } from '@/components/StateBlock'
import { PageHeader } from '@/components/layout/page-header'
import { getAdminSummary, listAdminEnterprises, listSubmissions } from '@/lib/api'
import type { Submission } from '@/shared/types'

interface DashboardData {
	enterprises: number
	pendingSubmissions: number
	editorialLists: number
	featured: number
	recentSubmissions: Array<Submission>
}

export default function DashboardPage() {
	const [data, setData] = useState<DashboardData | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		;(async () => {
			try {
				const [summary, enterprises, submissions] = await Promise.all([
					getAdminSummary(),
					listAdminEnterprises(),
					listSubmissions(),
				])
				setData({
					enterprises: summary.enterprises,
					pendingSubmissions: summary.pendingSubmissions,
					editorialLists: summary.editorialLists,
					featured: enterprises.items.filter((e) => e.isFeatured).length,
					recentSubmissions: submissions.slice(0, 6),
				})
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Veriler yüklenemedi.')
			}
		})()
	}, [])

	if (error) return <ErrorBlock message={error} />

	return (
		<div className="flex flex-col gap-10">
			<PageHeader
				eyebrow="Panel"
				title="Hoş geldin"
				description="Rehberin özet metriklerini ve son aktiviteyi buradan takip edebilirsin."
			/>

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					icon={Building2Icon}
					label="Toplam girişim"
					value={data?.enterprises ?? '—'}
				/>
				<MetricCard
					icon={InboxIcon}
					label="Bekleyen öneri"
					value={data?.pendingSubmissions ?? '—'}
					accent={data && data.pendingSubmissions > 0 ? 'warning' : undefined}
				/>
				<MetricCard
					icon={StarIcon}
					label="Öne çıkan"
					value={data?.featured ?? '—'}
				/>
				<MetricCard
					icon={ImageIcon}
					label="Editöryel liste"
					value={data?.editorialLists ?? '—'}
				/>
			</section>

			<section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between gap-2">
						<div>
							<CardTitle>Son öneriler</CardTitle>
							<CardDescription>Editör onayı bekleyen kullanıcı önerileri.</CardDescription>
						</div>
						<Button asChild variant="ghost" size="sm">
							<Link to="/admin/submissions">
								Tümü
								<ArrowRightIcon className="size-4" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent className="flex flex-col divide-y divide-border">
						{data?.recentSubmissions.length === 0 && (
							<p className="py-6 text-sm text-muted-foreground">Henüz öneri yok.</p>
						)}
						{data?.recentSubmissions.map((submission) => (
							<Link
								key={submission.id}
								to={`/admin/submissions?open=${encodeURIComponent(submission.id)}`}
								className="flex items-center justify-between gap-3 py-3 transition hover:bg-secondary/40"
							>
								<div className="flex flex-col gap-0.5">
									<span className="text-sm font-medium">{submission.name}</span>
									<span className="text-xs text-muted-foreground">{submission.contactEmail}</span>
								</div>
								<Badge variant={statusVariant(submission.status)}>
									{statusLabel(submission.status)}
								</Badge>
							</Link>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Hızlı işlemler</CardTitle>
						<CardDescription>Sık kullanılan eylemler.</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						<Button asChild className="justify-start">
							<Link to="/admin/enterprises/new">
								<Building2Icon />
								Yeni girişim
							</Link>
						</Button>
						<Button asChild variant="outline" className="justify-start">
							<Link to="/admin/editorial-lists/new">
								<InboxIcon />
								Yeni editöryel liste
							</Link>
						</Button>
						<Button asChild variant="outline" className="justify-start">
							<Link to="/admin/media">
								<ImageIcon />
								Medya kütüphanesi
							</Link>
						</Button>
					</CardContent>
				</Card>
			</section>
		</div>
	)
}

interface MetricCardProps {
	icon: typeof Building2Icon
	label: string
	value: string | number
	accent?: 'warning'
}

function MetricCard({ icon: Icon, label, value, accent }: MetricCardProps) {
	return (
		<Card>
			<CardContent className="flex items-center justify-between gap-4 p-5">
				<div className="flex flex-col gap-1">
					<span className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
						{label}
					</span>
					<span className="text-3xl font-semibold tracking-tight">{value}</span>
				</div>
				<span
					className={`flex size-11 items-center justify-center rounded-xl ${
						accent === 'warning' ? 'bg-warning/15 text-warning' : 'bg-primary/10 text-primary'
					}`}
				>
					<Icon className="size-5" />
				</span>
			</CardContent>
		</Card>
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
