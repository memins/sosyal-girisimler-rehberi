import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
	approveSubmission,
	bootstrapOwner,
	createAdminUser,
	getBootstrapStatus,
	getAdminSummary,
	getCurrentAdmin,
	listAdminEditorialLists,
	listAdminEnterprises,
	listAdminUsers,
	listSubmissions,
	loginAdmin,
	logoutAdmin,
	saveEditorialList,
	saveEnterprise,
	updateAdminUser,
	uploadMedia,
} from '@/lib/api'
import type { AdminUser, BootstrapStatus, CurrentAdmin, EditorialList, EnterpriseSummary, Submission } from '@/shared/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ErrorBlock } from '@/components/StateBlock'

type AdminSummary = {
	enterprises: number
	pendingSubmissions: number
	editorialLists: number
}

export function AdminPage() {
	const [summary, setSummary] = useState<AdminSummary | null>(null)
	const [enterprises, setEnterprises] = useState<Array<EnterpriseSummary>>([])
	const [submissions, setSubmissions] = useState<Array<Submission>>([])
	const [editorialLists, setEditorialLists] = useState<Array<EditorialList>>([])
	const [adminUsers, setAdminUsers] = useState<Array<AdminUser>>([])
	const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus | null>(null)
	const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [lastMediaKey, setLastMediaKey] = useState<string | null>(null)

	useEffect(() => {
		initializeAdmin().catch((currentError: Error) => setError(currentError.message))
		// Admin bootstrapping should run once on page load.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	async function initializeAdmin() {
		const status = await getBootstrapStatus()
		setBootstrapStatus(status)

		if (status.needsSetup) {
			return
		}

		try {
			const admin = await getCurrentAdmin()
			setCurrentAdmin(admin)
			await refreshAdminData(admin)
		} catch {
			setCurrentAdmin(null)
		}
	}

	async function refreshAdminData(admin = currentAdmin) {
		const [nextSummary, nextEnterprises, nextSubmissions, nextEditorialLists] = await Promise.all([
			getAdminSummary(),
			listAdminEnterprises(),
			listSubmissions(),
			listAdminEditorialLists(),
		])
		setSummary(nextSummary)
		setEnterprises(nextEnterprises.items)
		setSubmissions(nextSubmissions)
		setEditorialLists(nextEditorialLists)

		if (admin?.user.role === 'owner') {
			setAdminUsers(await listAdminUsers())
		} else {
			setAdminUsers([])
		}
	}

	async function handleSetupSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const formData = new FormData(event.currentTarget)

		try {
			const admin = await bootstrapOwner({
				email: String(formData.get('email') ?? ''),
				password: String(formData.get('password') ?? ''),
			})
			setCurrentAdmin(admin)
			setBootstrapStatus({ needsSetup: false, ownerEmail: admin.user.email })
			await refreshAdminData(admin)
			toast.success('İlk admin hesabı oluşturuldu.')
		} catch (currentError) {
			toast.error(currentError instanceof Error ? currentError.message : 'Admin kurulumu tamamlanamadı.')
		}
	}

	async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const formData = new FormData(event.currentTarget)

		try {
			const admin = await loginAdmin({
				email: String(formData.get('email') ?? ''),
				password: String(formData.get('password') ?? ''),
			})
			setCurrentAdmin(admin)
			await refreshAdminData(admin)
			toast.success('Admin oturumu açıldı.')
		} catch (currentError) {
			toast.error(currentError instanceof Error ? currentError.message : 'Giriş yapılamadı.')
		}
	}

	async function handleLogout() {
		await logoutAdmin()
		setCurrentAdmin(null)
		setSummary(null)
		setEnterprises([])
		setSubmissions([])
		setEditorialLists([])
		setAdminUsers([])
	}

	async function handleAdminUserSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const formData = new FormData(event.currentTarget)

		try {
			await createAdminUser({
				email: String(formData.get('email') ?? ''),
				password: String(formData.get('password') ?? ''),
				role: formData.get('role') === 'owner' ? 'owner' : 'admin',
			})
			event.currentTarget.reset()
			await refreshAdminData()
			toast.success('Admin kullanıcısı eklendi.')
		} catch (currentError) {
			toast.error(currentError instanceof Error ? currentError.message : 'Admin kullanıcısı eklenemedi.')
		}
	}

	async function handleToggleAdminUser(user: AdminUser) {
		try {
			await updateAdminUser(user.id, { isActive: !user.isActive })
			await refreshAdminData()
			toast.success('Admin kullanıcısı güncellendi.')
		} catch (currentError) {
			toast.error(currentError instanceof Error ? currentError.message : 'Admin kullanıcısı güncellenemedi.')
		}
	}

	async function handleApproveSubmission(id: string) {
		try {
			await approveSubmission(id)
			await refreshAdminData()
			toast.success('Öneri taslak girişime dönüştürüldü.')
		} catch (currentError) {
			toast.error(currentError instanceof Error ? currentError.message : 'Öneri onaylanamadı.')
		}
	}

	async function handleEnterpriseSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const formData = new FormData(event.currentTarget)

		try {
			await saveEnterprise({
				name: String(formData.get('name') ?? ''),
				slug: String(formData.get('slug') ?? ''),
				shortDescription: String(formData.get('shortDescription') ?? ''),
				problem: String(formData.get('problem') ?? ''),
				solution: String(formData.get('solution') ?? ''),
				impact: String(formData.get('impact') ?? ''),
				websiteUrl: String(formData.get('websiteUrl') ?? ''),
				instagramUrl: String(formData.get('instagramUrl') ?? ''),
				logoKey: String(formData.get('logoKey') ?? ''),
				coverKey: String(formData.get('coverKey') ?? ''),
				status: 'published',
				isFeatured: formData.get('isFeatured') === 'on',
				categoryIds: splitInput(String(formData.get('categoryIds') ?? '')),
				audienceIds: splitInput(String(formData.get('audienceIds') ?? '')),
				businessModelIds: splitInput(String(formData.get('businessModelIds') ?? '')),
				countryCodes: splitInput(String(formData.get('countryCodes') ?? '')),
				sdgIds: splitInput(String(formData.get('sdgIds') ?? '')).map((value) => Number(value)),
			})
			event.currentTarget.reset()
			await refreshAdminData()
			toast.success('Girişim kaydedildi.')
		} catch (currentError) {
			toast.error(currentError instanceof Error ? currentError.message : 'Girişim kaydedilemedi.')
		}
	}

	async function handleEditorialSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const formData = new FormData(event.currentTarget)

		try {
			await saveEditorialList({
				title: String(formData.get('title') ?? ''),
				slug: String(formData.get('slug') ?? ''),
				description: String(formData.get('description') ?? ''),
				status: 'published',
				enterpriseIds: splitInput(String(formData.get('enterpriseIds') ?? '')),
			})
			event.currentTarget.reset()
			await refreshAdminData()
			toast.success('Editöryal liste kaydedildi.')
		} catch (currentError) {
			toast.error(currentError instanceof Error ? currentError.message : 'Editöryal liste kaydedilemedi.')
		}
	}

	async function handleMediaSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const formData = new FormData(event.currentTarget)
		const file = formData.get('file')

		if (!(file instanceof File) || file.size === 0) {
			toast.error('Yüklenecek dosya seçin.')
			return
		}

		try {
			const result = await uploadMedia(file)
			setLastMediaKey(result.key)
			event.currentTarget.reset()
			toast.success('Medya R2 bucket içine yüklendi.')
		} catch (currentError) {
			toast.error(currentError instanceof Error ? currentError.message : 'Medya yüklenemedi.')
		}
	}

	return (
		<div className="flex flex-col gap-8">
			<header className="flex flex-col gap-2">
				<p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">Admin</p>
				<h1 className="text-4xl font-semibold tracking-tight">İçerik yönetimi</h1>
				<p className="text-muted-foreground">E-posta ve şifre ile korunan editör çalışma alanı.</p>
			</header>

			{error ? <ErrorBlock message={error} /> : null}
			{bootstrapStatus?.needsSetup ? (
				<SetupForm ownerEmail={bootstrapStatus.ownerEmail} onSubmit={handleSetupSubmit} />
			) : null}
			{bootstrapStatus && !bootstrapStatus.needsSetup && !currentAdmin ? (
				<LoginForm onSubmit={handleLoginSubmit} />
			) : null}
			{currentAdmin ? (
				<div className="flex items-center justify-between rounded-2xl border bg-card p-4">
					<p className="text-sm text-muted-foreground">
						Giriş yapan: <span className="font-medium text-foreground">{currentAdmin.user.email}</span>
					</p>
					<Button type="button" variant="outline" onClick={handleLogout}>
						Çıkış yap
					</Button>
				</div>
			) : null}
			{currentAdmin ? (
				<>
			{summary ? (
				<section className="grid gap-4 md:grid-cols-3">
					<MetricCard label="Girişim" value={summary.enterprises} />
					<MetricCard label="Bekleyen öneri" value={summary.pendingSubmissions} />
					<MetricCard label="Editöryal liste" value={summary.editorialLists} />
				</section>
			) : null}

			<Tabs defaultValue="enterprises">
				<TabsList>
					<TabsTrigger value="enterprises">Girişimler</TabsTrigger>
					<TabsTrigger value="submissions">Öneriler</TabsTrigger>
					<TabsTrigger value="editorial">Editöryal listeler</TabsTrigger>
					{currentAdmin.user.role === 'owner' ? <TabsTrigger value="users">Adminler</TabsTrigger> : null}
				</TabsList>
				<TabsContent value="enterprises" className="mt-6">
					<div className="grid gap-6 lg:grid-cols-[1fr_420px]">
						<div className="flex flex-col gap-6">
							<EnterpriseTable enterprises={enterprises} />
							<MediaUploadForm lastMediaKey={lastMediaKey} onSubmit={handleMediaSubmit} />
						</div>
						<EnterpriseForm onSubmit={handleEnterpriseSubmit} lastMediaKey={lastMediaKey} />
					</div>
				</TabsContent>
				<TabsContent value="submissions" className="mt-6">
					<SubmissionTable submissions={submissions} onApprove={handleApproveSubmission} />
				</TabsContent>
				<TabsContent value="editorial" className="mt-6">
					<div className="grid gap-6 lg:grid-cols-[1fr_420px]">
						<EditorialTable editorialLists={editorialLists} />
						<EditorialForm onSubmit={handleEditorialSubmit} />
					</div>
				</TabsContent>
				{currentAdmin.user.role === 'owner' ? (
					<TabsContent value="users" className="mt-6">
						<div className="grid gap-6 lg:grid-cols-[1fr_420px]">
							<AdminUsersTable users={adminUsers} onToggle={handleToggleAdminUser} />
							<AdminUserForm onSubmit={handleAdminUserSubmit} />
						</div>
					</TabsContent>
				) : null}
			</Tabs>
				</>
			) : null}
		</div>
	)
}

