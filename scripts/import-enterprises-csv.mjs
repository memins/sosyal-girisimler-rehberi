// Imports enterprises from the editorial CSV export into production.
//
//   node scripts/import-enterprises-csv.mjs --csv data.csv --images ./imgs [--dry-run] [--limit 5]
//
// - Rows that already exist (same name, website domain or Instagram handle) are skipped.
// - Images are converted to AVIF and uploaded to R2 as the enterprise gallery.
// - New enterprises are published with needs_review = 1 so they show up in the
//   admin "Otomatik Çekildi" list until an editor checks them.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { parse } from 'csv-parse/sync'
import sharp from 'sharp'
import {
	DATABASE_NAME,
	d1Query,
	foldKey,
	mapLimit,
	r2Put,
	slugify,
	sqlString,
	toAvif,
} from './cf-api.mjs'

const args = parseArgs(process.argv.slice(2))
if (!args.csv || !args.images) {
	console.error('Usage: node scripts/import-enterprises-csv.mjs --csv <file> --images <dir> [--dry-run] [--limit N]')
	process.exit(1)
}

// CSV country label → [code, Turkish name, flag]. "Küresel" maps to the existing `global` row.
const COUNTRIES = {
	'Türkiye': ['TR', 'Türkiye', '🇹🇷'],
	'Küresel': ['global', 'Global', '🌍'],
	'ABD': ['US', 'Amerika Birleşik Devletleri', '🇺🇸'],
	'İngiltere': ['GB', 'Birleşik Krallık', '🇬🇧'],
	'Almanya': ['DE', 'Almanya', '🇩🇪'],
	'Hollanda': ['NL', 'Hollanda', '🇳🇱'],
	'Fransa': ['FR', 'Fransa', '🇫🇷'],
	'Kenya': ['KE', 'Kenya', '🇰🇪'],
	'Kanada': ['CA', 'Kanada', '🇨🇦'],
	'Hindistan': ['IN', 'Hindistan', '🇮🇳'],
	'İsviçre': ['CH', 'İsviçre', '🇨🇭'],
	'Avustralya': ['AU', 'Avustralya', '🇦🇺'],
	'İsrail': ['IL', 'İsrail', '🇮🇱'],
	'İtalya': ['IT', 'İtalya', '🇮🇹'],
	'İsveç': ['SE', 'İsveç', '🇸🇪'],
	'Japonya': ['JP', 'Japonya', '🇯🇵'],
	'Şili': ['CL', 'Şili', '🇨🇱'],
	'Danimarka': ['DK', 'Danimarka', '🇩🇰'],
	'Zimbabve': ['ZW', 'Zimbabve', '🇿🇼'],
	'Güney Kore': ['KR', 'Güney Kore', '🇰🇷'],
	'İrlanda': ['IE', 'İrlanda', '🇮🇪'],
	'Nijerya': ['NG', 'Nijerya', '🇳🇬'],
	'Avusturya': ['AT', 'Avusturya', '🇦🇹'],
	'Sırbistan': ['RS', 'Sırbistan', '🇷🇸'],
	'Nepal': ['NP', 'Nepal', '🇳🇵'],
	'Gana': ['GH', 'Gana', '🇬🇭'],
	'Sri Lanka': ['LK', 'Sri Lanka', '🇱🇰'],
	'Madagaskar': ['MG', 'Madagaskar', '🇲🇬'],
	'Lübnan': ['LB', 'Lübnan', '🇱🇧'],
	'Ürdün': ['JO', 'Ürdün', '🇯🇴'],
	'Çin': ['CN', 'Çin', '🇨🇳'],
	'Kolombiya': ['CO', 'Kolombiya', '🇨🇴'],
	'Mali': ['ML', 'Mali', '🇲🇱'],
	'Afganistan': ['AF', 'Afganistan', '🇦🇫'],
	'Hong Kong': ['HK', 'Hong Kong', '🇭🇰'],
	'Yeni Zelanda': ['NZ', 'Yeni Zelanda', '🇳🇿'],
	'Singapur': ['SG', 'Singapur', '🇸🇬'],
	'Güney Sudan': ['SS', 'Güney Sudan', '🇸🇸'],
	'Ekvador': ['EC', 'Ekvador', '🇪🇨'],
	'Finlandiya': ['FI', 'Finlandiya', '🇫🇮'],
	'Belçika': ['BE', 'Belçika', '🇧🇪'],
	'Bangladeş': ['BD', 'Bangladeş', '🇧🇩'],
	'Suriye': ['SY', 'Suriye', '🇸🇾'],
	'Güney Afrika': ['ZA', 'Güney Afrika', '🇿🇦'],
	'Ruanda': ['RW', 'Ruanda', '🇷🇼'],
}
// Regions without a country row are dropped ("Afrika", "Latin Amerika").
const IGNORED_REGIONS = new Set(['Afrika', 'Latin Amerika'])

