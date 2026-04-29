import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const popularLinks = [
	{ to: '/arama', label: 'Tüm rehber' },
	{ to: '/girisim-ekle', label: 'Girişim öner' },
	{ to: '/hakkimizda', label: 'Hakkımızda' },
]

export default function NotFoundPage() {
	return (
		<div className="flex flex-col items-center justify-center gap-8 py-16 text-center">
			<div className="space-y-3">
				<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
					404
				</p>
				<h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
					Aradığın sayfa bulunamadı
				</h1>
				<p className="mx-auto max-w-md text-base text-muted-foreground">
					Bağlantı geçersiz olabilir ya da içerik kaldırılmış olabilir. Aşağıdaki
					sayfalardan biri yardımcı olabilir.
				</p>
			</div>
			<div className="flex flex-wrap items-center justify-center gap-2">
				<Button asChild>
					<Link to="/">Ana sayfaya dön</Link>
				</Button>
				{popularLinks.map((link) => (
					<Button key={link.to} asChild variant="outline">
						<Link to={link.to}>{link.label}</Link>
					</Button>
				))}
			</div>
		</div>
	)
}