function SetupForm({
	ownerEmail,
	onSubmit,
}: {
	ownerEmail: string
	onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
	return (
		<Card className="max-w-xl">
			<CardHeader>
				<CardTitle>İlk admin kurulumu</CardTitle>
				<CardDescription>
					Bu adım sadece ilk kurulumda çalışır. Yeni ve güçlü bir şifre belirleyin.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<TextField name="email" label="Owner e-posta" defaultValue={ownerEmail} readOnly />
					<TextField name="password" label="Yeni şifre" type="password" minLength={10} required />
					<Button type="submit">Owner hesabını oluştur</Button>
				</form>
			</CardContent>
		</Card>
	)
}

function LoginForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
	return (
		<Card className="max-w-xl">
			<CardHeader>
				<CardTitle>Admin girişi</CardTitle>
				<CardDescription>Bu sayfaya erişmek için admin hesabınızla giriş yapın.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<TextField name="email" label="E-posta" placeholder="m.emins@yahoo.com" required />
					<TextField name="password" label="Şifre" type="password" minLength={10} required />
					<Button type="submit">Giriş yap</Button>
				</form>
			</CardContent>
		</Card>
	)
}

type MetricCardProps = {
	label: string
	value: number
}

function MetricCard({ label, value }: MetricCardProps) {
	return (
		<Card>
			<CardContent className="p-6">
				<p className="text-3xl font-semibold">{value}</p>
				<p className="mt-1 text-sm text-muted-foreground">{label}</p>
			</CardContent>
		</Card>
	)
}

