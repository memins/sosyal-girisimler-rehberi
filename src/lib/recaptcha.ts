// Invisible reCAPTCHA v3 for public forms. The Google script is only loaded
// when a visitor actually submits something, so browsing stays cookie-free.
export const RECAPTCHA_SITE_KEY = '6LdHN84tAAAAANDWLkJUNdLwBu6oCffff7vPfFXy'

type Grecaptcha = {
	ready: (callback: () => void) => void
	execute: (siteKey: string, options: { action: string }) => Promise<string>
}

declare global {
	interface Window {
		grecaptcha?: Grecaptcha
	}
}

let loading: Promise<Grecaptcha> | null = null

function loadRecaptcha(): Promise<Grecaptcha> {
	if (loading) return loading
	loading = new Promise<Grecaptcha>((resolve, reject) => {
		const script = document.createElement('script')
		script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
		script.async = true
		script.onload = () => {
			const grecaptcha = window.grecaptcha
			if (!grecaptcha) {
				reject(new Error('Güvenlik doğrulaması yüklenemedi.'))
				return
			}
			grecaptcha.ready(() => resolve(grecaptcha))
		}
		script.onerror = () => {
			loading = null
			reject(new Error('Güvenlik doğrulaması yüklenemedi. Reklam engelleyiciyi kapatıp tekrar deneyin.'))
		}
		document.head.appendChild(script)
	})
	return loading
}

export async function getRecaptchaToken(action: string): Promise<string> {
	const grecaptcha = await loadRecaptcha()
	return grecaptcha.execute(RECAPTCHA_SITE_KEY, { action })
}
