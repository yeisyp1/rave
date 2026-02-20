import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'

import Dashboard from '../pages/Dashboard'
import Patients from '../pages/Patients'
import Calendar from '../pages/Calendar'
import Billing from '../pages/Billing'
import Documentation from '../pages/Documentation'
import Login from '../pages/Login'

import Laboratory from '../pages/Laboratory'
import Inventory from '../pages/Inventory'
import Histories from '../pages/Histories'
import Doctors from '../pages/Doctors'
import AgendarCita from '../pages/AgendarCita'

const AppRouter = ({ user }) => {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login />}
        />

        {/* RUTAS PRIVADAS */}
        <Route
          element={user ? <Layout /> : <Navigate to="/login" />}
        >

          <Route path="/" element={<Navigate to="/dashboard" />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/laboratory" element={<Laboratory />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/histories" element={<Histories />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/agendarcita" element={<AgendarCita />} />
          <Route path="/oauth/consent" element={<Navigate to="/dashboard" />} />

        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
