import AppRouter from '../routes/AppRouter'
import { useAuthSessionCtrl } from './AuthSessionCtrl'
import LoaderVW from '../components/LoaderVW'
import AlertModalVW from '../components/AlertModalVW'
import ConfirmDialogVW from '../components/ConfirmDialogVW'
import ErrorBoundaryVW from '../components/ErrorBoundaryVW'
import { ProfileProvider } from '../context/ProfileContext'

function AppCtrl() {
  const { user, profile, loading } = useAuthSessionCtrl()

  if (loading) return <LoaderVW text="Cargando sesión..." />

  return (
    <ErrorBoundaryVW>
      <ProfileProvider profile={profile}>
        <AppRouter user={user} profile={profile} />
        <AlertModalVW />
        <ConfirmDialogVW />
      </ProfileProvider>
    </ErrorBoundaryVW>
  )
}

export default AppCtrl
