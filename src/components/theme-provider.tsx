import type { ReactNode } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

interface ThemeProviderProps {
	children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="light"
			enableSystem
			disableTransitionOnChange
			storageKey="sgr-theme"
		>
			{children}
		</NextThemesProvider>
	)
}
