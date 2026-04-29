import { ClipboardCheckIcon, LayersIcon, MailIcon, RadarIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'

const PIPELINE = [
	{
		icon: RadarIcon,
		title: 'Topla',
		description:
			'Açık çağrı, gönüllü öneri ve editör araştırması ile yeni girişimleri keşfederiz.',
	},
	{
		icon: ClipboardCheckIcon,
		title: 'Doğrula',
		description:
			'Her girişim editör ekibimiz tarafından kaynaklarıyla birlikte gözden geçirilir.',
	},
	{
		icon: LayersIcon,
		title: 'Yayınla',
		description:
			'Etiketler, ülke bilgisi ve SKA uyumuyla zenginleştirilen profil rehberde yayınlanır.',
	},
]

const FAQ = [
	{
		q: 'Bu rehber kim için?',
		a: 'Araştırmacılar, gençler, sivil toplum çalışanları, gazeteciler ve sosyal etkiye ilgi duyan herkes için.',
	},
	{
		q: 'Bilgi ücretsiz mi?',
		a: 'Evet. Rehber tamamen açık ve ücretsizdir. İçerik gönüllüler ve editörlerle birlikte güncellenir.',
	},
	{
		q: 'Bir girişimi nasıl önerebilirim?',
		a: 'Üst menüden “Girişim ekle” butonu ile basit bir form üzerinden öneride bulunabilirsin. Editör ekibi 7 gün içinde inceler.',
	},
	{
		q: 'Bilgilerimi düzenletebilir miyim?',
		a: 'Profilinde hatalı veya eksik bilgi olduğunu fark edersen iletişim sayfasından bize ulaşabilirsin.',
	},
]

export function AboutPage() {
	return (
		<div className="flex flex-col gap-20">
			<PageHeader
				eyebrow="Hakkımızda"
				title="Sosyal etki bilgisini düzenli bir rehbere dönüştürüyoruz"
				description="Dağınık biçimde anlatılan sosyal girişim hikayelerini ortak bir çatı altında toplayarak araştırmayı kolaylaştırıyoruz."
			/>

			<section className="grid gap-10 md:grid-cols-2">
				<div className="flex flex-col gap-4">
					<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
						Neden bu rehber?
					</h2>
					<p className="text-base leading-relaxed text-muted-foreground">
						Türkiye’de ve dünyada sosyal sorunlara yenilikçi çözümler üreten girişimler
						çoğu zaman birbirinden bağımsız haber, podcast veya rapor başlıklarında
						kalıyor. Sosyal Girişimler Rehberi bu içerikleri tek bir akışta toplamak,
						ortak bir dil ve etiket setiyle aranabilir kılmak için kuruldu.
					</p>
					<p className="text-base leading-relaxed text-muted-foreground">
						İçerik açık erişimli, gönüllüler tarafından sürdürülen ve editör onayından
						geçen bir veri tabanına dayanır.
					</p>
				</div>
				<div className="rounded-2xl border border-border bg-card p-6">
					<span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
						Hızlı bakış
					</span>
					<dl className="mt-6 grid grid-cols-2 gap-6">
						<Stat label="Açık" value="100%" />
						<Stat label="Gönüllü" value="∞" />
						<Stat label="Türkçe" value="TR" />
						<Stat label="Editör onaylı" value="✓" />
					</dl>
				</div>
			</section>

			<section className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
						Süreç
					</span>
					<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
						Nasıl çalışır?
					</h2>
				</div>
				<div className="grid gap-4 md:grid-cols-3">
					{PIPELINE.map((step) => (
						<div
							key={step.title}
							className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
						>
							<span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<step.icon className="size-5" />
							</span>
							<h3 className="text-lg font-semibold">{step.title}</h3>
							<p className="text-sm leading-relaxed text-muted-foreground">
								{step.description}
							</p>
						</div>
					))}
				</div>
			</section>

			<section className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
						SSS
					</span>
					<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
						Sıkça sorulan sorular
					</h2>
				</div>
				<Accordion type="single" collapsible className="w-full">
					{FAQ.map((item, index) => (
						<AccordionItem key={item.q} value={`item-${index}`}>
							<AccordionTrigger className="text-left text-base font-medium">
								{item.q}
							</AccordionTrigger>
							<AccordionContent className="text-sm leading-relaxed text-muted-foreground">
								{item.a}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</section>

			<section className="rounded-3xl border border-border bg-primary/5 p-8 md:p-12">
				<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
					<div className="flex flex-col gap-3">
						<span className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
							İletişim
						</span>
						<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
							Birlikte çalışmak ister misin?
						</h2>
						<p className="max-w-xl text-base leading-relaxed text-muted-foreground">
							Bilgi paylaşmak, içerik önermek veya iş birliği yapmak için bize yaz.
							Editör ekibimiz tüm mesajlara dönmeye çalışır.
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button asChild>
							<a href="mailto:hello@sosyalgirisim.org">
								<MailIcon />
								E-posta gönder
							</a>
						</Button>
						<Button asChild variant="outline">
							<Link to="/girisim-ekle">Girişim öner</Link>
						</Button>
					</div>
				</div>
			</section>
		</div>
	)
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-1">
			<dt className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
				{label}
			</dt>
			<dd className="text-2xl font-semibold tracking-tight">{value}</dd>
		</div>
	)
}
