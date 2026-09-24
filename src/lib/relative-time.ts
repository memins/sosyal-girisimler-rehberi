export function formatAddedAgo(value: string, now = new Date()): string {
	const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`
	const date = new Date(normalized)
	if (Number.isNaN(date.getTime())) return 'Yeni eklendi'

	const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
	if (days <= 0) return 'Bugün eklendi'
	if (days === 1) return '1 gün önce eklendi'
	if (days < 30) return `${days} gün önce eklendi`

	const months = Math.floor(days / 30)
	if (months < 12) {
		return months === 1 ? '1 ay önce eklendi' : `${months} ay önce eklendi`
	}

	const years = Math.floor(months / 12)
	return years === 1 ? '1 yıl önce eklendi' : `${years} yıl önce eklendi`
}