const rows = parse(readFileSync(args.csv), { columns: true, bom: true, skip_empty_lines: true })
console.log(`CSV rows: ${rows.length}`)

const [existing, categories, businessModels, countries] = await Promise.all([
	d1Query('SELECT slug, name, website_url, instagram_url FROM enterprises'),
	d1Query('SELECT id, name FROM categories'),
	d1Query('SELECT id, name FROM business_models'),
	d1Query('SELECT code, sort_order FROM countries'),
])

const existingNames = new Set(existing.map((row) => foldKey(row.name)))
const existingDomains = new Set(existing.map((row) => domainOf(row.website_url)).filter(Boolean))
const existingHandles = new Set(existing.map((row) => instagramHandle(row.instagram_url)).filter(Boolean))
const usedSlugs = new Set(existing.map((row) => row.slug))
const categoryByName = new Map(categories.map((row) => [foldKey(row.name), row.id]))
const businessModelByName = new Map(businessModels.map((row) => [foldKey(row.name), row.id]))
const knownCountries = new Set(countries.map((row) => row.code))
let nextCountrySort = Math.max(0, ...countries.map((row) => row.sort_order)) + 1

const fresh = []
const skipped = []
for (const row of rows) {
	const duplicate =
		existingNames.has(foldKey(row.ad)) ||
		(domainOf(row.web_sitesi) && existingDomains.has(domainOf(row.web_sitesi))) ||
		(instagramHandle(row.instagram) && existingHandles.has(instagramHandle(row.instagram)))
	if (duplicate) skipped.push(row.ad)
	else fresh.push(row)
}
console.log(`Skipping ${skipped.length} existing: ${skipped.join(', ')}`)

const toImport = args.limit ? fresh.slice(0, Number(args.limit)) : fresh
console.log(`Importing ${toImport.length} enterprises${args['dry-run'] ? ' (dry run)' : ''}`)

// Upload state lets a rerun resume without re-encoding/re-uploading images.
const statePath = join(args.images, '.import-state.json')
const uploaded = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : {}

const statements = []
const unmapped = new Set()
let imageCount = 0
let bytesBefore = 0
let bytesAfter = 0

for (const row of toImport) {
	const id = crypto.randomUUID()
	const slug = uniqueSlug(row.ad)
	const longContent = row.uzun_icerik.trim()

	statements.push(
		`INSERT INTO enterprises (id, slug, name, short_description, problem, solution, impact, long_content, website_url, instagram_url, status, is_featured, import_source, needs_review) VALUES (${[
			id,
			slug,
			row.ad.trim(),
			shortDescription(longContent || row.sosyal_etki),
			row.calisma_alani.trim(),
			row.cozum_yontemi.trim(),
			row.sosyal_etki.trim(),
			longContent || null,
			normalizeUrl(row.web_sitesi),
			normalizeUrl(row.instagram),
		]
			.map(sqlString)
			.join(', ')}, 'published', 0, 'csv', 1);`,
	)

	for (const name of splitList(row.kategori)) {
		const categoryId = categoryByName.get(foldKey(name))
		if (categoryId) statements.push(relation('enterprise_categories', 'category_id', id, categoryId))
		else unmapped.add(`kategori: ${name}`)
	}
	for (const name of splitList(row.kurum_turu)) {
		const modelId = businessModelByName.get(foldKey(name))
		if (modelId) statements.push(relation('enterprise_business_models', 'business_model_id', id, modelId))
		else unmapped.add(`kurum_turu: ${name}`)
	}
	for (const code of countryCodes(row.ulke)) {
		statements.push(relation('enterprise_countries', 'country_code', id, code))
	}
	for (const sdg of new Set(splitList(row.surdurulebilir).map((value) => Number(value.match(/SKA\s*(\d+)/i)?.[1])))) {
		if (sdg >= 1 && sdg <= 17) statements.push(`INSERT OR IGNORE INTO enterprise_sdgs (enterprise_id, sdg_id) VALUES (${sqlString(id)}, ${sdg});`)
	}

	const files = splitList(row.gorseller)
	const keys = await mapLimit(files, 6, async (file) => {
		if (uploaded[file]) return uploaded[file]
		const input = readFileSync(join(args.images, file))
		const avif = await toAvif(sharp, input)
		bytesBefore += input.length
		bytesAfter += avif.length
		const key = `uploads/${crypto.randomUUID()}-${slugify(basename(file).replace(/\.[^.]+$/, '')).slice(0, 60)}.avif`
		if (!args['dry-run']) {
			await r2Put(key, avif, 'image/avif')
			uploaded[file] = key
		}
		imageCount += 1
		return key
	})
	keys.forEach((key, index) => {
		statements.push(
			`INSERT OR IGNORE INTO enterprise_media (enterprise_id, media_key, sort_order) VALUES (${sqlString(id)}, ${sqlString(key)}, ${index});`,
		)
	})
	if (!args['dry-run']) writeFileSync(statePath, JSON.stringify(uploaded))
	process.stdout.write(`  ✓ ${row.ad} (${keys.length} görsel)\n`)
}

