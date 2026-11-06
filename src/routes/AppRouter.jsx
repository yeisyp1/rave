import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayoutVW from '../layouts/AppLayoutVW'

import { hasRole, ROLES } from '../utils/roles'

const DashboardVW = lazy(() => import('../pages/DashboardVW'))
const PatientsVW = lazy(() => import('../pages/PatientsVW'))
const PatientDetailVW = lazy(() => import('../pages/PatientDetailVW'))
const HistoriaClinicaVW = lazy(() => import('../pages/HistoriaClinicaVW'))
const CalendarVW = lazy(() => import('../pages/CalendarVW'))
const BillingVW = lazy(() => import('../pages/BillingVW'))
const DocumentationVW = lazy(() => import('../pages/DocumentationVW'))
const LoginVW = lazy(() => import('../pages/LoginVW'))
const LaboratoryVW = lazy(() => import('../pages/LaboratoryVW'))
const InventoryVW = lazy(() => import('../pages/InventoryVW'))
const OdontologosVW = lazy(() => import('../pages/OdontologosVW'))
const MessageTemplatesVW = lazy(() => import('../pages/MessageTemplatesVW'))
const DataRequestsVW = lazy(() => import('../pages/DataRequestsVW'))
const WhatsappRequestsVW = lazy(() => import('../pages/WhatsappRequestsVW'))
const HistoriesVW = lazy(() => import('../pages/HistoriesVW'))
const DoctorsVW = lazy(() => import('../pages/DoctorsVW'))
const SettingsVW = lazy(() => import('../pages/SettingsVW'))
const AgendarCitaVW = lazy(() => import('../pages/AgendarCitaVW'))
const OdontogramaVW = lazy(() => import('../pages/OdontogramaVW'))
const ModalViewPatientsVW = lazy(() => import('../modals/ModalViewPatientsVW'))
const NewEventModalVW = lazy(() => import('../modals/ModalNewEventVW'))
const OAuthConsentVW = lazy(() => import('../pages/OAuthConsentVW'))
const PublicHomeVW = lazy(() => import('../pages/PublicHomeVW'))
const PrivacyPolicyVW = lazy(() => import('../pages/PrivacyPolicyVW'))
const AccessActionVW = lazy(() => import('../pages/AccessActionVW'))

const AdminRoute = ({ profile, children }) => {
  return hasRole(profile, [ROLES.ADMIN]) ? children : <Navigate to="/dashboard" replace />
}

const ClinicalRoute = ({ profile, children }) => {
  return hasRole(profile, [ROLES.ADMIN, ROLES.DENTIST]) ? children : <Navigate to="/dashboard" replace />
}

const AppRouter = ({ user, profile }) => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: 24 }}>Cargando…</div>}>
      <Routes>
        <Route path="/" element={<PublicHomeVW />} />
        <Route path="/politica-privacidad" element={<PrivacyPolicyVW />} />
        <Route path="/crear-contrasena" element={<AccessActionVW mode="create" />} />
        <Route path="/recuperar-contrasena" element={<AccessActionVW mode="recover" />} />
        <Route path="/restablecer-contrasena" element={<AccessActionVW mode="reset" />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <LoginVW />}
        />

        <Route element={user ? <AppLayoutVW user={user} profile={profile} /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<DashboardVW />} />
          <Route path="/pacientes" element={<PatientsVW />} />
          <Route path="/pacientes/:patientId" element={<PatientDetailVW />} />
          <Route path="/modal-history/:patientId" element={<ModalViewPatientsVW />} />
          <Route path="/calendar" element={<CalendarVW />} />
          <Route path="/odontograma" element={<OdontogramaVW />} />
          <Route path="/odontograma/:patientId" element={<OdontogramaVW />} />
          <Route path="/new-event-modal" element={<NewEventModalVW />} />
          <Route path="/billing" element={<AdminRoute profile={profile}><BillingVW /></AdminRoute>} />
          <Route path="/documentation" element={<AdminRoute profile={profile}><DocumentationVW /></AdminRoute>} />
          <Route path="/laboratory" element={<ClinicalRoute profile={profile}><LaboratoryVW /></ClinicalRoute>} />
          <Route path="/inventory" element={<ClinicalRoute profile={profile}><InventoryVW /></ClinicalRoute>} />
          <Route path="/plantillas" element={<AdminRoute profile={profile}><MessageTemplatesVW /></AdminRoute>} />
          <Route path="/solicitudes-datos" element={<AdminRoute profile={profile}><DataRequestsVW /></AdminRoute>} />
          <Route path="/whatsapp-solicitudes" element={<AdminRoute profile={profile}><WhatsappRequestsVW /></AdminRoute>} />
          <Route path="/histories" element={<HistoriaClinicaVW />} />
          <Route path="/doctors" element={<AdminRoute profile={profile}><DoctorsVW /></AdminRoute>} />
          <Route path="/odontologos" element={<AdminRoute profile={profile}><OdontologosVW /></AdminRoute>} />
          <Route path="/settings" element={<AdminRoute profile={profile}><SettingsVW /></AdminRoute>} />
          <Route path="/agendarcita" element={<AgendarCitaVW />} />
          <Route path="/oauth/consent" element={<OAuthConsentVW />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default AppRouter
