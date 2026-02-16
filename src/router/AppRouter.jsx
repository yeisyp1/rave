import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Dashboard from '../pages/Dashboard'
import Patients from '../pages/Patients'
import Calendar from '../pages/Calendar'
import Billing from '../pages/Billing'
import Documentation from '../pages/Documentation'
import Login from '../pages/Login'

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/documentation" element={<Documentation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
