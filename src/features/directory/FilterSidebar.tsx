import type { DirectoryMeta, TaxonomyItem } from '@/shared/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

type FilterSidebarProps = {
	meta: DirectoryMeta
	selected: URLSearchParams
	onToggle: (key: string, value: string) => void
}

export function FilterSidebar({ meta, selected, onToggle }: FilterSidebarProps) {
	return (
		<aside className="flex flex-col gap-6">
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
				title="İş modeli"
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
		</aside>
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

	return (
		<section className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<h3 className="text-sm font-semibold">{title}</h3>
				<Separator />
			</div>
			<div className="flex flex-col gap-3">
				{items.map((item) => (
					<label key={item.id} className="flex cursor-pointer items-center gap-3 text-sm">
						<Checkbox
							checked={values.has(item.id)}
							onCheckedChange={() => onToggle(param, item.id)}
							aria-label={item.name}
						/>
						<Label className="cursor-pointer font-normal leading-5">{item.name}</Label>
					</label>
				))}
			</div>
		</section>
	)
}
