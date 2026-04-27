import AppRouter from '../routes/AppRouter'
import { useAuthSessionCtrl } from './AuthSessionCtrl'

function AppCtrl() {
  const { user, loading } = useAuthSessionCtrl()

  if (loading) return <p>Cargando...</p>

  return <AppRouter user={user} />
}

export default AppCtrl