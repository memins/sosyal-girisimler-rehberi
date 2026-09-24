import { Link } from 'react-router-dom'
import { Container } from '@/components/layout/container'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logomark } from '@/components/logomark'
import { NewsletterForm } from '@/components/newsletter-form'

const sections = [
	{
		title: 'Keşfet',
		links: [
			{ label: 'Ana sayfa', to: '/' },
			{ label: 'Girişimler', to: '/arama' },
			{ label: 'Son eklenenler (RSS)', to: '/feed.xml', external: true },
		],
	},
	{
		title: 'Katkıda bulun',
		links: [
			{ label: 'Girişim ekle', to: '/girisim-ekle' },
			{ label: 'Hakkımızda', to: '/hakkimizda' },
			{ label: 'İletişim', to: '/iletisim' },
		],
	},
	{
		title: 'Yasal',
		links: [
			{ label: 'Gizlilik', to: '/gizlilik' },
			{ label: 'Kullanım koşulları', to: '/kosullar' },
		],
	},
]

export function Footer() {
	return (
		<footer className="mt-20 border-t border-border bg-card/40">
			<Container className="py-14">
				<div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
					<div className="flex flex-col gap-3">
						<Link to="/" className="group flex items-center gap-2.5 leading-none">
							<Logomark animated className="size-8" />
							<div className="flex flex-col gap-0.5">
								<span className="text-base font-semibold leading-none tracking-tight transition-colors group-hover:text-primary">
									Sosyal Girişimler
								</span>
								<span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
									Rehberi
								</span>
							</div>
						</Link>
						<p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
							Türkiye ve dünyadan sosyal girişimleri görünür kılan açık, gönüllü
							sürdürülen bir rehber.
						</p>
						<NewsletterForm />
					</div>
					{sections.map((section) => (
						<div key={section.title} className="flex flex-col gap-3">
							<h3 className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
								{section.title}
							</h3>
							<ul className="flex flex-col gap-2">
								{section.links.map((link) => (
									<li key={link.to}>
										{link.external ? (
											<a
												href={link.to}
												className="text-sm text-foreground/80 transition hover:text-primary"
											>
												{link.label}
											</a>
										) : (
											<Link
												to={link.to}
												className="text-sm text-foreground/80 transition hover:text-primary"
											>
												{link.label}
											</Link>
										)}
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
				<div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
					<p>© {new Date().getFullYear()} Sosyal Girişimler Rehberi · Açık kaynak</p>
					<div className="flex items-center gap-3">
						<span>Tema</span>
						<ThemeToggle />
					</div>
				</div>
			</Container>
		</footer>
	)
}
