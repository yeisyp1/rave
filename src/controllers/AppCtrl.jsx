import AppRouter from '../routes/AppRouter'
import { useAuthSessionCtrl } from './AuthSessionCtrl'
import LoaderVW from '../components/LoaderVW'
import AlertModalVW from '../components/AlertModalVW'

function AppCtrl() {
  const { user, profile, loading } = useAuthSessionCtrl()

  if (loading) return <LoaderVW text="Cargando sesion..." />

  return (
    <>
      <AppRouter user={user} profile={profile} />
      <AlertModalVW />
    </>
  )
}

export default AppCtrl
