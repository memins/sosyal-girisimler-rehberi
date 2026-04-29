import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
	hasError: boolean
	error: Error | null
}

interface ErrorBoundaryProps {
	children: ReactNode
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { hasError: false, error: null }

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error('Route error', error, info)
	}

	private handleReset = () => {
		this.setState({ hasError: false, error: null })
	}

	render() {
		if (!this.state.hasError) {
			return this.props.children
		}

		return (
			<div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
				<div className="space-y-3">
					<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
						Hata
					</p>
					<h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
						Bir şeyler ters gitti
					</h1>
					<p className="mx-auto max-w-md text-sm text-muted-foreground">
						{this.state.error?.message ??
							'Sayfa yüklenirken beklenmeyen bir hata oluştu.'}
					</p>
				</div>
				<div className="flex flex-wrap justify-center gap-2">
					<Button onClick={this.handleReset}>Yeniden dene</Button>
					<Button variant="outline" onClick={() => window.location.reload()}>
						Sayfayı yenile
					</Button>
				</div>
			</div>
		)
	}
}
