import { ArrowRightIcon, SearchIcon, SparklesIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
	EnterpriseCard,
	EnterpriseCardCompact,
	EnterpriseCardLead,
} from '@/features/directory/EnterpriseCard'
import { getHome } from '@/lib/api'
import type {
	CategoryWithCount,
	EnterpriseSummary,
	HomePayload,
	SiteStats,
} from '@/shared/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErrorBlock, LoadingGrid } from '@/components/StateBlock'
import { Logomark } from '@/components/logomark'
import { TaxonomyIcon } from '@/lib/taxonomy-icon'

interface SdgMeta {
	id: number
	color: string
	name: string
}

const SDG_DATA: ReadonlyArray<SdgMeta> = [
	{ id: 1, color: '#E5243B', name: 'Yoksulluğa Son' },
	{ id: 2, color: '#DDA63A', name: 'Açlığa Son' },
	{ id: 3, color: '#4C9F38', name: 'Sağlık ve Kaliteli Yaşam' },
	{ id: 4, color: '#C5192D', name: 'Nitelikli Eğitim' },
	{ id: 5, color: '#FF3A21', name: 'Toplumsal Cinsiyet Eşitliği' },
	{ id: 6, color: '#26BDE2', name: 'Temiz Su ve Sıhhi Koşullar' },
	{ id: 7, color: '#FCC30B', name: 'Erişilebilir ve Temiz Enerji' },
	{ id: 8, color: '#A21942', name: 'İnsana Yakışır İş' },
	{ id: 9, color: '#FD6925', name: 'Sanayi ve Yenilikçilik' },
	{ id: 10, color: '#DD1367', name: 'Eşitsizliklerin Azaltılması' },
	{ id: 11, color: '#FD9D24', name: 'Sürdürülebilir Şehirler' },
	{ id: 12, color: '#BF8B2E', name: 'Sorumlu Üretim ve Tüketim' },
	{ id: 13, color: '#3F7E44', name: 'İklim Eylemi' },
	{ id: 14, color: '#0A97D9', name: 'Sudaki Yaşam' },
	{ id: 15, color: '#56C02B', name: 'Karasal Yaşam' },
	{ id: 16, color: '#00689D', name: 'Barış ve Adalet' },
	{ id: 17, color: '#19486A', name: 'Amaçlar için Ortaklıklar' },
]

const POPULAR_CATEGORIES = [
	{ label: 'Eğitim', categoryId: 'egitim' },
	{ label: 'İklim', categoryId: 'cevre' },
	{ label: 'Erişilebilirlik', categoryId: 'erisim' },
]

export function HomePage() {
	const navigate = useNavigate()
	const [query, setQuery] = useState('')
	const [data, setData] = useState<HomePayload | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		getHome()
			.then(setData)
			.catch((err: Error) => setError(err.message))
	}, [])

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const params = new URLSearchParams()
		if (query.trim().length > 0) params.set('query', query.trim())
		navigate(`/arama${params.toString() ? `?${params}` : ''}`)
	}

	return (
		<div className="flex flex-col gap-24">
			<HeroSection
				query={query}
				onQueryChange={setQuery}
				onSubmit={handleSubmit}
				data={data}
			/>

			{error ? <ErrorBlock message={error} /> : null}
			{data ? <HomeContent data={data} /> : <LoadingGrid />}
		</div>
	)
}

interface HeroSectionProps {
	query: string
	onQueryChange: (value: string) => void
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
	data: HomePayload | null
}

