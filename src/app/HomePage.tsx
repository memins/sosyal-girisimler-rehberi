import { ArrowRightIcon, SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EnterpriseCard } from '@/features/directory/EnterpriseCard'
import { getHome } from '@/lib/api'
import type { HomePayload } from '@/shared/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ErrorBlock, LoadingGrid } from '@/components/StateBlock'

export function HomePage() {
	const navigate = useNavigate()
	const [query, setQuery] = useState('')
	const [data, setData] = useState<HomePayload | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		getHome()
			.then(setData)
			.catch((currentError: Error) => setError(currentError.message))
	}, [])

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const params = new URLSearchParams()

		if (query.trim().length > 0) {
			params.set('query', query.trim())
		}

		navigate(`/arama?${params.toString()}`)
	}

	return (
		<div className="flex flex-col gap-20">
			<section className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-primary-foreground md:px-12 md:py-24">
				<div className="absolute inset-y-0 right-0 hidden w-1/2 opacity-20 md:block">
					<div className="size-full bg-[radial-gradient(circle_at_center,_var(--accent),_transparent_60%)]" />
				</div>
				<div className="relative flex max-w-3xl flex-col gap-8">
					<div className="flex flex-col gap-4">
						<p className="text-sm font-medium uppercase tracking-[0.3em] text-primary-foreground/75">
							sosyal.genclink.com
						</p>
						<h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
							Sosyal etki üreten girişimleri keşfet.
						</h1>
						<p className="max-w-2xl text-lg leading-8 text-primary-foreground/80">
							Türkiye’den ve dünyadan sosyal girişimleri alan, hedef kitle, ülke ve
							Sürdürülebilir Kalkınma Amaçları üzerinden tarayın.
						</p>
					</div>
					<form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-3 rounded-2xl bg-background p-2 shadow-xl md:flex-row">
						<div className="relative flex-1">
							<SearchIcon
								data-icon="inline-start"
								className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
								aria-hidden="true"
							/>
							<Input
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Gıda israfı, erişilebilirlik, eğitim..."
								className="h-12 border-0 pl-10 text-foreground shadow-none focus-visible:ring-0"
							/>
						</div>
						<Button type="submit" size="lg">
							Ara
							<ArrowRightIcon data-icon="inline-end" />
						</Button>
					</form>
				</div>
			</section>

			{error ? <ErrorBlock message={error} /> : null}
			{data ? <HomeContent data={data} /> : <LoadingGrid />}
		</div>
	)
}

type HomeContentProps = {
	data: HomePayload
}

function HomeContent({ data }: HomeContentProps) {
	return (
		<>
			<section className="grid gap-4 md:grid-cols-4">
				<StatCard label="Girişim" value={`${data.stats.enterprises}+`} />
				<StatCard label="Ülke" value={`${data.stats.countries}+`} />
				<StatCard label="Kategori" value={`${data.stats.categories}`} />
				<StatCard label="SKA" value={`${data.stats.sdgs}`} />
			</section>

			<section className="flex flex-col gap-6">
				<div className="flex items-end justify-between gap-4">
					<div>
						<h2 className="text-3xl font-semibold tracking-tight">Haftanın girişimleri</h2>
						<p className="mt-2 text-muted-foreground">Editörlerin öne çıkardığı sosyal etki örnekleri.</p>
					</div>
					<Button asChild variant="outline">
						<Link to="/arama">Tümünü gör</Link>
					</Button>
				</div>
				<div className="grid gap-5 md:grid-cols-3">
					{data.featured.map((enterprise) => (
						<EnterpriseCard key={enterprise.id} enterprise={enterprise} />
					))}
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				{data.categories.slice(0, 6).map((category) => (
					<Link
						key={category.id}
						to={`/arama?categories=${category.id}`}
						className="rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<p className="text-sm text-muted-foreground">Kategori</p>
						<h3 className="mt-2 text-xl font-semibold">{category.name}</h3>
					</Link>
				))}
			</section>
		</>
	)
}

type StatCardProps = {
	label: string
	value: string
}

function StatCard({ label, value }: StatCardProps) {
	return (
		<Card>
			<CardContent className="flex flex-col gap-2 p-6">
				<span className="text-4xl font-semibold">{value}</span>
				<span className="text-sm text-muted-foreground">{label}</span>
			</CardContent>
		</Card>
	)
}
