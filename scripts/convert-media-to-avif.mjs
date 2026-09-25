// Re-encodes every referenced raster image in R2 to AVIF and repoints D1 rows
// at the new keys. Originals stay in R2 so the change can be rolled back.
//
//   node scripts/convert-media-to-avif.mjs [--dry-run] [--limit N]
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { DATABASE_NAME, d1Query, mapLimit, r2Get, r2Put, sqlString, toAvif } from './cf-api.mjs'

const dryRun = process.argv.includes('--dry-run')
const limitIndex = process.argv.indexOf('--limit')
const limit = limitIndex > -1 ? Number(process.argv[limitIndex + 1]) : Infinity

const REFERENCES = [
	['enterprise_media', 'media_key'],
	['enterprises', 'logo_key'],
	['enterprises', 'cover_key'],
	['submissions', 'image_key'],
]
const CONVERTIBLE = /\.(jpe?g|png|webp)$/i

const keys = new Set()
for (const [table, column] of REFERENCES) {
	const rows = await d1Query(`SELECT DISTINCT ${column} AS key FROM ${table} WHERE ${column} IS NOT NULL`)
	for (const row of rows) if (CONVERTIBLE.test(row.key)) keys.add(row.key)
}
const pending = [...keys].slice(0, limit)
console.log(`Convertible keys: ${keys.size}, processing ${pending.length}${dryRun ? ' (dry run)' : ''}`)

let before = 0
let after = 0
let failed = 0
const converted = await mapLimit(pending, 8, async (key, index) => {
	try {
		const original = await r2Get(key)
		const avif = await toAvif(sharp, original)
		const avifKey = key.replace(CONVERTIBLE, '.avif')
		if (!dryRun) await r2Put(avifKey, avif, 'image/avif')
		before += original.length
		after += avif.length
		if ((index + 1) % 50 === 0) console.log(`  ${index + 1}/${pending.length}`)
		return [key, avifKey]
	} catch (error) {
		failed += 1
		console.warn(`  ✗ ${key}: ${error.message}`)
		return null
	}
})

const statements = converted.filter(Boolean).flatMap(([oldKey, newKey]) =>
	REFERENCES.map(
		([table, column]) =>
			`UPDATE ${table} SET ${column} = ${sqlString(newKey)} WHERE ${column} = ${sqlString(oldKey)};`,
	),
)
console.log(
	`Converted ${converted.filter(Boolean).length}, failed ${failed}: ${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB`,
)

const sqlPath = join(tmpdir(), `avif-migration-${Date.now()}.sql`)
writeFileSync(sqlPath, `${statements.join('\n')}\n`)
console.log(`Wrote ${statements.length} statements to ${sqlPath}`)
if (!dryRun && statements.length > 0) {
	execFileSync('npx', ['wrangler', 'd1', 'execute', DATABASE_NAME, '--remote', '--yes', '--file', sqlPath], {
		stdio: 'inherit',
	})
}
