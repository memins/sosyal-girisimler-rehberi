import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary'
import { SiteShell } from './layout/SiteShell'

const HomePage = lazy(() => import('./HomePage').then((m) => ({ default: m.HomePage })))
const SearchPage = lazy(() => import('./SearchPage').then((m) => ({ default: m.SearchPage })))
const EnterpriseDetailPage = lazy(() =>
	import('./EnterpriseDetailPage').then((m) => ({ default: m.EnterpriseDetailPage })),
)
const SubmissionPage = lazy(() =>
	import('./SubmissionPage').then((m) => ({ default: m.SubmissionPage })),
)
const AboutPage = lazy(() => import('./AboutPage').then((m) => ({ default: m.AboutPage })))
const LegalPage = lazy(() => import('./LegalPage'))
const NotFoundPage = lazy(() => import('./NotFoundPage'))

const AdminShell = lazy(() =>
	import('@/features/admin/layout/AdminShell').then((m) => ({ default: m.AdminShell })),
)
const LoginPage = lazy(() => import('@/features/admin/auth/LoginPage'))
const SetupPage = lazy(() => import('@/features/admin/auth/SetupPage'))
const DashboardPage = lazy(() => import('@/features/admin/dashboard/DashboardPage'))
const EnterprisesListPage = lazy(() =>
	import('@/features/admin/enterprises/EnterprisesListPage').then((m) => ({
		default: m.EnterprisesListPage,
	})),
)
const EnterpriseFormPage = lazy(() =>
	import('@/features/admin/enterprises/EnterpriseFormPage').then((m) => ({
		default: m.EnterpriseFormPage,
	})),
)
const SubmissionsListPage = lazy(() =>
	import('@/features/admin/submissions/SubmissionsListPage').then((m) => ({
		default: m.SubmissionsListPage,
	})),
)
const EditorialListPage = lazy(() =>
	import('@/features/admin/editorial/EditorialListPage').then((m) => ({
		default: m.EditorialListPage,
	})),
)
const EditorialFormPage = lazy(() =>
	import('@/features/admin/editorial/EditorialFormPage').then((m) => ({
		default: m.EditorialFormPage,
	})),
)
const UsersListPage = lazy(() =>
	import('@/features/admin/users/UsersListPage').then((m) => ({ default: m.UsersListPage })),
)
const MediaLibraryPage = lazy(() =>
	import('@/features/admin/media/MediaLibraryPage').then((m) => ({
		default: m.MediaLibraryPage,
	})),
)

export function App() {
	return (
		<ErrorBoundary>
			<Routes>
				<Route element={<SiteShell />}>
					<Route path="/" element={<HomePage />} />
					<Route path="/arama" element={<SearchPage />} />
					<Route path="/girisimler/:slug" element={<EnterpriseDetailPage />} />
					<Route path="/girisim-ekle" element={<SubmissionPage />} />
					<Route path="/hakkimizda" element={<AboutPage />} />
					<Route path="/gizlilik" element={<LegalPage kind="privacy" />} />
					<Route path="/kosullar" element={<LegalPage kind="terms" />} />
					<Route path="/iletisim" element={<LegalPage kind="contact" />} />
					<Route path="*" element={<NotFoundPage />} />
				</Route>
				<Route path="/admin/login" element={<LoginPage />} />
				<Route path="/admin/setup" element={<SetupPage />} />
				<Route path="/admin" element={<AdminShell />}>
					<Route index element={<DashboardPage />} />
					<Route path="enterprises" element={<EnterprisesListPage />} />
					<Route path="enterprises/new" element={<EnterpriseFormPage mode="create" />} />
					<Route path="enterprises/:id/edit" element={<EnterpriseFormPage mode="edit" />} />
					<Route path="submissions" element={<SubmissionsListPage />} />
					<Route path="editorial-lists" element={<EditorialListPage />} />
					<Route path="editorial-lists/new" element={<EditorialFormPage mode="create" />} />
					<Route
						path="editorial-lists/:id/edit"
						element={<EditorialFormPage mode="edit" />}
					/>
					<Route path="users" element={<UsersListPage />} />
					<Route path="media" element={<MediaLibraryPage />} />
				</Route>
			</Routes>
		</ErrorBoundary>
	)
}
