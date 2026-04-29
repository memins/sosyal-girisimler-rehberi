import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const PRIMARY = '#3a7d44'
const FOREGROUND = '#1a1a1a'
const MUTED = '#6e6a62'
const BACKGROUND_FROM = '#fafbf9'
const BACKGROUND_TO = '#f3eedb'
const ACCENT = '#e3c97c'

const SDG_COLORS = [
	'#E5243B', '#DDA63A', '#4C9F38', '#C5192D', '#FF3A21',
	'#26BDE2', '#FCC30B', '#A21942', '#FD6925', '#DD1367',
	'#FD9D24', '#BF8B2E', '#3F7E44', '#0A97D9', '#56C02B',
	'#00689D', '#19486A',
]

/**
 * The sprout mark — same proportions as `src/components/logomark.tsx`.
 * Returns inline SVG paths centered in a 32x32 viewBox; caller wraps it.
 */
function spritePaths(color = 'currentColor', leafOpacity = 0.55) {
	return `
		<circle cx="16" cy="25.5" r="2.4" fill="${color}"/>
		<path d="M16 23.5 C 16 19 16 15.5 16 13" stroke="${color}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
		<path d="M 16 14 C 16 9.5 19 5.5 25 6.5 C 24 11.5 20.5 15 16 14 Z" fill="${color}"/>
		<path d="M 16 16.5 C 16 13 13 9.5 7.5 10.5 C 8.5 14.5 12.5 17.5 16 16.5 Z" fill="${color}" fill-opacity="${leafOpacity}"/>
	`
}

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
	${spritePaths(PRIMARY)}
</svg>`

const ogSvg = (() => {
	// Build an SDG color row at the bottom-right
	const dotsRow = SDG_COLORS.map((color, index) => {
		const x = 678 + index * 30
		return `<circle cx="${x}" cy="555" r="11" fill="${color}"/>`
	}).join('')

	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
	<defs>
		<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stop-color="${BACKGROUND_FROM}"/>
			<stop offset="100%" stop-color="${BACKGROUND_TO}"/>
		</linearGradient>
		<radialGradient id="accent" cx="85%" cy="15%" r="55%">
			<stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.45"/>
			<stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
		</radialGradient>
		<pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
			<circle cx="1" cy="1" r="1" fill="${FOREGROUND}" fill-opacity="0.06"/>
		</pattern>
	</defs>

	<rect width="1200" height="630" fill="url(#bg)"/>
	<rect width="1200" height="630" fill="url(#dots)"/>
	<rect width="1200" height="630" fill="url(#accent)"/>

	<!-- Top accent line -->
	<rect x="0" y="0" width="1200" height="6" fill="${PRIMARY}"/>

	<!-- Logomark scaled up: original 32x32, scale 7 → 224x224, placed at (96, 110) -->
	<g transform="translate(96, 110) scale(7)">
		${spritePaths(PRIMARY)}
	</g>

	<!-- Wordmark -->
	<g font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif">
		<text x="370" y="240" font-size="72" font-weight="600" fill="${FOREGROUND}" letter-spacing="-1">Sosyal Girişimler</text>
		<text x="370" y="282" font-size="18" font-weight="600" fill="${MUTED}" letter-spacing="6">REHBERİ</text>

		<!-- Tagline -->
		<text x="96" y="430" font-size="34" font-weight="500" fill="${FOREGROUND}" letter-spacing="-0.5">
			Türkiye ve dünyadan sosyal girişimleri keşfet.
		</text>
		<text x="96" y="478" font-size="22" font-weight="400" fill="${MUTED}">
			Alan, hedef kitle, ülke ve Sürdürülebilir Kalkınma Amaçları üzerinden tara.
		</text>

		<!-- Bottom URL -->
		<text x="96" y="585" font-size="16" font-weight="500" fill="${MUTED}" letter-spacing="2">
			SOSYAL GİRİŞİMLER · AÇIK · GÖNÜLLÜ · TÜRKÇE
		</text>
	</g>

	<!-- SDG color row, bottom-right -->
	${dotsRow}
</svg>`
})()

await writeFile(join(publicDir, 'favicon.svg'), faviconSvg)
console.log('✓ public/favicon.svg')

await writeFile(join(publicDir, 'og-image.svg'), ogSvg)
console.log('✓ public/og-image.svg')

await sharp(Buffer.from(ogSvg))
	.png()
	.toFile(join(publicDir, 'og-image.png'))
console.log('✓ public/og-image.png (1200×630)')

await sharp(Buffer.from(faviconSvg))
	.resize(180, 180)
	.png()
	.toFile(join(publicDir, 'apple-touch-icon.png'))
console.log('✓ public/apple-touch-icon.png (180×180)')

await sharp(Buffer.from(faviconSvg))
	.resize(32, 32)
	.png()
	.toFile(join(publicDir, 'favicon-32.png'))
console.log('✓ public/favicon-32.png (32×32)')
