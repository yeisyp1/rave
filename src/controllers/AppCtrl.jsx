import AppRouter from '../routes/AppRouter'
import { useAuthSessionCtrl } from './AuthSessionCtrl'
import LoaderVW from '../components/LoaderVW'
import AlertModalVW from '../components/AlertModalVW'
import { ProfileProvider } from '../context/ProfileContext'

function AppCtrl() {
  const { user, profile, loading } = useAuthSessionCtrl()

  if (loading) return <LoaderVW text="Cargando sesion..." />

  return (
    <ProfileProvider profile={profile}>
      <AppRouter user={user} profile={profile} />
      <AlertModalVW />
    </ProfileProvider>
  )
}

export default AppCtrl
