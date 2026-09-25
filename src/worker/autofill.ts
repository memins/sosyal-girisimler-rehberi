// Admin "Bağlantıdan doldur": scrape an enterprise's website / Instagram with
// Apify, then let Gemini map the text onto the enterprise form fields.
import type { DirectoryMeta, EnterpriseAutofillResult } from '@/shared/types'

const APIFY_API = 'https://api.apify.com/v2/acts'
const INSTAGRAM_ACTOR = 'apify~instagram-profile-scraper'
const WEB_ACTOR = 'apify~rag-web-browser'
const GEMINI_MODEL = 'gemini-2.5-flash'
const MAX_SOURCE_CHARS = 24_000
const MAX_IMAGES = 6

type AutofillEnv = {
	APIFY_API_TOKEN?: string
	GEMINI_API_KEY?: string
}

type InstagramProfile = {
	username?: string
	fullName?: string
	biography?: string
	externalUrl?: string
	profilePicUrlHD?: string
	profilePicUrl?: string
	latestPosts?: Array<{ caption?: string; displayUrl?: string; type?: string }>
}

type ScrapedSource = {
	text: string
	images: Array<string>
	websiteUrl?: string
	instagramUrl?: string
	logoUrl?: string
}

export class AutofillError extends Error {}

export async function autofillEnterprise(
	env: AutofillEnv,
	meta: DirectoryMeta,
	input: { websiteUrl?: string; instagramUrl?: string },
): Promise<EnterpriseAutofillResult & { imageUrls: Array<string>; logoUrl?: string }> {
	if (!env.APIFY_API_TOKEN || !env.GEMINI_API_KEY) {
		throw new AutofillError('Otomatik doldurma için APIFY_API_TOKEN ve GEMINI_API_KEY tanımlı olmalı.')
	}
	const websiteUrl = normalizeUrl(input.websiteUrl)
	const handle = instagramHandle(input.instagramUrl)
	if (!websiteUrl && !handle) {
		throw new AutofillError('Web sitesi ya da Instagram bağlantısı girin.')
	}

	const sources = await Promise.all([
		handle ? scrapeInstagram(env.APIFY_API_TOKEN, handle) : null,
		websiteUrl ? scrapeWebsite(env.APIFY_API_TOKEN, websiteUrl) : null,
	])
	const usable = sources.filter((source): source is ScrapedSource => source !== null)
	const text = usable.map((source) => source.text).join('\n\n---\n\n').slice(0, MAX_SOURCE_CHARS)
	if (text.trim().length < 40) {
		throw new AutofillError('Bağlantılardan yeterli içerik alınamadı.')
	}

	const fields = await extractWithGemini(env.GEMINI_API_KEY, meta, text)
	const instagramSource = sources[0]
	return {
		...fields,
		websiteUrl: websiteUrl ?? instagramSource?.websiteUrl ?? fields.websiteUrl,
		instagramUrl: handle ? `https://www.instagram.com/${handle}/` : fields.instagramUrl,
		logoUrl: instagramSource?.logoUrl,
		imageUrls: [...new Set(usable.flatMap((source) => source.images))].slice(0, MAX_IMAGES),
	}
}

async function runActor<T>(token: string, actor: string, body: unknown): Promise<Array<T>> {
	const response = await fetch(
		`${APIFY_API}/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=120`,
		{
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
		},
	)
	if (response.status === 402) {
		throw new AutofillError('Apify kullanım limiti doldu.')
	}
	if (!response.ok) {
		throw new AutofillError(`Apify isteği başarısız (${response.status}).`)
	}
	return (await response.json()) as Array<T>
}

async function scrapeInstagram(token: string, handle: string): Promise<ScrapedSource | null> {
	const [profile] = await runActor<InstagramProfile>(token, INSTAGRAM_ACTOR, { usernames: [handle] })
	if (!profile) return null
	const posts = (profile.latestPosts ?? []).slice(0, 12)
	return {
		text: [
			`Instagram profili: @${profile.username ?? handle}`,
			profile.fullName && `Ad: ${profile.fullName}`,
			profile.biography && `Biyografi: ${profile.biography}`,
			profile.externalUrl && `Bağlantı: ${profile.externalUrl}`,
			...posts.map((post, index) => post.caption && `Gönderi ${index + 1}: ${post.caption}`),
		]
			.filter(Boolean)
			.join('\n'),
		images: posts
			.filter((post) => post.type !== 'Video' && post.displayUrl)
			.map((post) => post.displayUrl as string),
		websiteUrl: profile.externalUrl,
		logoUrl: profile.profilePicUrlHD ?? profile.profilePicUrl,
	}
}

async function scrapeWebsite(token: string, url: string): Promise<ScrapedSource | null> {
	const pages = await runActor<{ markdown?: string; text?: string; metadata?: { title?: string } }>(
		token,
		WEB_ACTOR,
		{ query: url, maxResults: 1, outputFormats: ['markdown'] },
	)
	const page = pages[0]
	const content = page?.markdown ?? page?.text ?? ''
	if (!content) return null
	const images = [...content.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)]
		.map((match) => match[1])
		.filter((src) => !/\.svg(\?|$)|logo|icon|sprite|pixel/i.test(src))
	return {
		text: `Web sitesi (${url})${page.metadata?.title ? ` — ${page.metadata.title}` : ''}:\n${content}`,
		images,
	}
}

