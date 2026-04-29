import { PageHeader } from '@/components/layout/page-header'

type LegalKind = 'privacy' | 'terms' | 'contact'

interface LegalPageProps {
	kind: LegalKind
}

const content: Record<
	LegalKind,
	{ eyebrow: string; title: string; description: string; body: string }
> = {
	privacy: {
		eyebrow: 'Yasal',
		title: 'Gizlilik politikası',
		description:
			'Bu sayfa hazırlanıyor. Sosyal Girişimler Rehberi yalnızca gerekli verileri toplar ve üçüncü taraflarla paylaşmaz.',
		body: 'Yayına alındığında veri toplama, çerez kullanımı ve haklarınız hakkında ayrıntılı bilgi burada yer alacaktır.',
	},
	terms: {
		eyebrow: 'Yasal',
		title: 'Kullanım koşulları',
		description:
			'Bu sayfa hazırlanıyor. Rehber içeriğini kullanırken uyulması beklenen koşulları yakında burada bulabileceksiniz.',
		body: 'İçerik lisansı, kullanıcı katkıları ve sorumluluk reddi maddeleri yayına alındığında yer alacaktır.',
	},
	contact: {
		eyebrow: 'İletişim',
		title: 'Bize ulaşın',
		description:
			'Geri bildirim, iş birliği veya destek için iletişim kanalları yakında burada listelenecek.',
		body: 'Şu an için önerilerinizi e-posta ile iletebilirsiniz: hello@sosyalgirisim.org',
	},
}

export default function LegalPage({ kind }: LegalPageProps) {
	const { eyebrow, title, description, body } = content[kind]
	return (
		<div className="mx-auto max-w-3xl space-y-8">
			<PageHeader eyebrow={eyebrow} title={title} description={description} />
			<div className="prose prose-neutral max-w-none dark:prose-invert">
				<p>{body}</p>
			</div>
		</div>
	)
}