function HeroSection({ query, onQueryChange, onSubmit, data }: HeroSectionProps) {
	return (
		<section className="relative overflow-hidden">
			<div
				className="pointer-events-none absolute inset-0 -z-10 opacity-60"
				aria-hidden="true"
				style={{
					backgroundImage:
						'radial-gradient(circle at 1px 1px, oklch(from var(--foreground) l c h / 0.08) 1px, transparent 0)',
					backgroundSize: '24px 24px',
					maskImage:
						'radial-gradient(ellipse 80% 60% at center, black 0%, transparent 75%)',
				}}
			/>
			<div
				className="pointer-events-none absolute -top-24 right-0 -z-10 size-[36rem] rounded-full opacity-30 blur-3xl"
				style={{ background: 'oklch(from var(--accent) l c h)' }}
				aria-hidden="true"
			/>
			<div className="grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-center lg:gap-16 lg:py-20">
				<div className="flex flex-col gap-8">
					<div className="flex flex-col gap-5 max-w-2xl">
						<span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
							<SparklesIcon className="size-3.5 text-primary" />
							Açık · Gönüllü · Türkçe
						</span>
						<h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
							Sosyal etki üreten girişimleri keşfet.
						</h1>
						<p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
							Türkiye ve dünyadan sosyal girişimleri alan, hedef kitle, ülke ve
							Sürdürülebilir Kalkınma Amaçları üzerinden tara.
						</p>
					</div>
					<form
						onSubmit={onSubmit}
						className="flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-border bg-background p-1.5 shadow-sm focus-within:border-primary/50 focus-within:shadow-md"
					>
						<div className="relative flex-1">
							<SearchIcon
								className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
								aria-hidden="true"
							/>
							<Input
								value={query}
								onChange={(event) => onQueryChange(event.target.value)}
								placeholder="Gıda israfı, erişilebilirlik, eğitim..."
								className="h-11 border-0 pl-10 shadow-none focus-visible:ring-0"
							/>
						</div>
						<Button type="submit" size="lg" className="h-11">
							Ara
							<ArrowRightIcon />
						</Button>
					</form>
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-xs text-muted-foreground">Popüler aramalar:</span>
						{POPULAR_CATEGORIES.map((item) => (
							<Button
								key={item.label}
								asChild
								variant="outline"
								size="sm"
								className="h-7 rounded-full"
							>
								<Link to={`/arama?categories=${item.categoryId}`}>{item.label}</Link>
							</Button>
						))}
					</div>
				</div>

				<div className="hidden lg:block">
					<HeroPreview stats={data?.stats} featured={data?.featured ?? []} />
				</div>
			</div>
		</section>
	)
}

interface HeroPreviewProps {
	stats?: SiteStats
	featured: ReadonlyArray<{ name: string; slug: string }>
}

function HeroPreview({ stats, featured }: HeroPreviewProps) {
	const [hovered, setHovered] = useState<SdgMeta | null>(null)
	const [tickerIndex, setTickerIndex] = useState(0)

	useEffect(() => {
		if (featured.length === 0) return
		const interval = setInterval(() => {
			setTickerIndex((i) => (i + 1) % featured.length)
		}, 3500)
		return () => clearInterval(interval)
	}, [featured.length])

	const current = featured[tickerIndex]

	return (
		<div className="relative mx-auto flex w-full max-w-md flex-col gap-4">
			<div className="flex items-center justify-between">
				<span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase backdrop-blur">
					<span className="size-1.5 animate-pulse rounded-full bg-success" />
					17 hedef · canlı rehber
				</span>
				{hovered && (
					<span className="text-[11px] font-medium text-foreground tabular-nums">
						{hovered.id}. {hovered.name}
					</span>
				)}
			</div>

			<div
				className="grid grid-cols-5 gap-2"
				onMouseLeave={() => setHovered(null)}
			>
				{SDG_DATA.map((sdg, index) => (
					<Link
						key={sdg.id}
						to={`/arama?sdgs=${sdg.id}`}
						title={`${sdg.id}. ${sdg.name}`}
						onMouseEnter={() => setHovered(sdg)}
						className="group relative flex aspect-square animate-in fade-in zoom-in-95 items-center justify-center overflow-hidden rounded-xl text-white transition-all duration-300 ease-out hover:z-10 hover:scale-110 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						style={{
							background: sdg.color,
							animationDelay: `${index * 40}ms`,
							animationFillMode: 'both',
						}}
					>
						<span className="relative z-10 text-base font-bold tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
							{sdg.id}
						</span>
						<span className="pointer-events-none absolute inset-0 bg-foreground/0 transition group-hover:bg-foreground/10" />
					</Link>
				))}
				<Link
					to="/arama"
					className="group col-span-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<div className="flex items-center gap-2.5">
						<Logomark animated className="size-7" />
						<div className="flex flex-col leading-tight">
							<span className="text-sm font-semibold">
								{stats?.enterprises ?? '—'} girişim
							</span>
							<span className="text-[10px] text-muted-foreground">
								{stats?.countries ?? '—'} ülkeden, 17 SKA
							</span>
						</div>
					</div>
					<ArrowRightIcon className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
				</Link>
			</div>

			<div className="flex items-center gap-2 rounded-xl border border-border bg-card/40 px-3 py-2 text-xs">
				<SparklesIcon className="size-3.5 shrink-0 text-primary" />
				<span className="text-muted-foreground">Şu an öne çıkan:</span>
				{current ? (
					<Link
						to={`/girisimler/${current.slug}`}
						className="truncate font-semibold transition hover:text-primary"
						key={current.slug}
					>
						<span className="animate-in fade-in slide-in-from-bottom-1 duration-500">
							{current.name}
						</span>
					</Link>
				) : (
					<span className="text-muted-foreground">—</span>
				)}
			</div>
		</div>
	)
}

