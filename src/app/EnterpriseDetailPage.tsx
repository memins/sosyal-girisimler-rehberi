import {
	AlertCircleIcon,
	AtSignIcon,
	ExternalLinkIcon,
	HeartIcon,
	LightbulbIcon,
	LinkIcon,
	Loader2Icon,
	PencilIcon,
	Share2Icon,
	SparklesIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { getEnterprise, submitEditSuggestion } from '@/lib/api'
import type { EnterpriseDetail } from '@/shared/types'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { ErrorBlock, RouteFallback } from '@/components/StateBlock'
import { EnterpriseCard } from '@/features/directory/EnterpriseCard'

const SAVED_KEY = 'sgr:saved'

export function EnterpriseDetailPage() {
	const { slug } = useParams()
	const [enterprise, setEnterprise] = useState<EnterpriseDetail | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [saved, setSaved] = useState(false)

	useEffect(() => {
		if (!slug) return
		setEnterprise(null)
		setError(null)
		getEnterprise(slug)
			.then(setEnterprise)
			.catch((err: Error) => setError(err.message))
	}, [slug])

	useEffect(() => {
		if (!slug) return
		setSaved(readSaved().includes(slug))
	}, [slug])

	function toggleSaved() {
		if (!slug) return
		const list = readSaved()
		const next = list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]
		localStorage.setItem(SAVED_KEY, JSON.stringify(next))
		setSaved(next.includes(slug))
		toast.success(next.includes(slug) ? 'Kaydedilenlere eklendi' : 'Kaydedilenlerden çıkarıldı')
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(window.location.href)
			toast.success('Bağlantı kopyalandı')
		} catch {
			toast.error('Bağlantı kopyalanamadı')
		}
	}

	if (error) return <ErrorBlock message={error} />
	if (!slug) return <ErrorBlock message="Girişim adresi eksik." />
	if (!enterprise) return <RouteFallback />

	const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
	const shareText = `${enterprise.name} — ${enterprise.shortDescription}`

	return (
		<article className="flex flex-col gap-16">
			<header className="flex flex-col gap-6">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/">Ana sayfa</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/arama">Rehber</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{enterprise.name}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
					<div className="flex flex-col gap-4">
						<div className="flex flex-wrap gap-2">
							{enterprise.countries.map((country) => (
								<Badge key={country.code} variant="secondary" className="gap-1.5">
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
						<h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
							{enterprise.name}
						</h1>
						<p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
							{enterprise.shortDescription}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button variant={saved ? 'default' : 'outline'} onClick={toggleSaved}>
							<HeartIcon className={saved ? 'fill-current' : ''} />
							{saved ? 'Kaydedildi' : 'Kaydet'}
						</Button>
						<EditSuggestionButton enterpriseSlug={enterprise.slug} enterpriseName={enterprise.name} />
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline">
									<Share2Icon />
									Paylaş
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={copyLink}>
									<LinkIcon className="size-4" />
									Bağlantıyı kopyala
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<a
										href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
										target="_blank"
										rel="noreferrer"
									>
										WhatsApp
									</a>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<a
										href={`https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
										target="_blank"
										rel="noreferrer"
									>
										X (Twitter)
									</a>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<a
										href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
										target="_blank"
										rel="noreferrer"
									>
										LinkedIn
									</a>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</header>

			<div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_320px]">
				<div className="flex flex-col gap-12">
					<DetailSection
						accent="bg-destructive/15 text-destructive"
						icon={AlertCircleIcon}
						title="Çalışma alanı"
						body={enterprise.problem}
					/>
					<DetailSection
						accent="bg-warning/20 text-warning"
						icon={LightbulbIcon}
						title="Çözüm yöntemi"
						body={enterprise.solution}
					/>
					<DetailSection
						accent="bg-primary/15 text-primary"
						icon={SparklesIcon}
						title="Sosyal etki"
						body={enterprise.impact}
					/>
					{enterprise.longContent && (
						<section className="prose prose-neutral max-w-none dark:prose-invert">
							<p>{enterprise.longContent}</p>
						</section>
					)}
				</div>

				<aside className="md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] md:self-start md:overflow-y-auto">
					<EnterpriseFactsCard enterprise={enterprise} />
				</aside>
			</div>

			{enterprise.gallery && enterprise.gallery.length > 0 && (
				<section className="flex flex-col gap-6">
					<div className="flex flex-col gap-2">
						<span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
							Galeri
						</span>
						<h2 className="text-2xl font-semibold tracking-tight">
							Çalışmalarından kareler
						</h2>
					</div>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{enterprise.gallery.map((item) => (
							<figure
								key={item.key}
								className="flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card"
							>
								<div className="aspect-[4/3] overflow-hidden bg-secondary">
									<img
										src={`/api/media/${item.key}`}
										alt={item.caption ?? enterprise.name}
										className="size-full object-cover transition duration-500 hover:scale-105"
										loading="lazy"
										decoding="async"
									/>
								</div>
								{item.caption && (
									<figcaption className="px-3 pb-3 text-xs leading-relaxed text-muted-foreground">
										{item.caption}
									</figcaption>
								)}
							</figure>
						))}
					</div>
				</section>
			)}

			{enterprise.related.length > 0 && (
				<section className="flex flex-col gap-6">
					<div className="flex items-end justify-between">
						<div className="flex flex-col gap-2">
							<span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
								Benzer girişimler
							</span>
							<h2 className="text-2xl font-semibold tracking-tight">
								Aynı alandan keşfetmeye devam et
							</h2>
						</div>
						<Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
							<Link to="/arama">Rehbere dön</Link>
						</Button>
					</div>
					<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{enterprise.related.map((related) => (
							<EnterpriseCard key={related.id} enterprise={related} />
						))}
					</div>
				</section>
			)}
		</article>
	)
}

interface DetailSectionProps {
	accent: string
	icon: typeof AlertCircleIcon
	title: string
	body: string
}

function DetailSection({ accent, icon: Icon, title, body }: DetailSectionProps) {
	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<span
					className={`inline-flex size-10 items-center justify-center rounded-full ${accent}`}
					aria-hidden="true"
				>
					<Icon className="size-5" />
				</span>
				<h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
			</div>
			<p className="max-w-2xl text-base leading-relaxed text-foreground/85">{body}</p>
		</section>
	)
}

function EnterpriseFactsCard({ enterprise }: { enterprise: EnterpriseDetail }) {
	return (
		<div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
			{(enterprise.websiteUrl || enterprise.instagramUrl) && (
				<div className="flex flex-col gap-2">
					{enterprise.websiteUrl && (
						<Button asChild variant="outline" className="justify-start" size="sm">
							<a href={enterprise.websiteUrl} target="_blank" rel="noreferrer">
								<ExternalLinkIcon />
								Web sitesi
							</a>
						</Button>
					)}
					{enterprise.instagramUrl && (
						<Button asChild variant="outline" className="justify-start" size="sm">
							<a href={enterprise.instagramUrl} target="_blank" rel="noreferrer">
								<AtSignIcon />
								Instagram
							</a>
						</Button>
					)}
				</div>
			)}

			<FactGroup label="Ülkeler">
				<div className="flex flex-wrap gap-1.5">
					{enterprise.countries.length > 0 ? (
						enterprise.countries.map((country) => (
							<Badge key={country.code} variant="secondary" className="gap-1">
								<span aria-hidden="true">{country.flag}</span>
								{country.name}
							</Badge>
						))
					) : (
						<span className="text-sm text-muted-foreground">—</span>
					)}
				</div>
			</FactGroup>

			<FactGroup label="Alanlar">
				<div className="flex flex-wrap gap-1.5">
					{enterprise.categories.map((category) => (
						<Badge key={category.id} variant="outline">
							{category.name}
						</Badge>
					))}
				</div>
			</FactGroup>

			{enterprise.businessModels.length > 0 && (
				<FactGroup label="Kurum türü">
					<div className="flex flex-wrap gap-1.5">
						{enterprise.businessModels.map((model) => (
							<Badge key={model.id} variant="outline">
								{model.name}
							</Badge>
						))}
					</div>
				</FactGroup>
			)}

			{enterprise.sdgs.length > 0 && (
				<FactGroup label="SKA uyumu">
					<div className="flex flex-wrap gap-1.5">
						{enterprise.sdgs.map((sdg) => (
							<span
								key={sdg.id}
								className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1 text-xs"
								title={sdg.name}
							>
								<span
									className="inline-block size-2 rounded-full"
									style={{ background: sdg.color }}
									aria-hidden="true"
								/>
								<span className="font-medium">{sdg.id}</span>
								<span className="text-muted-foreground">{sdg.name}</span>
							</span>
						))}
					</div>
				</FactGroup>
			)}

			<Separator />
			<p className="text-xs leading-relaxed text-muted-foreground">
				Bu profilde eksik ya da hatalı bilgi gördüysen geri bildirim göndermek için
				bize ulaş.
			</p>
		</div>
	)
}

function FactGroup({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
				{label}
			</span>
			{children}
		</div>
	)
}

function readSaved(): Array<string> {
	if (typeof window === 'undefined') return []
	try {
		const value = localStorage.getItem(SAVED_KEY)
		if (!value) return []
		const parsed = JSON.parse(value)
		return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []
	} catch {
		return []
	}
}

interface EditSuggestionButtonProps {
	enterpriseSlug: string
	enterpriseName: string
}

function EditSuggestionButton({ enterpriseSlug, enterpriseName }: EditSuggestionButtonProps) {
	const [open, setOpen] = useState(false)
	const [message, setMessage] = useState('')
	const [contactEmail, setContactEmail] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [done, setDone] = useState(false)

	function reset() {
		setMessage('')
		setContactEmail('')
		setDone(false)
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (message.trim().length < 10) {
			toast.error('Mesaj en az 10 karakter olmalı.')
			return
		}
		setSubmitting(true)
		try {
			await submitEditSuggestion(enterpriseSlug, {
				message: message.trim(),
				contactEmail: contactEmail.trim() || undefined,
			})
			setDone(true)
			toast.success('Önerin alındı.')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Gönderilemedi.')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<>
			<Button variant="outline" onClick={() => setOpen(true)}>
				<PencilIcon />
				Düzenleme öner
			</Button>
			<Dialog
				open={open}
				onOpenChange={(value) => {
					setOpen(value)
					if (!value) {
						setTimeout(reset, 200)
					}
				}}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{enterpriseName} için düzenleme öner</DialogTitle>
						<DialogDescription>
							Yanlış veya eksik gördüğün bir bilgi varsa anlat. Editör ekibi inceler ve
							gerekli güncellemeleri yapar.
						</DialogDescription>
					</DialogHeader>
					{done ? (
						<div className="flex flex-col items-center gap-4 py-6 text-center">
							<span className="flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
								<SparklesIcon className="size-6" />
							</span>
							<div className="space-y-1">
								<p className="text-sm font-medium">Önerin editöre iletildi.</p>
								<p className="text-xs text-muted-foreground">
									Birkaç gün içinde inceleyecek ve gerekirse profili güncelleyeceğiz.
								</p>
							</div>
							<Button
								onClick={() => {
									setOpen(false)
									setTimeout(reset, 200)
								}}
							>
								Kapat
							</Button>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="flex flex-col gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-sm font-medium" htmlFor="edit-suggestion-message">
									Önerin <span className="text-destructive">*</span>
								</label>
								<Textarea
									id="edit-suggestion-message"
									rows={5}
									required
									minLength={10}
									value={message}
									onChange={(event) => setMessage(event.target.value)}
									placeholder="Hangi bilgi yanlış/eksik? Düzeltilmesini önerdiğin metin nedir?"
								/>
								<p className="text-xs text-muted-foreground">En az 10 karakter.</p>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-sm font-medium" htmlFor="edit-suggestion-email">
									İletişim e-postası <span className="text-muted-foreground">(opsiyonel)</span>
								</label>
								<Input
									id="edit-suggestion-email"
									type="email"
									value={contactEmail}
									onChange={(event) => setContactEmail(event.target.value)}
									placeholder="editor@example.com"
								/>
								<p className="text-xs text-muted-foreground">
									Sorumuz olursa bağlantı kurabilelim — yayınlanmaz.
								</p>
							</div>
							<DialogFooter>
								<Button type="submit" disabled={submitting}>
									{submitting ? (
										<>
											<Loader2Icon className="animate-spin" />
											Gönderiliyor…
										</>
									) : (
										'Gönder'
									)}
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>
		</>
	)
}
