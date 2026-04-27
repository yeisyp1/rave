import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayoutVW from '../layouts/AppLayoutVW'

import DashboardVW from '../pages/DashboardVW'
import PatientsVW from '../pages/PatientsVW'
import HistoriaClinicaVW from '../pages/HistoriaClinicaVW'
import CalendarVW from '../pages/CalendarVW'
import BillingVW from '../pages/BillingVW'
import DocumentationVW from '../pages/DocumentationVW'
import LoginVW from '../pages/LoginVW'
import LaboratoryVW from '../pages/LaboratoryVW'
import InventoryVW from '../pages/InventoryVW'
import HistoriesVW from '../pages/HistoriesVW'
import DoctorsVW from '../pages/DoctorsVW'
import AgendarCitaVW from '../pages/AgendarCitaVW'
import OdontogramaVW from '../pages/OdontogramaVW'
import ModalViewPatientsVW from '../modals/ModalViewPatientsVW'
import NewEventModalVW from '../modals/ModalNewEventVW'
import OAuthConsentVW from '../pages/OAuthConsentVW'

const AppRouter = ({ user }) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <LoginVW />}
        />

        <Route element={user ? <AppLayoutVW /> : <Navigate to="/login" />}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardVW />} />
          <Route path="/pacientes" element={<PatientsVW />} />
          <Route path="/modal-history/:patientId" element={<ModalViewPatientsVW />} />
          <Route path="/calendar" element={<CalendarVW />} />
          <Route path="/odontograma" element={<OdontogramaVW />} />
          <Route path="/odontograma/:patientId" element={<OdontogramaVW />} />
          <Route path="/new-event-modal" element={<NewEventModalVW />} />
          <Route path="/billing" element={<BillingVW />} />
          <Route path="/documentation" element={<DocumentationVW />} />
          <Route path="/laboratory" element={<LaboratoryVW />} />
          <Route path="/inventory" element={<InventoryVW />} />
          <Route path="/histories" element={<HistoriaClinicaVW />} />
          <Route path="/doctors" element={<DoctorsVW />} />
          <Route path="/agendarcita" element={<AgendarCitaVW />} />
          <Route path="/oauth/consent" element={<OAuthConsentVW />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter