import type { FormEvent } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { createSubmission } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field as FormField, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function SubmissionPage() {
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setIsSubmitting(true)
		const formData = new FormData(event.currentTarget)

		try {
			await createSubmission({
				name: String(formData.get('name') ?? ''),
				description: String(formData.get('description') ?? ''),
				contactEmail: String(formData.get('contactEmail') ?? ''),
				websiteUrl: String(formData.get('websiteUrl') ?? ''),
				problem: String(formData.get('problem') ?? ''),
				solution: String(formData.get('solution') ?? ''),
			})
			event.currentTarget.reset()
			toast.success('Öneriniz alındı. Editör ekibi inceleyecek.')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Öneri gönderilemedi.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[0.9fr_1.1fr]">
			<section className="flex flex-col gap-4">
				<p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">Girişim ekle</p>
				<h1 className="text-4xl font-semibold tracking-tight">Rehbere yeni bir sosyal girişim öner.</h1>
				<p className="leading-7 text-muted-foreground">
					Öneriler önce editör paneline düşer. Bilgiler doğrulandıktan sonra girişim profiline dönüştürülür.
				</p>
			</section>
			<Card>
				<CardHeader>
					<CardTitle>Öneri formu</CardTitle>
					<CardDescription>Temel bilgileri paylaşmanız yeterli; detayları editörler tamamlayabilir.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="flex flex-col gap-5">
						<FieldGroup>
							<Field name="name" label="Girişim adı" placeholder="Fazla" required />
							<Field name="contactEmail" label="İletişim e-postası" placeholder="editor@example.com" required />
							<Field name="websiteUrl" label="Web sitesi" placeholder="https://..." />
						</FieldGroup>
						<FormField>
							<FieldLabel htmlFor="description">Kısa açıklama</FieldLabel>
							<Textarea id="description" name="description" required minLength={20} rows={4} />
						</FormField>
						<FormField>
							<FieldLabel htmlFor="problem">Hangi yarayı sarıyor?</FieldLabel>
							<Textarea id="problem" name="problem" rows={3} />
						</FormField>
						<FormField>
							<FieldLabel htmlFor="solution">Bunu nasıl yapıyor?</FieldLabel>
							<Textarea id="solution" name="solution" rows={3} />
						</FormField>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? 'Gönderiliyor...' : 'Öneriyi gönder'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}

type FieldProps = {
	name: string
	label: string
	placeholder?: string
	required?: boolean
}

function Field({ name, label, placeholder, required = false }: FieldProps) {
	return (
		<FormField>
			<FieldLabel htmlFor={name}>{label}</FieldLabel>
			<Input id={name} name={name} placeholder={placeholder} required={required} />
		</FormField>
	)
}
