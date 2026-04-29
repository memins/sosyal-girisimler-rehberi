import { ExternalLinkIcon, HeartIcon, Share2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEnterprise } from '@/lib/api'
import type { Enterprise } from '@/shared/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ErrorBlock, LoadingGrid } from '@/components/StateBlock'

export function EnterpriseDetailPage() {
	const { slug } = useParams()
	const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!slug) {
			return
		}

		getEnterprise(slug)
			.then(setEnterprise)
			.catch((currentError: Error) => setError(currentError.message))
	}, [slug])

	if (error) {
		return <ErrorBlock message={error} />
	}

	if (!slug) {
		return <ErrorBlock message="Girişim adresi eksik." />
	}

	if (!enterprise) {
		return <LoadingGrid />
	}

	return (
		<article className="mx-auto flex max-w-5xl flex-col gap-10">
			<header className="flex flex-col gap-6 rounded-[2rem] bg-card p-6 md:p-10">
				<Link to="/arama" className="text-sm text-muted-foreground hover:text-foreground">
					← Rehbere dön
				</Link>
				<div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
					<div className="flex flex-col gap-4">
						<div className="flex flex-wrap gap-2">
							{enterprise.countries.map((country) => (
								<Badge key={country.code} variant="secondary">
									<span aria-hidden="true">{country.flag}</span>
									{country.name}
								</Badge>
							))}
							{enterprise.categories.map((category) => (
								<Badge key={category.id} variant="outline">
									{category.name}
								</Badge>
							))}
						</div>
						<h1 className="text-4xl font-semibold tracking-tight md:text-6xl">{enterprise.name}</h1>
						<p className="max-w-3xl text-lg leading-8 text-muted-foreground">
							{enterprise.shortDescription}
						</p>
					</div>
					<div className="flex gap-2">
						<Button variant="outline">
							<HeartIcon data-icon="inline-start" />
							Kaydet
						</Button>
						<Button variant="outline">
							<Share2Icon data-icon="inline-start" />
							Paylaş
						</Button>
					</div>
				</div>
			</header>

			<div className="grid gap-6 md:grid-cols-3">
				<DetailCard title="Gündem" content={enterprise.problem} />
				<DetailCard title="Çözüm" content={enterprise.solution} />
				<DetailCard title="Sosyal etki" content={enterprise.impact} />
			</div>

			{enterprise.longContent ? (
				<section className="prose prose-neutral max-w-none rounded-2xl bg-card p-6 text-foreground">
					<p>{enterprise.longContent}</p>
				</section>
			) : null}

			<section className="grid gap-6 md:grid-cols-[1fr_320px]">
				<Card>
					<CardHeader>
						<CardTitle>BM Sürdürülebilir Kalkınma Amaçları</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-3">
						{enterprise.sdgs.map((sdg) => (
							<Badge key={sdg.id} variant="secondary" className="px-3 py-2">
								{sdg.id}. {sdg.name}
							</Badge>
						))}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>İrtibat</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						{enterprise.websiteUrl ? (
							<Button asChild variant="outline" className="justify-start">
								<a href={enterprise.websiteUrl} target="_blank" rel="noreferrer">
									<ExternalLinkIcon data-icon="inline-start" />
									Web sitesi
								</a>
							</Button>
						) : null}
						{enterprise.instagramUrl ? (
							<Button asChild variant="outline" className="justify-start">
								<a href={enterprise.instagramUrl} target="_blank" rel="noreferrer">
									<ExternalLinkIcon data-icon="inline-start" />
									Instagram
								</a>
							</Button>
						) : null}
						<Separator />
						<p className="text-sm text-muted-foreground">
							Bu profilde eksik veya hatalı bilgi görürseniz geri bildirim gönderebilirsiniz.
						</p>
					</CardContent>
				</Card>
			</section>
		</article>
	)
}

type DetailCardProps = {
	title: string
	content: string
}

function DetailCard({ title, content }: DetailCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="leading-7 text-muted-foreground">{content}</p>
			</CardContent>
		</Card>
	)
}