interface HomeContentProps {
	data: HomePayload
}

function HomeContent({ data }: HomeContentProps) {
	const lead = data.featured[0]
	const compact = data.featured.slice(1, 4)

	return (
		<>
			<section className="grid grid-cols-2 divide-x divide-border border-y border-border md:grid-cols-4">
				<Stat label="Girişim" value={`${data.stats.enterprises}+`} />
				<Stat label="Ülke" value={`${data.stats.countries}+`} />
				<Stat label="Kategori" value={String(data.stats.categories)} />
				<Stat label="SKA" value={String(data.stats.sdgs)} />
			</section>

			{data.featured.length > 0 && (
				<section className="flex flex-col gap-8">
					<div className="flex items-end justify-between gap-4">
						<div className="flex flex-col gap-2">
							<span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
								Editörden
							</span>
							<h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
								Haftanın girişimleri
							</h2>
						</div>
						<Button asChild variant="ghost" size="sm">
							<Link to="/arama">
								Tümünü gör
								<ArrowRightIcon className="size-4" />
							</Link>
						</Button>
					</div>
					{lead && compact.length > 0 ? (
						<div className="grid gap-4 lg:grid-cols-2">
							<EnterpriseCardLead enterprise={lead} />
							<div className="flex flex-col gap-3">
								{compact.map((item) => (
									<EnterpriseCardCompact key={item.id} enterprise={item} />
								))}
							</div>
						</div>
					) : (
						<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
							{data.featured.map((enterprise) => (
								<EnterpriseCard key={enterprise.id} enterprise={enterprise} />
							))}
						</div>
					)}
				</section>
			)}

			{data.recent && data.recent.length > 0 && (
				<EnterpriseRowSection
					eyebrow="Yeni"
					title="Son eklenenler"
					items={data.recent}
					linkTo="/arama?sort=newest"
				/>
			)}

			{data.popular && data.popular.length > 0 && (
				<EnterpriseRowSection
					eyebrow="Popüler"
					title="En çok görüntülenenler"
					items={data.popular}
					linkTo="/arama"
				/>
			)}

			<section className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
						Alanlar
					</span>
					<h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
						Konuya göre keşfet
					</h2>
				</div>
				<div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
					{data.categories.slice(0, 6).map((category) => (
						<CategoryTile key={category.id} category={category} />
					))}
				</div>
			</section>
		</>
	)
}

interface EnterpriseRowSectionProps {
	eyebrow: string
	title: string
	items: ReadonlyArray<EnterpriseSummary>
	linkTo: string
}

function EnterpriseRowSection({ eyebrow, title, items, linkTo }: EnterpriseRowSectionProps) {
	return (
		<section className="flex flex-col gap-6">
			<div className="flex items-end justify-between gap-4">
				<div className="flex flex-col gap-2">
					<span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
						{eyebrow}
					</span>
					<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
				</div>
				<Button asChild variant="ghost" size="sm">
					<Link to={linkTo}>
						Tümünü gör
						<ArrowRightIcon className="size-4" />
					</Link>
				</Button>
			</div>
			<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{items.slice(0, 6).map((enterprise) => (
					<EnterpriseCard key={enterprise.id} enterprise={enterprise} />
				))}
			</div>
		</section>
	)
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col items-center gap-1 px-4 py-6 text-center">
			<span className="text-3xl font-semibold tracking-tight md:text-4xl">{value}</span>
			<span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
				{label}
			</span>
		</div>
	)
}

function CategoryTile({ category }: { category: CategoryWithCount }) {
	return (
		<Link
			to={`/arama?categories=${category.id}`}
			className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
		>
			<span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
				<TaxonomyIcon name={category.icon} className="size-5" />
			</span>
			<div className="flex flex-1 flex-col">
				<span className="text-base font-semibold">{category.name}</span>
				<span className="text-xs text-muted-foreground">
					{category.enterpriseCount} girişim
				</span>
			</div>
		</Link>
	)
}
