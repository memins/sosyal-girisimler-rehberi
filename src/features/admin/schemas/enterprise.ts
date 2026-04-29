import { z } from 'zod'

const optionalUrl = z
	.string()
	.trim()
	.optional()
	.transform((value) => (value && value.length > 0 ? value : undefined))
	.refine(
		(value) => {
			if (!value) return true
			try {
				const url = new URL(value)
				return url.protocol === 'http:' || url.protocol === 'https:'
			} catch {
				return false
			}
		},
		{ message: 'URL http veya https ile başlamalı.' },
	)

export const enterpriseFormSchema = z.object({
	id: z.string().optional(),
	name: z.string().trim().min(1, 'Girişim adı gerekli.'),
	slug: z
		.string()
		.trim()
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, 'Slug sadece küçük harf, sayı ve tire içermeli.'),
	shortDescription: z
		.string()
		.trim()
		.min(20, 'Kısa açıklama en az 20 karakter olmalı.'),
	problem: z.string().trim().min(1, 'Gündem alanı gerekli.'),
	solution: z.string().trim().min(1, 'Çözüm alanı gerekli.'),
	impact: z.string().trim().min(1, 'Sosyal etki alanı gerekli.'),
	longContent: z.string().optional().or(z.literal('')),
	websiteUrl: optionalUrl,
	instagramUrl: optionalUrl,
	logoKey: z.string().optional().nullable(),
	coverKey: z.string().optional().nullable(),
	status: z.enum(['draft', 'published', 'archived']),
	isFeatured: z.boolean(),
	categoryIds: z.array(z.string()).min(1, 'En az bir kategori seçin.'),
	audienceIds: z.array(z.string()),
	businessModelIds: z.array(z.string()),
	countryCodes: z.array(z.string()).min(1, 'En az bir ülke seçin.'),
	sdgIds: z.array(z.number().int().min(1).max(17)),
})

export type EnterpriseFormValues = z.input<typeof enterpriseFormSchema>
