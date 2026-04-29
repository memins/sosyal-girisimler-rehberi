import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { bootstrapOwner, getBootstrapStatus } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Logomark } from '@/components/logomark'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const setupSchema = z.object({
	email: z.string().trim().email('Geçerli bir e-posta adresi girin.'),
	password: z.string().min(10, 'Şifre en az 10 karakter olmalı.'),
})

type SetupValues = z.input<typeof setupSchema>

export default function SetupPage() {
	const navigate = useNavigate()
	const [bootstrapped, setBootstrapped] = useState(false)
	const form = useForm<SetupValues>({
		resolver: zodResolver(setupSchema),
		defaultValues: { email: '', password: '' },
	})

	useEffect(() => {
		;(async () => {
			try {
				const status = await getBootstrapStatus()
				if (!status.needsSetup) {
					navigate('/admin/login', { replace: true })
					return
				}
				form.setValue('email', status.ownerEmail)
				setBootstrapped(true)
			} catch {
				navigate('/admin/login', { replace: true })
			}
		})()
	}, [form, navigate])

	if (!bootstrapped) return null

	async function onSubmit(values: SetupValues) {
		try {
			await bootstrapOwner(values)
			toast.success('Owner hesabı oluşturuldu.')
			navigate('/admin', { replace: true })
		} catch (error) {
			form.setError('password', {
				type: 'server',
				message: error instanceof Error ? error.message : 'Kurulum başarısız.',
			})
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
				<div className="space-y-2 text-center">
					<Link to="/" className="group mx-auto flex w-fit items-center gap-2">
						<Logomark animated className="size-5" />
						<span className="text-sm font-semibold tracking-tight transition-colors group-hover:text-primary">
							Sosyal Girişimler
						</span>
					</Link>
					<h1 className="text-2xl font-semibold tracking-tight">Yönetici kurulumu</h1>
					<p className="text-sm text-muted-foreground">
						İlk owner hesabını oluştur. Bu işlem yalnızca bir kez yapılır.
					</p>
				</div>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>E-posta</FormLabel>
									<FormControl>
										<Input type="email" readOnly {...field} />
									</FormControl>
									<FormDescription>Owner e-posta adresi sabittir.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Şifre</FormLabel>
									<FormControl>
										<Input
											type="password"
											autoComplete="new-password"
											placeholder="En az 10 karakter"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Güçlü bir şifre seç; daha sonra panelden değiştirebilirsin.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
							{form.formState.isSubmitting ? (
								<>
									<Loader2Icon className="animate-spin" />
									Hesap oluşturuluyor…
								</>
							) : (
								'Owner hesabı oluştur'
							)}
						</Button>
					</form>
				</Form>
			</div>
		</div>
	)
}
