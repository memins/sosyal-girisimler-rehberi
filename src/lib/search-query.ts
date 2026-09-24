export function typoLikeNeedles(normalizedQuery: string): Array<string> {
	const query = normalizedQuery.trim()
	if (query.length < 4 || query.length > 40) return [query]

	const variants = new Set<string>([query])
	for (let index = 0; index < query.length && variants.size < 8; index += 1) {
		const variant = `${query.slice(0, index)}${query.slice(index + 1)}`
		if (variant.length >= 3) variants.add(variant)
	}

	return [...variants]
}
