import { Card, CardContent } from '@/components/ui/card'

export function AboutPage() {
	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-8">
			<header className="flex flex-col gap-4">
				<p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">Hakkımızda</p>
				<h1 className="text-4xl font-semibold tracking-tight">Dağınık sosyal etki bilgisini düzenli bir rehbere dönüştürüyoruz.</h1>
			</header>
			<Card>
				<CardContent className="flex flex-col gap-5 p-8 text-lg leading-8 text-muted-foreground">
					<p>
						Sosyal Girişimler Rehberi, Türkiye’den ve dünyadan sosyal sorunlara yenilikçi çözümler
						üreten girişimleri kategorik olarak görünür kılmak için tasarlandı.
					</p>
					<p>
						Amacımız orijinal olanı görünür yapmak, karmaşık bilgiyi aydınlatmak ve farklı alanlara
						dağılmış girişimleri araştırmacılar, gençler, kurumlar ve gönüllüler için tek yerde
						toplamak.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
