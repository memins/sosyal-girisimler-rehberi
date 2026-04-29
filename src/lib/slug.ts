export function slugify(value: string): string {
	return value
		.toLocaleLowerCase('tr')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/ı/g, 'i')
		.replace(/ğ/g, 'g')
		.replace(/ü/g, 'u')
		.replace(/ş/g, 's')
		.replace(/ö/g, 'o')
		.replace(/ç/g, 'c')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}
