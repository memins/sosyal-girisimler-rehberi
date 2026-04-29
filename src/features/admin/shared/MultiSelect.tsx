import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
	value: string
	label: string
	leading?: ReactNode
	hint?: string
}

interface MultiSelectProps {
	options: Array<MultiSelectOption>
	value: Array<string>
	onChange: (next: Array<string>) => void
	placeholder?: string
	searchPlaceholder?: string
	emptyMessage?: string
	disabled?: boolean
}

export function MultiSelect({
	options,
	value,
	onChange,
	placeholder = 'Seçim yap',
	searchPlaceholder = 'Ara…',
	emptyMessage = 'Sonuç yok',
	disabled,
}: MultiSelectProps) {
	const selectedOptions = value
		.map((val) => options.find((option) => option.value === val))
		.filter((option): option is MultiSelectOption => option !== undefined)

	function toggle(optionValue: string) {
		if (value.includes(optionValue)) {
			onChange(value.filter((v) => v !== optionValue))
		} else {
			onChange([...value, optionValue])
		}
	}

	function remove(optionValue: string, event: React.MouseEvent) {
		event.preventDefault()
		event.stopPropagation()
		onChange(value.filter((v) => v !== optionValue))
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					disabled={disabled}
					className="h-auto min-h-9 w-full justify-between gap-2 px-3 py-2"
				>
					<div className="flex flex-1 flex-wrap items-center gap-1">
						{selectedOptions.length === 0 ? (
							<span className="text-sm text-muted-foreground">{placeholder}</span>
						) : (
							selectedOptions.map((option) => (
								<Badge
									key={option.value}
									variant="secondary"
									className="gap-1 py-0.5 pl-2 pr-0.5"
								>
									{option.leading}
									<span className="text-xs">{option.label}</span>
									<span
										role="button"
										tabIndex={0}
										onClick={(event) => remove(option.value, event)}
										className="rounded-full p-0.5 text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
										aria-label={`${option.label} kaldır`}
									>
										<XIcon className="size-3" />
									</span>
								</Badge>
							))
						)}
					</div>
					<ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>{emptyMessage}</CommandEmpty>
						<CommandGroup>
							{options.map((option) => {
								const isSelected = value.includes(option.value)
								return (
									<CommandItem
										key={option.value}
										value={`${option.label} ${option.value}`}
										onSelect={() => toggle(option.value)}
									>
										<div className={cn('mr-2 flex size-4 items-center justify-center rounded-sm border border-border', isSelected && 'border-primary bg-primary text-primary-foreground')}>
											{isSelected && <CheckIcon className="size-3" />}
										</div>
										{option.leading && <span className="mr-2">{option.leading}</span>}
										<div className="flex flex-1 flex-col">
											<span className="text-sm">{option.label}</span>
											{option.hint && (
												<span className="text-[11px] text-muted-foreground">{option.hint}</span>
											)}
										</div>
									</CommandItem>
								)
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
