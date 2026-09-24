/// <reference types="vite/client" />

interface Window {
	dataLayer?: Array<unknown>
	gtag?: (...args: Array<unknown>) => void
}
