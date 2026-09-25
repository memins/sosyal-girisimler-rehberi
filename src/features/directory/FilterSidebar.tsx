import { useId } from 'react'
import type { DirectoryMeta, TaxonomyItem } from '@/shared/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

type FilterSidebarProps = {
	meta: DirectoryMeta
	selected: URLSearchParams
	onToggle: (key: string, value: string) => void
}

export function FilterSidebar({ meta, selected, onToggle }: FilterSidebarProps) {
	return (
		<div className="flex flex-col gap-6">
			<FilterGroup
				title="Alan"
				param="categories"
				items={meta.categories}
				selected={selected}
				onToggle={onToggle}
			/>
			<FilterGroup
				title="Hedef kitle"
				param="audiences"
				items={meta.audiences}
				selected={selected}
				onToggle={onToggle}
			/>
			<FilterGroup
				title="Kurum türü"
				param="businessModels"
				items={meta.businessModels}
				selected={selected}
				onToggle={onToggle}
			/>
			<FilterGroup
				title="Ülke"
				param="countries"
				items={meta.countries.map((country) => ({
					id: country.code,
					name: `${country.flag} ${country.name}`,
					sortOrder: country.sortOrder,
				}))}
				selected={selected}
				onToggle={onToggle}
			/>
			<FilterGroup
				title="SKA"
				param="sdgs"
				items={meta.sdgs.map((sdg) => ({
					id: String(sdg.id),
					name: `${sdg.id}. ${sdg.name}`,
					sortOrder: sdg.id,
				}))}
				selected={selected}
				onToggle={onToggle}
			/>
		</div>
	)
}

type FilterGroupProps = {
	title: string
	param: string
	items: Array<TaxonomyItem>
	selected: URLSearchParams
	onToggle: (key: string, value: string) => void
}

function FilterGroup({ title, param, items, selected, onToggle }: FilterGroupProps) {
	const values = new Set((selected.get(param) ?? '').split(',').filter(Boolean))
	// Masaüstü kenar çubuğu ve mobil çekmece aynı anda DOM'da olabilir; kimlikler çakışmasın.
	const idPrefix = useId()

	return (
		// fieldset/legend: ekran okuyucu her kutuyu grubuyla birlikte okur ("Ülke, Türkiye, işaretli").
		<fieldset className="flex min-w-0 flex-col gap-3">
			<legend className="mb-1 text-sm font-semibold">
				{title}
				{values.size > 0 ? <span className="sr-only">, {values.size} seçili</span> : null}
			</legend>
			<Separator />
			<div className="flex flex-col gap-3">
				{items.map((item) => {
					const id = `${idPrefix}-${item.id}`
					return (
						<div key={item.id} className="flex items-center gap-3 text-sm">
							<Checkbox
								id={id}
								checked={values.has(item.id)}
								onCheckedChange={() => onToggle(param, item.id)}
							/>
							<label htmlFor={id} className="cursor-pointer leading-5">
								{item.name}
							</label>
						</div>
					)
				})}
			</div>
		</fieldset>
	)
}
