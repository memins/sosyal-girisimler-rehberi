import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { deleteEnterprise, saveEnterprise } from '@/lib/api'
import type { Enterprise, EnterpriseStatus } from '@/shared/types'
import { Button } from '@/components/ui/button'
import { usePublicAdmin } from '@/features/admin/state/usePublicAdmin'

export function PublicEnterpriseActions({ enterprise }: { enterprise: Enterprise }) {
	const admin = usePublicAdmin()
	const navigate = useNavigate()
	const [isPending, setIsPending] = useState(false)

	if (!admin) return null

	async function updateStatus(status: EnterpriseStatus) {
		setIsPending(true)
		try {
			await saveEnterprise({
				id: enterprise.id,
				name: enterprise.name,
				slug: enterprise.slug,
				shortDescription: enterprise.shortDescription,
				problem: enterprise.problem,
				solution: enterprise.solution,
				impact: enterprise.impact,
				longContent: enterprise.longContent ?? undefined,
				websiteUrl: enterprise.websiteUrl ?? undefined,
				instagramUrl: enterprise.instagramUrl ?? undefined,
				logoKey: enterprise.logoKey ?? undefined,
				coverKey: enterprise.coverKey ?? undefined,
				status,
				isFeatured: enterprise.isFeatured,
				categoryIds: enterprise.categories.map((item) => item.id),
				audienceIds: enterprise.audiences.map((item) => item.id),
				businessModelIds: enterprise.businessModels.map((item) => item.id),
				countryCodes: enterprise.countries.map((item) => item.code),
				sdgIds: enterprise.sdgs.map((item) => item.id),
			})
			toast.success(status === 'draft' ? 'Taslağa çekildi.' : 'Yayından kaldırıldı.')
			navigate('/arama')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Durum güncellenemedi.')
		} finally {
			setIsPending(false)
		}
	}

	async function handleDelete() {
		if (!window.confirm(`${enterprise.name} kalıcı olarak silinsin mi?`)) return
		setIsPending(true)
		try {
			await deleteEnterprise(enterprise.id)
			toast.success('Girişim silindi.')
			navigate('/arama')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Silinemedi.')
		} finally {
			setIsPending(false)
		}
	}

	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
			<p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
				Editör araçları
			</p>
			<div className="flex flex-wrap gap-2">
				<Button asChild size="sm" variant="outline" disabled={isPending}>
					<Link to={`/admin/enterprises/${enterprise.id}/edit`}>Düzenle</Link>
				</Button>
				<Button size="sm" variant="outline" disabled={isPending} onClick={() => void updateStatus('draft')}>
					Taslağa çek
				</Button>
				<Button
					size="sm"
					variant="outline"
					disabled={isPending}
					onClick={() => void updateStatus('archived')}
				>
					Yayından kaldır
				</Button>
				<Button size="sm" variant="destructive" disabled={isPending} onClick={() => void handleDelete()}>
					Sil
				</Button>
			</div>
		</div>
	)
}
