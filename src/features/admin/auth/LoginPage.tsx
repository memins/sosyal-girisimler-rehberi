import { zodResolver } from '@hookform/resolvers/zod'
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { getBootstrapStatus, getCurrentAdmin, loginAdmin } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Logomark } from '@/components/logomark'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const loginSchema = z.object({
	email: z.string().trim().email('Geçerli bir e-posta adresi girin.'),
	password: z.string().min(10, 'Şifre en az 10 karakter olmalı.'),
})

type LoginValues = z.input<typeof loginSchema>

export default function LoginPage() {
	const navigate = useNavigate()
	const location = useLocation()
	const [showPassword, setShowPassword] = useState(false)
	const [status, setStatus] = useState<'checking' | 'login' | 'authenticated'>('checking')
	const form = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: '', password: '' },
	})

	useEffect(() => {
		;(async () => {
			try {
				const status = await getBootstrapStatus()
				if (status.needsSetup) {
					navigate('/admin/setup', { replace: true })
					return
				}
				try {
					await getCurrentAdmin()
					setStatus('authenticated')
				} catch {
					setStatus('login')
				}
			} catch {
				setStatus('login')
			}
		})()
	}, [navigate])

	if (status === 'checking') {
		return null
	}

	if (status === 'authenticated') {
		const from = (location.state as { from?: string } | null)?.from ?? '/admin'
		return <Navigate to={from} replace />
	}

	async function onSubmit(values: LoginValues) {
		try {
			await loginAdmin(values)
			toast.success('Giriş başarılı.')
			const from = (location.state as { from?: string } | null)?.from ?? '/admin'
			navigate(from, { replace: true })
		} catch (error) {
			form.setError('password', {
				type: 'server',
				message: error instanceof Error ? error.message : 'Giriş başarısız.',
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
					<h1 className="text-2xl font-semibold tracking-tight">Admin girişi</h1>
					<p className="text-sm text-muted-foreground">
						Devam etmek için yetkili hesabınla giriş yap.
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
										<Input type="email" autoComplete="email" {...field} />
									</FormControl>
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
									<div className="relative">
										<FormControl>
											<Input
												type={showPassword ? 'text' : 'password'}
												autoComplete="current-password"
												className="pr-10"
												{...field}
											/>
										</FormControl>
										<button
											type="button"
											onClick={() => setShowPassword((s) => !s)}
											className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:text-foreground"
											aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
										>
											{showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
										</button>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
							{form.formState.isSubmitting ? (
								<>
									<Loader2Icon className="animate-spin" />
									Giriş yapılıyor…
								</>
							) : (
								'Giriş yap'
							)}
						</Button>
					</form>
				</Form>
				<div className="text-center text-xs text-muted-foreground">
					<Link to="/" className="hover:text-foreground">
						← Siteye dön
					</Link>
				</div>
			</div>
		</div>
	)
}
