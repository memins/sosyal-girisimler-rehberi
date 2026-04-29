import { ArrowUpRightIcon, GlobeIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { EnterpriseSummary } from '@/shared/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type EnterpriseCardProps = {
	enterprise: EnterpriseSummary
}

export function EnterpriseCard({ enterprise }: EnterpriseCardProps) {
	const primaryCountry = enterprise.countries[0]

	return (
		<Link to={`/girisimler/${enterprise.slug}`} className="group block focus-visible:outline-none">
			<Card className="h-full overflow-hidden transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-ring">
				<div className="flex h-36 items-center justify-center bg-secondary">
					{enterprise.coverKey ? (
						<img
							src={`/api/media/${enterprise.coverKey}`}
							alt=""
							className="size-full object-cover"
							loading="lazy"
						/>
					) : (
						<div className="flex size-20 items-center justify-center rounded-full bg-background text-2xl font-semibold text-primary">
							{enterprise.name.slice(0, 1)}
						</div>
					)}
				</div>
				<CardHeader>
					<div className="flex items-start justify-between gap-3">
						<div className="flex flex-col gap-2">
							<CardTitle className="text-xl">{enterprise.name}</CardTitle>
							<div className="flex flex-wrap gap-2">
								{primaryCountry ? (
									<Badge variant="secondary">
										<span aria-hidden="true">{primaryCountry.flag}</span>
										{primaryCountry.code}
									</Badge>
								) : (
									<Badge variant="secondary">
										<GlobeIcon data-icon="inline-start" />
										Global
									</Badge>
								)}
								{enterprise.categories.slice(0, 2).map((category) => (
									<Badge key={category.id} variant="outline">
										{category.name}
									</Badge>
								))}
							</div>
						</div>
						<ArrowUpRightIcon
							data-icon="inline-end"
							className="mt-1 text-muted-foreground transition group-hover:text-primary"
							aria-hidden="true"
						/>
					</div>
				</CardHeader>
				<CardContent>
					<p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
						{enterprise.shortDescription}
					</p>
				</CardContent>
			</Card>
		</Link>
	)
}