async function extractWithGemini(
	apiKey: string,
	meta: DirectoryMeta,
	sourceText: string,
): Promise<EnterpriseAutofillResult> {
	const idList = (items: Array<{ id: string | number; name: string }>) =>
		items.map((item) => `${item.id} = ${item.name}`).join('; ')
	const prompt = `Aşağıdaki kaynaklardan bir sosyal girişim / kurum profili çıkar. Türkçe, tarafsız, ansiklopedik bir dille yaz; reklam dili ve abartı kullanma. Kaynakta olmayan bilgi uydurma; emin olmadığın alanı boş bırak.

Alanlar:
- name: kurumun adı
- shortDescription: 1 cümlelik tanım (en fazla 200 karakter)
- problem: "Çalışma alanı" — nerede, kimlerle, hangi alanda çalıştığı (2-3 cümle)
- solution: "Çözüm yöntemi" — nasıl çalıştığı, sunduğu hizmet/ürün (2-4 cümle)
- impact: "Sosyal etki" — yarattığı somut etki, varsa rakamlarla (2-4 cümle)
- longContent: 3-5 paragraflık detaylı tanıtım (paragraflar arasında boş satır)
- categoryIds: yalnızca şu kimliklerden: ${idList(meta.categories)}
- audienceIds: yalnızca şu kimliklerden: ${idList(meta.audiences)}
- businessModelIds: kurum türü, yalnızca şu kimliklerden (genelde 1 tane): ${idList(meta.businessModels)}
- countryCodes: yalnızca şu kodlardan: ${meta.countries.map((country) => `${country.code} = ${country.name}`).join('; ')}
- sdgIds: ilgili Sürdürülebilir Kalkınma Amaçları numaraları (1-17), en fazla 4
- websiteUrl, instagramUrl: kaynakta geçiyorsa

KAYNAKLAR:
${sourceText}`

	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
		{
			method: 'POST',
			headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
			body: JSON.stringify({
				contents: [{ role: 'user', parts: [{ text: prompt }] }],
				generationConfig: {
					temperature: 0.2,
					responseMimeType: 'application/json',
					responseSchema: {
						type: 'OBJECT',
						properties: {
							name: { type: 'STRING' },
							shortDescription: { type: 'STRING' },
							problem: { type: 'STRING' },
							solution: { type: 'STRING' },
							impact: { type: 'STRING' },
							longContent: { type: 'STRING' },
							websiteUrl: { type: 'STRING' },
							instagramUrl: { type: 'STRING' },
							categoryIds: { type: 'ARRAY', items: { type: 'STRING' } },
							audienceIds: { type: 'ARRAY', items: { type: 'STRING' } },
							businessModelIds: { type: 'ARRAY', items: { type: 'STRING' } },
							countryCodes: { type: 'ARRAY', items: { type: 'STRING' } },
							sdgIds: { type: 'ARRAY', items: { type: 'INTEGER' } },
						},
						required: ['name', 'shortDescription'],
					},
				},
			}),
		},
	)
	if (response.status === 429) {
		throw new AutofillError('Gemini kullanım limiti doldu, biraz sonra tekrar deneyin.')
	}
	if (!response.ok) {
		throw new AutofillError(`Gemini isteği başarısız (${response.status}).`)
	}
	const body = (await response.json()) as {
		candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
	}
	const raw = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? ''
	let parsed: Partial<EnterpriseAutofillResult>
	try {
		parsed = JSON.parse(raw) as Partial<EnterpriseAutofillResult>
	} catch {
		throw new AutofillError('Gemini yanıtı okunamadı.')
	}

	// Drop any taxonomy id the model invented.
	const allowed = <T>(values: Array<T> | undefined, valid: Array<T>) =>
		[...new Set((values ?? []).filter((value) => valid.includes(value)))]
	return {
		name: parsed.name?.trim() ?? '',
		shortDescription: parsed.shortDescription?.trim() ?? '',
		problem: parsed.problem?.trim() ?? '',
		solution: parsed.solution?.trim() ?? '',
		impact: parsed.impact?.trim() ?? '',
		longContent: parsed.longContent?.trim() ?? '',
		websiteUrl: normalizeUrl(parsed.websiteUrl),
		instagramUrl: normalizeUrl(parsed.instagramUrl),
		categoryIds: allowed(parsed.categoryIds, meta.categories.map((item) => item.id)),
		audienceIds: allowed(parsed.audienceIds, meta.audiences.map((item) => item.id)),
		businessModelIds: allowed(parsed.businessModelIds, meta.businessModels.map((item) => item.id)),
		countryCodes: allowed(parsed.countryCodes, meta.countries.map((item) => item.code)),
		sdgIds: allowed(parsed.sdgIds, meta.sdgs.map((item) => item.id)).slice(0, 4),
		imageKeys: [],
	}
}

function normalizeUrl(value: string | undefined): string | undefined {
	const trimmed = value?.trim()
	if (!trimmed) return undefined
	const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
	try {
		return new URL(withProtocol).toString()
	} catch {
		return undefined
	}
}

function instagramHandle(value: string | undefined): string | null {
	const trimmed = value?.trim()
	if (!trimmed) return null
	const fromUrl = trimmed.match(/instagram\.com\/([A-Za-z0-9._]+)/i)?.[1]
	const handle = fromUrl ?? trimmed.replace(/^@/, '')
	return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle.toLowerCase() : null
}
