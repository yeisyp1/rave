import AppRouter from '../routes/AppRouter'
import { useAuthSessionCtrl } from './AuthSessionCtrl'
import LoaderVW from '../components/LoaderVW'

function AppCtrl() {
  const { user, profile, loading } = useAuthSessionCtrl()

  if (loading) return <LoaderVW text="Cargando sesion..." />

  return <AppRouter user={user} profile={profile} />
}

export default AppCtrl
