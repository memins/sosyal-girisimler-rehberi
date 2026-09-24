import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { subscribeNewsletter } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function NewsletterForm() {
	const [email, setEmail] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setIsSubmitting(true)
		try {
			const result = await subscribeNewsletter(email)
			toast.success(
				result.alreadySubscribed
					? 'Bu adres zaten bültene kayıtlı.'
					: 'Bültene kaydoldun.',
			)
			setEmail('')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Kayıt tamamlanamadı.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-2">
			<label htmlFor="newsletter-email" className="text-sm font-medium">
				E-posta bülteni
			</label>
			<p className="text-sm text-muted-foreground">
				Yeni girişimler eklendiğinde kısa bir not almak için adresini bırak.
			</p>
			<div className="flex gap-2">
				<Input
					id="newsletter-email"
					type="email"
					required
					autoComplete="email"
					placeholder="sen@example.com"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
				/>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? <Loader2Icon className="animate-spin" /> : 'Abone ol'}
				</Button>
			</div>
		</form>
	)
}
