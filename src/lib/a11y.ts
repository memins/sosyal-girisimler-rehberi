import { useEffect } from 'react'

const SITE_NAME = 'Sosyal Girişimler Rehberi'

/**
 * SPA içinde sayfa değiştiğinde <title> da değişsin (WCAG 2.4.2); ekran
 * okuyucular yeni sayfayı başlığından tanır. Worker'ın SSR başlık biçimiyle
 * aynıdır: "<sayfa> — Sosyal Girişimler Rehberi".
 */
export function useDocumentTitle(title: string | null | undefined) {
	useEffect(() => {
		if (title === undefined || title === null) return
		document.title = title.length > 0 ? `${title} — ${SITE_NAME}` : SITE_NAME
	}, [title])
}

export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || !window.matchMedia) return false
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Kaydırma davranışını kullanıcının hareket tercihine göre seçer. */
export function scrollBehavior(): ScrollBehavior {
	return prefersReducedMotion() ? 'auto' : 'smooth'
}

const FOCUSABLE_SELECTOR = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'iframe',
	'[tabindex]:not([tabindex="-1"])',
].join(',')

/** Bir kapsayıcı içindeki görünür, odaklanabilir öğeleri döner. */
export function getFocusable(container: HTMLElement): Array<HTMLElement> {
	return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
		(element) => element.offsetParent !== null || element === document.activeElement,
	)
}
