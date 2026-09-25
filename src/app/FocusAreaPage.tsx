import { ArrowRightIcon, BriefcaseBusinessIcon, GraduationCapIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Pager } from '@/components/Pager'
import { ErrorBlock, RouteFallback } from '@/components/StateBlock'
import { EmptyState } from '@/components/layout/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { EnterpriseCard } from '@/features/directory/EnterpriseCard'
import { listEnterprises } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ListEnterprisesPayload } from '@/shared/types'

const PAGE_SIZE = 24

const AREAS = [
	{
		id: 'istihdam',
		label: 'İstihdam',
		icon: BriefcaseBusinessIcon,
		description:
			'İş gücüne katılımı artıran, beceri kazandıran ve dezavantajlı gruplar için iş imkânı yaratan girişimler.',
	},
	{
		id: 'egitim',
		label: 'Eğitim',
		icon: GraduationCapIcon,
		description:
			'Nitelikli eğitime erişimi genişleten, öğrenmeyi destekleyen ve fırsat eşitliği için çalışan girişimler.',
	},
] as const

type AreaId = (typeof AREAS)[number]['id']

export function FocusAreaPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const areaId: AreaId = searchParams.get('alan') === 'egitim' ? 'egitim' : 'istihdam'
	const page = Math.max(1, Number(searchParams.get('sayfa')) || 1)
	const area = AREAS.find((item) => item.id === areaId) ?? AREAS[0]
	const [data, setData] = useState<ListEnterprisesPayload | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		document.title = `${area.label} girişimleri — Sosyal Girişimler Rehberi`
	}, [area.label])

	useEffect(() => {
		setData(null)
		const params = new URLSearchParams({
			categories: areaId,
			page: String(page),
			pageSize: String(PAGE_SIZE),
			sort: 'featured',
		})
		listEnterprises(params)
			.then((payload) => {
				setData(payload)
				setError(null)
			})
			.catch((err: Error) => setError(err.message))
	}, [areaId, page])

	function selectArea(id: AreaId) {
		setSearchParams(id === 'istihdam' ? {} : { alan: id })
	}

	return (
		<div className="flex flex-col gap-10">
			<PageHeader
				eyebrow="Odak alanları"
				title="İstihdam ve Eğitim"
				description="Rehberdeki girişimlerin iki büyük odağı: insanlara iş ve öğrenme fırsatı açan çözümler."
				actions={
					<Button asChild variant="outline">
						<Link to={`/arama?categories=${areaId}`}>
							Gelişmiş filtrelerle ara
							<ArrowRightIcon />
						</Link>
					</Button>
				}
			/>

			<div role="tablist" aria-label="Odak alanı" className="grid gap-3 sm:grid-cols-2">
				{AREAS.map((item) => {
					const selected = item.id === areaId
					return (
						<button
							key={item.id}
							type="button"
							role="tab"
							aria-selected={selected}
							aria-controls="focus-area-results"
							onClick={() => selectArea(item.id)}
							className={cn(
								'flex items-start gap-4 rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
								selected
									? 'border-primary bg-primary/5'
									: 'border-border bg-card hover:border-primary/40',
							)}
						>
							<span
								className={cn(
									'flex size-11 shrink-0 items-center justify-center rounded-xl',
									selected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
								)}
							>
								<item.icon className="size-5" aria-hidden="true" />
							</span>
							<span className="flex flex-col gap-1">
								<span className="text-lg font-semibold tracking-tight">{item.label}</span>
								<span className="text-sm text-muted-foreground">{item.description}</span>
							</span>
						</button>
					)
				})}
			</div>

			<section id="focus-area-results" role="tabpanel" aria-label={`${area.label} girişimleri`}>
				{error ? (
					<ErrorBlock message={error} />
				) : data === null ? (
					<RouteFallback />
				) : data.total === 0 ? (
					<EmptyState
						icon={area.icon}
						title="Henüz girişim yok"
						description="Bu alanda yayınlanmış girişim bulunmuyor."
					/>
				) : (
					<div className="flex flex-col gap-6">
						<p className="text-sm text-muted-foreground" aria-live="polite">
							{area.label} alanında {data.total} girişim
						</p>
						<ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
							{data.items.map((enterprise) => (
								<li key={enterprise.id}>
									<EnterpriseCard enterprise={enterprise} />
								</li>
							))}
						</ul>
						<Pager
							page={page}
							pageSize={PAGE_SIZE}
							total={data.total}
							onPageChange={(next) => {
								const params = new URLSearchParams(searchParams)
								params.set('sayfa', String(next))
								setSearchParams(params)
								window.scrollTo({ top: 0, behavior: 'smooth' })
							}}
						/>
					</div>
				)}
			</section>
		</div>
	)
}
