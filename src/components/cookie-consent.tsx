import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'sgr-cookie-consent'
const GA_ID = 'G-71TXFKRMQX'

type Consent = 'accepted' | 'rejected'

export function CookieConsent() {
	// localStorage eşzamanlı okunur; banner ek bir render beklemeden doğru durumda başlar.
	const [consent, setConsent] = useState<Consent | null>(readConsent)

	useEffect(() => {
		if (readConsent() === 'accepted') whenIdle(loadAnalytics)
	}, [])

	function handleChoice(next: Consent) {
		localStorage.setItem(STORAGE_KEY, next)
		setConsent(next)
		if (next === 'accepted') loadAnalytics()
	}

	if (consent !== null) return null

	return (
		<section
			aria-labelledby="cookie-consent-title"
			aria-describedby="cookie-consent-description"
			className="fixed inset-x-0 bottom-16 z-50 border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur-md md:bottom-0"
		>
			<div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex flex-col gap-1">
					<p id="cookie-consent-title" className="text-sm font-medium">
						Çerezler
					</p>
					<p id="cookie-consent-description" className="text-sm leading-relaxed text-muted-foreground">
						Siteyi geliştirmek için yalnızca onay verirseniz Google Analytics çerezi kullanılır.
						Ayrıntılar{' '}
						<Link to="/gizlilik" className="rounded-sm text-primary underline underline-offset-4">
							gizlilik sayfasında
						</Link>
						.
					</p>
				</div>
				<div className="flex shrink-0 gap-2">
					<Button type="button" variant="outline" onClick={() => handleChoice('rejected')}>
						Reddet
					</Button>
					<Button type="button" onClick={() => handleChoice('accepted')}>
						Kabul et
					</Button>
				</div>
			</div>
		</section>
	)
}

function readConsent(): Consent | null {
	try {
		const value = localStorage.getItem(STORAGE_KEY)
		return value === 'accepted' || value === 'rejected' ? value : null
	} catch {
		return null
	}
}

/**
 * Analitik, ilk boyama ve etkileşimle yarışmasın diye tarayıcı boşa çıkınca
 * yüklenir (LCP/INP). requestIdleCallback olmayan tarayıcılarda kısa bir gecikme.
 */
function whenIdle(callback: () => void) {
	if ('requestIdleCallback' in window) {
		window.requestIdleCallback(callback, { timeout: 4000 })
	} else {
		setTimeout(callback, 2000)
	}
}

function loadAnalytics() {
	if (document.getElementById('ga-loader')) return

	const script = document.createElement('script')
	script.id = 'ga-loader'
	script.async = true
	script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
	document.head.appendChild(script)

	window.dataLayer = window.dataLayer ?? []
	window.gtag = function gtag(...args: Array<unknown>) {
		window.dataLayer?.push(args)
	}
	window.gtag('js', new Date())
	window.gtag('config', GA_ID)
}
