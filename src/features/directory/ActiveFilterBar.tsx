import { XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DirectoryMeta } from '@/shared/types'

const FILTER_LABELS: Record<string, string> = {
	categories: 'Alan',
	audiences: 'Hedef kitle',
	businessModels: 'İş modeli',
	countries: 'Ülke',
	sdgs: 'SKA',
}

const FILTER_KEYS = ['categories', 'audiences', 'businessModels', 'countries', 'sdgs'] as const

interface ActiveFilterBarProps {
	meta: DirectoryMeta
	params: URLSearchParams
	onRemove: (key: string, value: string) => void
	onClear: () => void
}

export function ActiveFilterBar({ meta, params, onRemove, onClear }: ActiveFilterBarProps) {
	const chips = collectChips(meta, params)
	const query = params.get('query')?.trim() ?? ''
	const hasQuery = query.length > 0

	if (chips.length === 0 && !hasQuery) return null

	return (
		<div className="flex flex-wrap items-center gap-2">
			{hasQuery && (
				<Badge variant="secondary" className="gap-1.5 py-1.5 pl-3 pr-1">
					<span className="text-xs font-medium text-muted-foreground">Arama</span>
					<span className="text-sm">"{query}"</span>
					<button
						type="button"
						onClick={() => onRemove('query', query)}
						className="rounded-full p-0.5 text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
						aria-label="Aramayı temizle"
					>
						<XIcon className="size-3" />
					</button>
				</Badge>
			)}
			{chips.map((chip) => (
				<Badge key={`${chip.key}:${chip.value}`} variant="secondary" className="gap-1.5 py-1.5 pl-3 pr-1">
					<span className="text-xs font-medium text-muted-foreground">
						{FILTER_LABELS[chip.key]}
					</span>
					<span className="text-sm">{chip.label}</span>
					<button
						type="button"
						onClick={() => onRemove(chip.key, chip.value)}
						className="rounded-full p-0.5 text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
						aria-label={`${FILTER_LABELS[chip.key]} ${chip.label} kaldır`}
					>
						<XIcon className="size-3" />
					</button>
				</Badge>
			))}
			<Button variant="ghost" size="sm" onClick={onClear} className="ml-1">
				Tümünü temizle
			</Button>
		</div>
	)
}

interface Chip {
	key: string
	value: string
	label: string
}

function collectChips(meta: DirectoryMeta, params: URLSearchParams): Array<Chip> {
	const chips: Array<Chip> = []

	for (const key of FILTER_KEYS) {
		const value = params.get(key)
		if (!value) continue

		const values = value.split(',').filter(Boolean)
		for (const item of values) {
			const label = resolveLabel(meta, key, item)
			if (label) {
				chips.push({ key, value: item, label })
			}
		}
	}

	return chips
}

function resolveLabel(meta: DirectoryMeta, key: string, value: string): string | null {
	switch (key) {
		case 'categories':
			return meta.categories.find((c) => c.id === value)?.name ?? null
		case 'audiences':
			return meta.audiences.find((a) => a.id === value)?.name ?? null
		case 'businessModels':
			return meta.businessModels.find((m) => m.id === value)?.name ?? null
		case 'countries': {
			const country = meta.countries.find((c) => c.code === value)
			return country ? `${country.flag} ${country.name}` : null
		}
		case 'sdgs': {
			const sdg = meta.sdgs.find((s) => String(s.id) === value)
			return sdg ? `${sdg.id}. ${sdg.name}` : null
		}
		default:
			return null
	}
}
