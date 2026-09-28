import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRoundIcon, Loader2Icon, PlusIcon, UsersIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { ErrorBlock, RouteFallback } from '@/components/StateBlock'
import { EmptyState } from '@/components/layout/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { ConfirmDialog } from '@/features/admin/shared/ConfirmDialog'
import { useTopbarActions } from '@/features/admin/layout/AdminTopbar'
import { useAdminSession } from '@/features/admin/state/useAdminSession'
import { createAdminUser, listAdminUsers, updateAdminUser } from '@/lib/api'
import type { AdminUser } from '@/shared/types'

const userSchema = z.object({
	email: z.string().trim().email('Geçerli bir e-posta girin.'),
	password: z.string().min(10, 'Şifre en az 10 karakter olmalı.'),
	role: z.enum(['admin', 'owner']),
})

type UserValues = z.input<typeof userSchema>

const passwordSchema = z
	.object({
		password: z.string().min(10, 'Şifre en az 10 karakter olmalı.'),
		confirm: z.string(),
	})
	.refine((values) => values.password === values.confirm, {
		message: 'Şifreler aynı değil.',
		path: ['confirm'],
	})

type PasswordValues = z.input<typeof passwordSchema>

export function UsersListPage() {
	const session = useAdminSession()
	const [users, setUsers] = useState<Array<AdminUser> | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [sheetOpen, setSheetOpen] = useState(false)
	const [confirmToggle, setConfirmToggle] = useState<AdminUser | null>(null)
	const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null)

	useTopbarActions(
		<Button size="sm" onClick={() => setSheetOpen(true)}>
			<PlusIcon />
			Yeni admin
		</Button>,
	)

	const form = useForm<UserValues>({
		resolver: zodResolver(userSchema),
		defaultValues: { email: '', password: '', role: 'admin' },
	})

	const passwordForm = useForm<PasswordValues>({
		resolver: zodResolver(passwordSchema),
		defaultValues: { password: '', confirm: '' },
	})

	async function loadUsers() {
		try {
			setUsers(await listAdminUsers())
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Yüklenemedi.')
		}
	}

	useEffect(() => {
		void loadUsers()
	}, [])

	if (session.user.role !== 'owner') {
		return <Navigate to="/admin" replace />
	}

	if (error) return <ErrorBlock message={error} />
	if (!users) return <RouteFallback />

	async function onSubmit(values: UserValues) {
		try {
			await createAdminUser(values)
			toast.success('Yeni admin oluşturuldu.')
			form.reset()
			setSheetOpen(false)
			await loadUsers()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Oluşturulamadı.')
		}
	}

	async function onSetPassword(values: PasswordValues) {
		if (!passwordUser) return
		try {
			await updateAdminUser(passwordUser.id, { password: values.password })
			toast.success(`${passwordUser.email} için yeni şifre kaydedildi.`)
			passwordForm.reset()
			setPasswordUser(null)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Şifre güncellenemedi.')
		}
	}

	async function toggleActive() {
		if (!confirmToggle) return
		try {
			await updateAdminUser(confirmToggle.id, { isActive: !confirmToggle.isActive })
			toast.success('Kullanıcı güncellendi.')
			setConfirmToggle(null)
			await loadUsers()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Güncellenemedi.')
		}
	}

	return (
		<div className="flex flex-col gap-8">
			<PageHeader
				eyebrow="Yönetim"
				title="Admin kullanıcıları"
				description="Owner ve admin rollerini yönet."
			/>

			{users.length === 0 ? (
				<EmptyState icon={UsersIcon} title="Henüz kullanıcı yok" />
			) : (
				<div className="overflow-hidden rounded-xl border border-border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>E-posta</TableHead>
								<TableHead>Rol</TableHead>
								<TableHead className="w-32">Durum</TableHead>
								<TableHead>Oluşturuldu</TableHead>
								<TableHead className="w-36" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user) => (
								<TableRow key={user.id}>
									<TableCell className="font-medium">{user.email}</TableCell>
									<TableCell>
										<Badge variant={user.role === 'owner' ? 'default' : 'outline'}>
											{user.role}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Switch
												checked={user.isActive}
												onCheckedChange={() => setConfirmToggle(user)}
												disabled={user.id === session.user.id}
												aria-label={user.isActive ? 'Pasifleştir' : 'Aktifleştir'}
											/>
											<span className="text-xs text-muted-foreground">
												{user.isActive ? 'Aktif' : 'Pasif'}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{new Date(user.createdAt).toLocaleDateString('tr-TR')}
									</TableCell>
									<TableCell className="text-right">
										<Button
											size="sm"
											variant="ghost"
											onClick={() => {
												passwordForm.reset()
												setPasswordUser(user)
											}}
										>
											<KeyRoundIcon />
											Şifre belirle
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent side="right" className="w-full max-w-md">
					<SheetHeader>
						<SheetTitle>Yeni admin kullanıcısı</SheetTitle>
						<SheetDescription>Bu kişi rehberi yönetebilir.</SheetDescription>
					</SheetHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 py-4">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>E-posta</FormLabel>
										<FormControl>
											<Input type="email" {...field} />
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
										<FormControl>
											<Input type="password" autoComplete="new-password" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Rol</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="admin">Admin</SelectItem>
												<SelectItem value="owner">Owner</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<SheetFooter className="gap-2 sm:flex-row">
								<Button type="submit" disabled={form.formState.isSubmitting}>
									{form.formState.isSubmitting && <Loader2Icon className="animate-spin" />}
									Oluştur
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>

			<Sheet open={!!passwordUser} onOpenChange={(open) => !open && setPasswordUser(null)}>
				<SheetContent side="right" className="w-full max-w-md">
					<SheetHeader>
						<SheetTitle>Şifre belirle</SheetTitle>
						<SheetDescription>
							{passwordUser?.email} için yeni şifre. Kaydedince bu kullanıcının açık oturumları
							kapanır; yeni şifreyi kişiye özel bir kanaldan ilet.
						</SheetDescription>
					</SheetHeader>
					<Form {...passwordForm}>
						<form
							onSubmit={passwordForm.handleSubmit(onSetPassword)}
							className="flex flex-col gap-4 px-4 py-4"
						>
							<FormField
								control={passwordForm.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Yeni şifre</FormLabel>
										<FormControl>
											<Input type="password" autoComplete="new-password" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={passwordForm.control}
								name="confirm"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Yeni şifre (tekrar)</FormLabel>
										<FormControl>
											<Input type="password" autoComplete="new-password" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<SheetFooter className="gap-2 sm:flex-row">
								<Button type="submit" disabled={passwordForm.formState.isSubmitting}>
									{passwordForm.formState.isSubmitting && <Loader2Icon className="animate-spin" />}
									Şifreyi kaydet
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>

			<ConfirmDialog
				open={!!confirmToggle}
				onOpenChange={(open) => !open && setConfirmToggle(null)}
				title={
					confirmToggle?.isActive
						? `${confirmToggle?.email} pasifleştirilsin mi?`
						: `${confirmToggle?.email} aktifleştirilsin mi?`
				}
				description={
					confirmToggle?.isActive
						? 'Pasif kullanıcı admin paneline giriş yapamaz.'
						: 'Kullanıcı tekrar admin paneline erişebilir hale gelecek.'
				}
				confirmLabel={confirmToggle?.isActive ? 'Pasifleştir' : 'Aktifleştir'}
				variant={confirmToggle?.isActive ? 'destructive' : 'default'}
				onConfirm={toggleActive}
			/>
		</div>
	)
}
