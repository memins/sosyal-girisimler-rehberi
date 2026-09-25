import { Loader2Icon, WandSparklesIcon } from 'lucide-react'
import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EnterpriseFormValues } from '@/features/admin/schemas/enterprise'
import { addEnterpriseGalleryItem, autofillEnterprise } from '@/lib/api'
import type { EnterpriseAutofillResult } from '@/shared/types'

interface EnterpriseAutofillProps {
	form: UseFormReturn<EnterpriseFormValues>
	/** Set in edit mode: gallery images are attached to the saved enterprise directly. */
	enterpriseId?: string
	onGalleryChanged?: () => void
}

const TEXT_FIELDS = [
	'name',
	'shortDescription',
	'problem',
	'solution',
	'impact',
	'longContent',
	'websiteUrl',
	'instagramUrl',
] as const
const LIST_FIELDS = [
	'categoryIds',
	'audienceIds',
	'businessModelIds',
	'countryCodes',
	'sdgIds',
] as const

export function EnterpriseAutofill({ form, enterpriseId, onGalleryChanged }: EnterpriseAutofillProps) {
	const [websiteUrl, setWebsiteUrl] = useState(() => form.getValues('websiteUrl') ?? '')
	const [instagramUrl, setInstagramUrl] = useState(() => form.getValues('instagramUrl') ?? '')
	const [onlyEmpty, setOnlyEmpty] = useState(Boolean(enterpriseId))
	const [loading, setLoading] = useState(false)

	async function handleAutofill() {
		setLoading(true)
		try {
			const result = await autofillEnterprise({
				websiteUrl: websiteUrl.trim() || undefined,
				instagramUrl: instagramUrl.trim() || undefined,
			})
			const filled = applyResult(result)
			const images = await applyImages(result)
			toast.success(`${filled} alan dolduruldu${images > 0 ? `, ${images} görsel eklendi` : ''}. Kaydetmeden önce kontrol et.`)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Otomatik doldurma başarısız.')
		} finally {
			setLoading(false)
		}
	}

	function applyResult(result: EnterpriseAutofillResult): number {
		let filled = 0
		const options = { shouldDirty: true, shouldValidate: false }
		for (const field of TEXT_FIELDS) {
			const next = result[field]
			if (!next) continue
			if (onlyEmpty && String(form.getValues(field) ?? '').trim().length > 0) continue
			form.setValue(field, next, options)
			filled += 1
		}
		for (const field of LIST_FIELDS) {
			const next = result[field] as Array<string & number>
			if (next.length === 0) continue
			if (onlyEmpty && (form.getValues(field) ?? []).length > 0) continue
			form.setValue(field, next, options)
			filled += 1
		}
		return filled
	}

	async function applyImages(result: EnterpriseAutofillResult): Promise<number> {
		const options = { shouldDirty: true }
		if (result.logoKey && !form.getValues('logoKey')) {
			form.setValue('logoKey', result.logoKey, options)
		}
		if (result.imageKeys.length === 0) return 0
		if (enterpriseId) {
			for (const key of result.imageKeys) {
				await addEnterpriseGalleryItem(enterpriseId, { key })
			}
			onGalleryChanged?.()
		} else {
			const current = form.getValues('gallery') ?? []
			const known = new Set(current.map((item) => item.key))
			form.setValue(
				'gallery',
				[...current, ...result.imageKeys.filter((key) => !known.has(key)).map((key) => ({ key }))],
				options,
			)
		}
		return result.imageKeys.length
	}

	return (
		<section
			aria-labelledby="autofill-title"
			className="flex flex-col gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5"
		>
			<div className="flex items-start gap-3">
				<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
					<WandSparklesIcon className="size-4" aria-hidden="true" />
				</span>
				<div className="flex flex-col gap-0.5">
					<h2 id="autofill-title" className="text-base font-semibold tracking-tight">
						Bağlantıdan otomatik doldur
					</h2>
					<p className="text-sm text-muted-foreground">
						Web sitesi ve/veya Instagram hesabı Apify ile taranır, Gemini içerikleri forma yerleştirir.
						Görseller AVIF olarak galeriye eklenir. İşlem 30–90 saniye sürebilir.
					</p>
				</div>
			</div>
			<div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="autofill-website">Web sitesi</Label>
					<Input
						id="autofill-website"
						type="url"
						placeholder="https://"
						value={websiteUrl}
						onChange={(event) => setWebsiteUrl(event.target.value)}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="autofill-instagram">Instagram</Label>
					<Input
						id="autofill-instagram"
						placeholder="https://instagram.com/... ya da @kullanici"
						value={instagramUrl}
						onChange={(event) => setInstagramUrl(event.target.value)}
					/>
				</div>
				<Button
					type="button"
					onClick={handleAutofill}
					disabled={loading || (!websiteUrl.trim() && !instagramUrl.trim())}
				>
					{loading ? <Loader2Icon className="animate-spin" /> : <WandSparklesIcon />}
					{loading ? 'Taranıyor…' : 'Doldur'}
				</Button>
			</div>
			<div className="flex items-center gap-2">
				<Checkbox
					id="autofill-only-empty"
					checked={onlyEmpty}
					onCheckedChange={(value) => setOnlyEmpty(value === true)}
				/>
				<Label htmlFor="autofill-only-empty" className="text-sm font-normal">
					Yalnızca boş alanları doldur
				</Label>
			</div>
		</section>
	)
}