function EnterpriseTable({ enterprises }: { enterprises: Array<EnterpriseSummary> }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Girişimler</CardTitle>
				<CardDescription>Yayınlanan ve taslak girişimler.</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Ad</TableHead>
							<TableHead>Kategoriler</TableHead>
							<TableHead>Öne çıkan</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{enterprises.map((enterprise) => (
							<TableRow key={enterprise.id}>
								<TableCell>{enterprise.name}</TableCell>
								<TableCell>{enterprise.categories.map((category) => category.name).join(', ')}</TableCell>
								<TableCell>{enterprise.isFeatured ? <Badge>Vitrin</Badge> : <Badge variant="outline">Normal</Badge>}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	)
}

function EnterpriseForm({
	onSubmit,
	lastMediaKey,
}: {
	onSubmit: (event: FormEvent<HTMLFormElement>) => void
	lastMediaKey: string | null
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Yeni girişim</CardTitle>
				<CardDescription>Taxonomi alanlarında id değerlerini virgülle yazın.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<FieldGroup>
						<TextField name="name" label="Ad" />
						<TextField name="slug" label="Slug" />
						<TextField name="shortDescription" label="Kısa açıklama" />
						<TextField name="websiteUrl" label="Web sitesi" />
						<TextField name="instagramUrl" label="Instagram" />
						<TextField name="logoKey" label="Logo R2 anahtarı" placeholder={lastMediaKey ?? 'uploads/logo.png'} />
						<TextField name="coverKey" label="Kapak R2 anahtarı" placeholder={lastMediaKey ?? 'uploads/cover.png'} />
						<TextField name="categoryIds" label="Kategori idleri" placeholder="cevre,egitim" />
						<TextField name="audienceIds" label="Hedef kitle idleri" placeholder="gencler" />
						<TextField name="businessModelIds" label="İş modeli idleri" placeholder="sosyal-girisim" />
						<TextField name="countryCodes" label="Ülke kodları" placeholder="TR,global" />
						<TextField name="sdgIds" label="SKA idleri" placeholder="4,13" />
					</FieldGroup>
					<TextAreaField name="problem" label="Gündem" />
					<TextAreaField name="solution" label="Çözüm" />
					<TextAreaField name="impact" label="Sosyal etki" />
					<label className="flex items-center gap-2 text-sm">
						<input name="isFeatured" type="checkbox" />
						Haftanın girişimlerinde göster
					</label>
					<Button type="submit">Kaydet</Button>
				</form>
			</CardContent>
		</Card>
	)
}

function MediaUploadForm({
	lastMediaKey,
	onSubmit,
}: {
	lastMediaKey: string | null
	onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>R2 medya yükleme</CardTitle>
				<CardDescription>Logo veya kapak görselini yükleyin, oluşan anahtarı girişim formunda kullanın.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<Field>
						<FieldLabel htmlFor="file">Dosya</FieldLabel>
						<Input id="file" name="file" type="file" accept="image/*" />
					</Field>
					<Button type="submit">R2’ye yükle</Button>
					{lastMediaKey ? (
						<p className="rounded-md bg-secondary p-3 text-sm">
							Son yüklenen anahtar: <code>{lastMediaKey}</code>
						</p>
					) : null}
				</form>
			</CardContent>
		</Card>
	)
}

function SubmissionTable({
	submissions,
	onApprove,
}: {
	submissions: Array<Submission>
	onApprove: (id: string) => void
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Kullanıcı önerileri</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Ad</TableHead>
							<TableHead>Durum</TableHead>
							<TableHead>İletişim</TableHead>
							<TableHead className="text-right">Aksiyon</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{submissions.map((submission) => (
							<TableRow key={submission.id}>
								<TableCell>{submission.name}</TableCell>
								<TableCell>
									<Badge variant={submission.status === 'pending' ? 'secondary' : 'outline'}>
										{submission.status}
									</Badge>
								</TableCell>
								<TableCell>{submission.contactEmail}</TableCell>
								<TableCell className="text-right">
									<Button
										type="button"
										size="sm"
										disabled={submission.status !== 'pending'}
										onClick={() => onApprove(submission.id)}
									>
										Taslağa çevir
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	)
}

function EditorialTable({ editorialLists }: { editorialLists: Array<EditorialList> }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Editöryal listeler</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Başlık</TableHead>
							<TableHead>Durum</TableHead>
							<TableHead>Girişim</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{editorialLists.map((list) => (
							<TableRow key={list.id}>
								<TableCell>{list.title}</TableCell>
								<TableCell>{list.status}</TableCell>
								<TableCell>{list.items.length}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	)
}

function EditorialForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Yeni liste</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<TextField name="title" label="Başlık" />
					<TextField name="slug" label="Slug" />
					<TextField name="enterpriseIds" label="Girişim idleri" placeholder="ent-fazla,ent-apopo" />
					<TextAreaField name="description" label="Açıklama" />
					<Button type="submit">Listeyi kaydet</Button>
				</form>
			</CardContent>
		</Card>
	)
}

function AdminUsersTable({
	users,
	onToggle,
}: {
	users: Array<AdminUser>
	onToggle: (user: AdminUser) => void
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Admin kullanıcıları</CardTitle>
				<CardDescription>Aktif adminler panele giriş yapabilir.</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>E-posta</TableHead>
							<TableHead>Rol</TableHead>
							<TableHead>Durum</TableHead>
							<TableHead className="text-right">Aksiyon</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.map((user) => (
							<TableRow key={user.id}>
								<TableCell>{user.email}</TableCell>
								<TableCell>{user.role}</TableCell>
								<TableCell>
									<Badge variant={user.isActive ? 'default' : 'outline'}>
										{user.isActive ? 'Aktif' : 'Pasif'}
									</Badge>
								</TableCell>
								<TableCell className="text-right">
									<Button type="button" size="sm" variant="outline" onClick={() => onToggle(user)}>
										{user.isActive ? 'Pasifleştir' : 'Aktifleştir'}
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	)
}

function AdminUserForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Yeni admin</CardTitle>
				<CardDescription>Eklenen kullanıcı belirlenen şifreyle giriş yapabilir.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<TextField name="email" label="E-posta" placeholder="editor@example.com" />
					<TextField name="password" label="Geçici şifre" type="password" />
					<Field>
						<FieldLabel htmlFor="role">Rol</FieldLabel>
						<select
							id="role"
							name="role"
							className="h-9 rounded-md border bg-background px-3 text-sm"
							defaultValue="admin"
						>
							<option value="admin">admin</option>
							<option value="owner">owner</option>
						</select>
					</Field>
					<Button type="submit">Admin ekle</Button>
				</form>
			</CardContent>
		</Card>
	)
}

type TextFieldProps = {
	name: string
	label: string
	placeholder?: string
	type?: string
	defaultValue?: string
	readOnly?: boolean
	required?: boolean
	minLength?: number
}

function TextField({
	name,
	label,
	placeholder,
	type = 'text',
	defaultValue,
	readOnly = false,
	required = false,
	minLength,
}: TextFieldProps) {
	return (
		<Field>
			<FieldLabel htmlFor={name}>{label}</FieldLabel>
			<Input
				id={name}
				name={name}
				placeholder={placeholder}
				type={type}
				defaultValue={defaultValue}
				readOnly={readOnly}
				required={required}
				minLength={minLength}
			/>
		</Field>
	)
}

function TextAreaField({ name, label }: TextFieldProps) {
	return (
		<Field>
			<FieldLabel htmlFor={name}>{label}</FieldLabel>
			<Textarea id={name} name={name} rows={3} />
		</Field>
	)
}

function splitInput(value: string): Array<string> {
	return value
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
}
