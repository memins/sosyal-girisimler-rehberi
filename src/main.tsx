import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from '@/app/App'
import { ThemeProvider } from '@/components/theme-provider'
import '@/styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
	throw new Error('Root element not found')
}

createRoot(rootElement).render(
	<StrictMode>
		<ThemeProvider>
			<BrowserRouter>
				<App />
			</BrowserRouter>
		</ThemeProvider>
	</StrictMode>,
)
