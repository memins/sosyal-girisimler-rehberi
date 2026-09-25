import { ArrowUpRightIcon, GlobeIcon, PencilIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { usePublicAdmin } from '@/features/admin/state/usePublicAdmin'
import type { EnterpriseSummary } from '@/shared/types'
import { formatAddedAgo } from '@/lib/relative-time'
import { Badge } from '@/components/ui/badge'

interface EnterpriseCardProps {
	enterprise: EnterpriseSummary
	showAddedAt?: boolean
}

/**
 * Kart bağlantısı ile editör "Düzenle" bağlantısını kardeş olarak yerleştirir;
 * bir bağlantının içine başka etkileşimli öğe koymak geçersizdir ve ekran
 * okuyucularda ikisini birbirine karıştırır.
 */
function CardFrame({ enterprise, children }: { enterprise: EnterpriseSummary; children: ReactNode }) {
	const admin = usePublicAdmin()
	if (!admin) return children

	return (
		<div className="relative h-full">
			{children}
			<Link
				to={`/admin/enterprises/${enterprise.id}/edit`}
				aria-label={`${enterprise.name} düzenle`}
				className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-xs font-medium shadow"
			>
				<PencilIcon className="size-3" aria-hidden="true" />
				Düzenle
			</Link>
		</div>
	)
}

export function EnterpriseCard({ enterprise, showAddedAt = false }: EnterpriseCardProps) {
	const primaryCountry = enterprise.countries[0]
	const primaryBusinessModel = enterprise.businessModels?.[0]

	return (
		<CardFrame enterprise={enterprise}>
			<Link
				to={`/girisimler/${enterprise.slug}`}
				className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<div className="flex h-36 items-center justify-center overflow-hidden bg-secondary">
					{enterprise.coverKey ? (
						<img
							src={`/api/media/${enterprise.coverKey}`}
							alt=""
							className="size-full object-cover transition duration-500 group-hover:scale-105"
							loading="lazy"
							decoding="async"
						/>
					) : (
						<div className="flex size-20 items-center justify-center rounded-full bg-background text-2xl font-semibold text-primary" aria-hidden="true">
							{enterprise.name.slice(0, 1)}
						</div>
					)}
				</div>
				<div className="flex flex-1 flex-col gap-4 p-5">
					<div className="flex items-start justify-between gap-3">
						<div className="flex flex-col gap-2">
							<h3 className="text-lg font-semibold tracking-tight leading-tight">
								{enterprise.name}
							</h3>
							<div className="flex flex-wrap gap-1.5">
								{primaryCountry ? (
									<Badge variant="secondary" className="gap-1">
										<span aria-hidden="true">{primaryCountry.flag}</span>
										{primaryCountry.code}
									</Badge>
								) : (
									<Badge variant="secondary">
										<GlobeIcon className="size-3" />
										Global
									</Badge>
								)}
								{enterprise.categories.slice(0, 2).map((category) => (
									<Badge key={category.id} variant="outline">
										{category.name}
									</Badge>
								))}
								{primaryBusinessModel && (
									<Badge
										variant="outline"
										className="border-primary/40 bg-primary/10 text-primary"
									>
										{primaryBusinessModel.name}
									</Badge>
								)}
							</div>
						</div>
						<ArrowUpRightIcon
							className="mt-1 size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
							aria-hidden="true"
						/>
					</div>
					<p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
						{enterprise.shortDescription}
					</p>
					{showAddedAt && enterprise.createdAt ? (
						<p className="text-xs font-medium text-muted-foreground">
							{formatAddedAgo(enterprise.createdAt)}
						</p>
					) : null}
				</div>
			</Link>
		</CardFrame>
	)
}

export function EnterpriseCardLead({ enterprise }: EnterpriseCardProps) {
	const primaryCountry = enterprise.countries[0]
	const primaryBusinessModel = enterprise.businessModels?.[0]

	return (
		<CardFrame enterprise={enterprise}>
			<Link
				to={`/girisimler/${enterprise.slug}`}
				className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<div className="relative h-56 overflow-hidden bg-secondary md:h-72">
					{enterprise.coverKey ? (
						<img
							src={`/api/media/${enterprise.coverKey}`}
							alt=""
							className="size-full object-cover transition duration-500 group-hover:scale-105"
							loading="lazy"
							decoding="async"
						/>
					) : (
						<div className="flex size-full items-center justify-center text-5xl font-semibold text-primary" aria-hidden="true">
							{enterprise.name.slice(0, 1)}
						</div>
					)}
					<div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card via-card/40 to-transparent" />
				</div>
				<div className="flex flex-1 flex-col gap-4 p-6">
					<div className="flex flex-wrap gap-1.5">
						{primaryCountry && (
							<Badge variant="secondary" className="gap-1">
								<span aria-hidden="true">{primaryCountry.flag}</span>
								{primaryCountry.code}
							</Badge>
						)}
						{enterprise.categories.slice(0, 3).map((category) => (
							<Badge key={category.id} variant="outline">
								{category.name}
							</Badge>
						))}
						{primaryBusinessModel && (
							<Badge
								variant="outline"
								className="border-primary/40 bg-primary/10 text-primary"
							>
								{primaryBusinessModel.name}
							</Badge>
						)}
					</div>
					<div className="flex items-start justify-between gap-3">
						<h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
							{enterprise.name}
						</h3>
						<ArrowUpRightIcon
							className="mt-1 size-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
							aria-hidden="true"
						/>
					</div>
					<p className="line-clamp-3 text-base leading-relaxed text-muted-foreground">
						{enterprise.shortDescription}
					</p>
				</div>
			</Link>
		</CardFrame>
	)
}

export function EnterpriseCardCompact({ enterprise }: EnterpriseCardProps) {
	const primaryCountry = enterprise.countries[0]
	const primaryBusinessModel = enterprise.businessModels?.[0]

	return (
		<CardFrame enterprise={enterprise}>
			<Link
				to={`/girisimler/${enterprise.slug}`}
				className="group relative flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-primary/40 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
					{enterprise.logoKey || enterprise.coverKey ? (
						<img
							src={`/api/media/${enterprise.logoKey ?? enterprise.coverKey}`}
							alt=""
							className="size-full object-cover"
							loading="lazy"
							decoding="async"
						/>
					) : (
						<span className="text-xl font-semibold text-primary" aria-hidden="true">
							{enterprise.name.slice(0, 1)}
						</span>
					)}
				</div>
				<div className="flex flex-1 flex-col gap-1.5">
					<h4 className="text-sm font-semibold leading-tight">{enterprise.name}</h4>
					<div className="flex flex-wrap gap-1">
						{primaryCountry && (
							<Badge variant="secondary" className="gap-1 text-[10px]">
								<span aria-hidden="true">{primaryCountry.flag}</span>
								{primaryCountry.code}
							</Badge>
						)}
						{enterprise.categories.slice(0, 1).map((category) => (
							<Badge key={category.id} variant="outline" className="text-[10px]">
								{category.name}
							</Badge>
						))}
						{primaryBusinessModel && (
							<Badge
								variant="outline"
								className="border-primary/40 bg-primary/10 text-[10px] text-primary"
							>
								{primaryBusinessModel.name}
							</Badge>
						)}
					</div>
					<p className="line-clamp-2 text-xs text-muted-foreground">
						{enterprise.shortDescription}
					</p>
				</div>
				<ArrowUpRightIcon
					className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:text-primary"
					aria-hidden="true"
				/>
			</Link>
		</CardFrame>
	)
}