if (unmapped.size > 0) console.warn(`Unmapped taxonomy values: ${[...unmapped].join(' | ')}`)
console.log(
	`Images encoded: ${imageCount}, ${(bytesBefore / 1e6).toFixed(1)} MB → ${(bytesAfter / 1e6).toFixed(1)} MB AVIF`,
)

const sqlPath = join(args.images, 'import.sql')
writeFileSync(sqlPath, `${statements.join('\n')}\n`)
console.log(`Wrote ${statements.length} statements to ${sqlPath}`)

if (!args['dry-run']) {
	execFileSync('npx', ['wrangler', 'd1', 'execute', DATABASE_NAME, '--remote', '--yes', '--file', sqlPath], {
		stdio: 'inherit',
	})
	console.log('Import finished. Purge the home cache (KV key home:v1) or wait 5 minutes.')
}

function countryCodes(value) {
	const codes = []
	for (const part of value.split('/').map((item) => item.trim()).filter(Boolean)) {
		if (IGNORED_REGIONS.has(part)) continue
		const country = COUNTRIES[part]
		if (!country) {
			unmapped.add(`ulke: ${part}`)
			continue
		}
		const [code, name, flag] = country
		if (!knownCountries.has(code)) {
			statements.unshift(
				`INSERT OR IGNORE INTO countries (code, name, flag, sort_order) VALUES (${sqlString(code)}, ${sqlString(name)}, ${sqlString(flag)}, ${nextCountrySort++});`,
			)
			knownCountries.add(code)
		}
		codes.push(code)
	}
	return [...new Set(codes)]
}

function relation(table, column, enterpriseId, value) {
	return `INSERT OR IGNORE INTO ${table} (enterprise_id, ${column}) VALUES (${sqlString(enterpriseId)}, ${sqlString(value)});`
}

function uniqueSlug(name) {
	const base = slugify(name).slice(0, 80) || 'girisim'
	let slug = base
	for (let suffix = 2; usedSlugs.has(slug); suffix += 1) slug = `${base}-${suffix}`
	usedSlugs.add(slug)
	return slug
}

// First sentence (or two, if the first is very short), capped at ~220 chars.
function shortDescription(text) {
	const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+/g) ?? [text]
	let summary = sentences[0].trim()
	if (summary.length < 80 && sentences[1]) summary = `${summary} ${sentences[1].trim()}`
	return summary.length > 220 ? `${summary.slice(0, 217).replace(/\s+\S*$/, '')}…` : summary
}

function splitList(value) {
	return (value ?? '').split('|').map((item) => item.trim()).filter(Boolean)
}

function normalizeUrl(value) {
	const url = (value ?? '').trim()
	if (!url) return null
	return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function domainOf(value) {
	return (value ?? '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || null
}

function instagramHandle(value) {
	return (value ?? '').match(/instagram\.com\/([^/?#]+)/i)?.[1]?.toLowerCase() ?? null
}

function parseArgs(argv) {
	const result = {}
	for (let index = 0; index < argv.length; index += 1) {
		const key = argv[index].replace(/^--/, '')
		const value = argv[index + 1]
		if (value && !value.startsWith('--')) {
			result[key] = value
			index += 1
		} else {
			result[key] = true
		}
	}
	return result
}
