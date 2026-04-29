import { ArrowRightIcon, ArrowUpRightIcon, SearchIcon, SparklesIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
	EnterpriseCard,
	EnterpriseCardCompact,
	EnterpriseCardLead,
} from '@/features/directory/EnterpriseCard'
import { getHome } from '@/lib/api'
import type { CategoryWithCount, EnterpriseSummary, HomePayload, SiteStats } from '@/shared/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErrorBlock, LoadingGrid } from '@/components/StateBlock'
import { TaxonomyIcon } from '@/lib/taxonomy-icon'

const SDG_PALETTE = [
	'#E5243B',
	'#DDA63A',
	'#4C9F38',
	'#C5192D',
	'#FF3A21',
	'#26BDE2',
	'#FCC30B',
	'#A21942',
	'#FD6925',
	'#DD1367',
	'#FD9D24',
	'#BF8B2E',
	'#3F7E44',
	'#0A97D9',
	'#56C02B',
	'#00689D',
	'#19486A',
] as const

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
	const lead = data?.featured?.[0]

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
					<HeroPreview lead={lead} stats={data?.stats} />
				</div>
			</div>
		</section>
	)
}

interface HeroPreviewProps {
	lead?: EnterpriseSummary
	stats?: SiteStats
}

function HeroPreview({ lead, stats }: HeroPreviewProps) {
	return (
		<div className="relative mx-auto aspect-[4/5] w-full max-w-md">
			<div className="pointer-events-none absolute -right-4 -top-4 grid grid-cols-6 gap-1.5 opacity-70">
				{SDG_PALETTE.slice(0, 12).map((color, index) => (
					<span
						key={index}
						className="size-2.5 rounded-full"
						style={{ background: color }}
						aria-hidden="true"
					/>
				))}
			</div>

			{stats && (
				<div className="absolute -left-2 top-10 z-20 flex -rotate-[4deg] items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs shadow-md">
					<span className="size-1.5 animate-pulse rounded-full bg-success" />
					<span className="font-semibold">{stats.enterprises}+</span>
					<span className="text-muted-foreground">girişim</span>
				</div>
			)}

			<div
				className="absolute right-2 top-10 h-[78%] w-[88%] rotate-[5deg] rounded-2xl border border-border bg-card/60 shadow-sm"
				aria-hidden="true"
			/>

			{lead ? (
				<Link
					to={`/girisimler/${lead.slug}`}
					className="group absolute inset-0 flex -rotate-[3deg] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl transition-all duration-500 hover:rotate-0 hover:shadow-2xl"
				>
					<div className="relative h-44 overflow-hidden bg-secondary">
						{lead.coverKey ? (
							<img
								src={`/api/media/${lead.coverKey}`}
								alt=""
								className="size-full object-cover transition duration-700 group-hover:scale-105"
								loading="eager"
							/>
						) : (
							<div className="flex size-full items-center justify-center text-6xl font-semibold text-primary">
								{lead.name.slice(0, 1)}
							</div>
						)}
						<div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
							<SparklesIcon className="size-3 text-primary" />
							Editörden
						</div>
					</div>
					<div className="flex flex-1 flex-col gap-3 p-5">
						<div className="flex flex-wrap gap-1.5">
							{lead.countries[0] && (
								<Badge variant="secondary" className="gap-1">
									<span aria-hidden="true">{lead.countries[0].flag}</span>
									{lead.countries[0].code}
								</Badge>
							)}
							{lead.categories.slice(0, 1).map((category) => (
								<Badge key={category.id} variant="outline">
									{category.name}
								</Badge>
							))}
						</div>
						<div className="flex items-start justify-between gap-3">
							<h3 className="text-lg font-semibold leading-tight tracking-tight">
								{lead.name}
							</h3>
							<ArrowUpRightIcon
								className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
								aria-hidden="true"
							/>
						</div>
						<p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
							{lead.shortDescription}
						</p>
					</div>
				</Link>
			) : (
				<div className="absolute inset-0 -rotate-[3deg] overflow-hidden rounded-2xl border border-dashed border-border bg-card/50">
					<div className="h-44 bg-secondary/60" />
					<div className="flex flex-col gap-3 p-5">
						<div className="h-4 w-2/3 rounded bg-muted/60" />
						<div className="h-3 w-full rounded bg-muted/40" />
						<div className="h-3 w-3/4 rounded bg-muted/40" />
					</div>
				</div>
			)}

			{stats && (
				<div className="absolute -right-3 bottom-8 z-20 flex rotate-[3deg] items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs shadow-md">
					<span className="font-semibold">{stats.countries}+</span>
					<span className="text-muted-foreground">ülke</span>
				</div>
			)}

			<div className="pointer-events-none absolute -bottom-6 left-6 flex gap-1 opacity-60">
				{SDG_PALETTE.slice(12, 17).map((color, index) => (
					<span
						key={index}
						className="size-2.5 rounded-full"
						style={{ background: color }}
						aria-hidden="true"
					/>
				))}
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
