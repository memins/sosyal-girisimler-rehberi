import {
	ArrowRightLeftIcon,
	Building2Icon,
	BookOpenIcon,
	BoxesIcon,
	DropletIcon,
	FishIcon,
	GlobeIcon,
	HandshakeIcon,
	HeartPulseIcon,
	InfinityIcon,
	type LucideIcon,
	ScaleIcon,
	SoupIcon,
	SunIcon,
	TreesIcon,
	TrendingUpIcon,
	UsersIcon,
	VenusAndMarsIcon,
	ZapIcon,
} from 'lucide-react'

export interface SdgMeta {
	id: number
	color: string
	name: string
	icon: LucideIcon
}

/**
 * The 17 UN Sustainable Development Goals — Türkçe isimler ve resmi renkleri
 * (https://www.globalgoals.org/). Yaklaşık ikon eşleşmeleri lucide-react'tan.
 */
export const SDG_DATA: ReadonlyArray<SdgMeta> = [
	{ id: 1, color: '#E5243B', name: 'Yoksulluğa Son', icon: UsersIcon },
	{ id: 2, color: '#DDA63A', name: 'Açlığa Son', icon: SoupIcon },
	{ id: 3, color: '#4C9F38', name: 'Sağlık ve Kaliteli Yaşam', icon: HeartPulseIcon },
	{ id: 4, color: '#C5192D', name: 'Nitelikli Eğitim', icon: BookOpenIcon },
	{ id: 5, color: '#FF3A21', name: 'Toplumsal Cinsiyet Eşitliği', icon: VenusAndMarsIcon },
	{ id: 6, color: '#26BDE2', name: 'Temiz Su ve Sıhhi Koşullar', icon: DropletIcon },
	{ id: 7, color: '#FCC30B', name: 'Erişilebilir ve Temiz Enerji', icon: SunIcon },
	{ id: 8, color: '#A21942', name: 'İnsana Yakışır İş ve Ekonomik Büyüme', icon: TrendingUpIcon },
	{ id: 9, color: '#FD6925', name: 'Sanayi, Yenilikçilik ve Altyapı', icon: BoxesIcon },
	{ id: 10, color: '#DD1367', name: 'Eşitsizliklerin Azaltılması', icon: ArrowRightLeftIcon },
	{ id: 11, color: '#FD9D24', name: 'Sürdürülebilir Şehirler ve Topluluklar', icon: Building2Icon },
	{ id: 12, color: '#BF8B2E', name: 'Sorumlu Üretim ve Tüketim', icon: InfinityIcon },
	{ id: 13, color: '#3F7E44', name: 'İklim Eylemi', icon: GlobeIcon },
	{ id: 14, color: '#0A97D9', name: 'Sudaki Yaşam', icon: FishIcon },
	{ id: 15, color: '#56C02B', name: 'Karasal Yaşam', icon: TreesIcon },
	{ id: 16, color: '#00689D', name: 'Barış, Adalet ve Güçlü Kurumlar', icon: ScaleIcon },
	{ id: 17, color: '#19486A', name: 'Amaçlar için Ortaklıklar', icon: HandshakeIcon },
]

export function getSdgMeta(id: number): SdgMeta | undefined {
	return SDG_DATA.find((sdg) => sdg.id === id)
}
