import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { FiRefreshCw, FiTrash2, FiUserPlus, FiUsers, FiMail } from 'react-icons/fi'
import LoaderVW from '../components/LoaderVW'
import { showAlertModal } from '../app/store'
import {
  DOCTOR_EMPTY_FORM,
  DOCTOR_ROLE_LABELS,
  authorizeUserCtrl,
  computeDoctorsStatsCtrl,
  getPasswordActionLabel,
  loadAuthorizedUsersCtrl,
  normalizeUserEmailCtrl,
  sendPasswordSetupEmailCtrl,
  setAuthorizedUserActiveCtrl,
} from '../controllers/DoctorsCtrl'
import '../styles/AdminViewsVW.css'

const DoctorsVW = () => {
  const dispatch = useDispatch()
  const [authorizedUsers, setAuthorizedUsers] = useState([])
  const [profiles, setProfiles] = useState([])
  const [form, setForm] = useState(DOCTOR_EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const profileByEmail = useMemo(() => {
    return new Map(profiles.map((profile) => [normalizeUserEmailCtrl(profile.email ?? ''), profile]))
  }, [profiles])

  const loadUsers = async () => {
    setLoading(true)
    setMessage('')

    const { authorizedUsers: users, authorizedError, profiles: staffProfiles, profilesError } = await loadAuthorizedUsersCtrl()

    if (authorizedError) {
      setMessage(`No se pudo cargar authorized_emails: ${authorizedError.message}`)
    } else {
      setAuthorizedUsers(users)
    }

    if (profilesError) {
      setMessage((current) => current || `No se pudo cargar profiles: ${profilesError.message}`)
    } else {
      setProfiles(staffProfiles)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)

    const result = await authorizeUserCtrl(form)
    dispatch(showAlertModal({ message: result.message, variant: result.ok ? 'success' : 'error' }))

    if (result.ok) {
      setForm(DOCTOR_EMPTY_FORM)
      await loadUsers()
    }

    setSaving(false)
  }

  const handleDeactivate = async (row) => {
    if (!confirm(`¿Desactivar a ${row.email}?`)) return

    const result = await setAuthorizedUserActiveCtrl(row.id, false)
    if (!result.ok) {
      dispatch(showAlertModal({ message: result.message, variant: 'error' }))
      return
    }

    await loadUsers()
  }

  const handleActivate = async (row) => {
    const result = await setAuthorizedUserActiveCtrl(row.id, true)
    if (!result.ok) {
      dispatch(showAlertModal({ message: result.message, variant: 'error' }))
      return
    }

    await loadUsers()
  }

  const handleSendPasswordSetup = async (row, hasProfile) => {
    if (!row.active) {
      dispatch(showAlertModal({ message: 'Activa primero este usuario para enviarle el correo.', variant: 'error' }))
      return
    }

    const actionLabel = getPasswordActionLabel(hasProfile)
    const confirmed = confirm(`¿Enviar a ${row.email} un correo para ${actionLabel} su contraseña?`)
    if (!confirmed) return

    const result = await sendPasswordSetupEmailCtrl(row, hasProfile)
    dispatch(showAlertModal({ message: result.message, variant: result.ok ? 'success' : 'error' }))
  }

  const handleEdit = (row) => {
    setForm({
      full_name: row.full_name ?? '',
      email: row.email ?? '',
      role: row.role ?? 'assistant',
    })
  }

  const { totalAdmins, totalDentists, totalAssistants, totalActive } = computeDoctorsStatsCtrl(authorizedUsers, profileByEmail)

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Usuarios</h1>
        </div>
        <button className="admin-btn" onClick={loadUsers} disabled={loading}>
          <FiRefreshCw /> Actualizar
        </button>
      </div>

      <div className="admin-grid">
        <div className="admin-card admin-stat">
          <div>
            <div className="admin-stat-value">{authorizedUsers.length}</div>
            <div className="admin-stat-label">usuarios autorizados</div>
          </div>
          <span className="admin-icon"><FiUsers /></span>
        </div>
        <div className="admin-card admin-stat">
          <div>
            <div className="admin-stat-value">{totalAdmins}</div>
            <div className="admin-stat-label">administradores</div>
          </div>
          <span className="admin-icon"><FiUserPlus /></span>
        </div>
        <div className="admin-card admin-stat">
          <div>
            <div className="admin-stat-value">{totalDentists}</div>
            <div className="admin-stat-label">odontólogas</div>
          </div>
          <span className="admin-icon"><FiUserPlus /></span>
        </div>
        <div className="admin-card admin-stat">
          <div>
            <div className="admin-stat-value">{totalAssistants}</div>
            <div className="admin-stat-label">asistentes</div>
          </div>
          <span className="admin-icon"><FiUserPlus /></span>
        </div>
        <div className="admin-card admin-stat">
          <div>
            <div className="admin-stat-value">{totalActive}</div>
            <div className="admin-stat-label">con perfil activo</div>
          </div>
          <span className="admin-icon"><FiUsers /></span>
        </div>
      </div>

      <div className="admin-grid two">
        <div className="admin-card">
          <h2 className="admin-card-title">Nuevo acceso</h2>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-field">
              <label>Nombre</label>
              <input
                className="admin-input"
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                placeholder="Nombre del profesional"
                required
              />
            </div>
            <div className="admin-field">
              <label>Correo</label>
              <input
                className="admin-input"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="doctor@clinica.com"
                required
              />
            </div>
            <div className="admin-field">
              <label>Rol</label>
              <select
                className="admin-select"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              >
                <option value="assistant">Asistente</option>
                <option value="dentist">Odontóloga</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="admin-actions">
              <button className="admin-btn primary" type="submit" disabled={saving}>
                <FiUserPlus /> {saving ? 'Guardando...' : 'Autorizar'}
              </button>
            </div>
          </form>
          {message && <p className="admin-message">{message}</p>}
        </div>

        <div className="admin-card">
          <h2 className="admin-card-title">Permisos</h2>
          <div className="admin-list">
            <div className="admin-list-row">
              <div>
                <div className="admin-row-title">Administrador</div>
                <div className="admin-row-sub">Acceso total, usuarios, pagos, inventario y laboratorio.</div>
              </div>
              <span className="admin-pill">admin</span>
            </div>
            <div className="admin-list-row">
              <div>
                <div className="admin-row-title">Odontóloga</div>
                <div className="admin-row-sub">Pacientes, citas, historias clínicas, odontograma y planes de tratamiento.</div>
              </div>
              <span className="admin-pill good">dentist</span>
            </div>
            <div className="admin-list-row">
              <div>
                <div className="admin-row-title">Asistente</div>
                <div className="admin-row-sub">Pacientes, citas, historias clínicas y odontograma.</div>
              </div>
              <span className="admin-pill good">assistant</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Usuarios autorizados</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Perfil</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><LoaderVW text="Cargando usuarios..." className="loader-inline" /></td></tr>
              ) : authorizedUsers.length === 0 ? (
                <tr><td colSpan="6" className="admin-empty">No hay usuarios autorizados.</td></tr>
              ) : (
                authorizedUsers.map((row) => {
                  const profile = profileByEmail.get(normalizeUserEmailCtrl(row.email ?? ''))
                  return (
                    <tr key={row.id ?? row.email}>
                      <td>{row.full_name || profile?.full_name || '-'}</td>
                      <td>{row.email}</td>
                      <td><span className="admin-pill">{DOCTOR_ROLE_LABELS[row.role] ?? row.role ?? 'Asistente'}</span></td>
                      <td><span className={`admin-pill ${profile ? 'good' : 'warn'}`}>{profile ? 'Activo' : 'Pendiente'}</span></td>
                      <td>{profile?.id ?? '-'}</td>

                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-btn password"
                            onClick={() => handleSendPasswordSetup(row, Boolean(profile))}
                            disabled={!row.active}
                            title={profile ? 'Enviar correo para actualizar la contraseña' : 'Enviar correo para asignar la contraseña'}
                          >
                            <FiMail /> 
                          </button>
                          
                          <button className="admin-btn edit" onClick={() => handleEdit(row)}>
                            <FiTrash2 /> Editar
                          </button>
                          
                          {row.active ? (
                            <button
                              className="admin-btn danger"
                              onClick={() => handleDeactivate(row)}
                            >
                              <FiTrash2 /> Desactivar
                            </button>
                          ) : (
                            <button
                              className="admin-btn success"
                              onClick={() => handleActivate(row)}
                            >
                              <FiRefreshCw /> Activar
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DoctorsVW
