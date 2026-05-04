import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/page-header'
import type { TaxonomyType } from '@/shared/types'
import { TaxonomySection } from './TaxonomySection'

const TABS: Array<{ value: TaxonomyType; label: string; description: string; hasIcon: boolean }> = [
	{
		value: 'categories',
		label: 'Kategoriler',
		description: 'Girişimleri konuya göre sınıflandıran ana etiketler.',
		hasIcon: true,
	},
	{
		value: 'audiences',
		label: 'Hedef kitle',
		description: 'Girişimin yöneldiği grup ya da topluluk.',
		hasIcon: true,
	},
	{
		value: 'business-models',
		label: 'Kurum türü',
		description: 'Girişimin organizasyon biçimi (sosyal girişim, kooperatif, vb.).',
		hasIcon: false,
	},
]

const TAB_VALUES = TABS.map((t) => t.value)

function isTaxonomyType(value: string | null): value is TaxonomyType {
	return value !== null && (TAB_VALUES as Array<string>).includes(value)
}

export function TaxonomyPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const tabParam = searchParams.get('tab')
	const active: TaxonomyType = isTaxonomyType(tabParam) ? tabParam : 'categories'
	const current = TABS.find((t) => t.value === active) ?? TABS[0]

	useEffect(() => {
		if (!tabParam) {
			const next = new URLSearchParams(searchParams)
			next.set('tab', 'categories')
			setSearchParams(next, { replace: true })
		}
	}, [tabParam, searchParams, setSearchParams])

	function handleTabChange(value: string) {
		const next = new URLSearchParams(searchParams)
		next.set('tab', value)
		setSearchParams(next, { replace: true })
	}

	return (
		<div className="flex flex-col gap-8">
			<PageHeader
				eyebrow="Yönetim"
				title="Sınıflandırma"
				description="Kategoriler, hedef kitleler ve iş modellerini buradan yönet — yeni öğe ekle, düzenle veya kullanılmayanları sil."
			/>
			<Tabs value={active} onValueChange={handleTabChange}>
				<TabsList>
					{TABS.map((tab) => (
						<TabsTrigger key={tab.value} value={tab.value}>
							{tab.label}
						</TabsTrigger>
					))}
				</TabsList>
				{TABS.map((tab) => (
					<TabsContent key={tab.value} value={tab.value} className="mt-6">
						<TaxonomySection
							type={tab.value}
							label={tab.label}
							description={current.description}
							hasIcon={tab.hasIcon}
						/>
					</TabsContent>
				))}
			</Tabs>
		</div>
	)
}
