import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import AdminMessageVW from '../components/AdminMessageVW'
import { confirmAction } from '../utils/confirmDialog'
import { FiEdit, FiRefreshCw, FiTrash2, FiUserPlus, FiUsers, FiMail } from 'react-icons/fi'
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

const ROLE_PILL_CLASS = {
  admin: 'role-admin',
  dentist: 'role-dentist',
  assistant: 'role-assistant',
}

const DoctorsVW = () => {
  const dispatch = useDispatch()
  const [authorizedUsers, setAuthorizedUsers] = useState([])
  const [profiles, setProfiles] = useState([])
  const [form, setForm] = useState(DOCTOR_EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editingEmail, setEditingEmail] = useState('')

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
    // Carga inicial de usuarios autorizados al montar la vista.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)

    const result = await authorizeUserCtrl(form)
    dispatch(showAlertModal({ message: result.message, variant: result.ok ? 'success' : 'error' }))

    if (result.ok) {
      setForm(DOCTOR_EMPTY_FORM)
      setEditingEmail('')
      await loadUsers()
    }

    setSaving(false)
  }

  const handleDeactivate = async (row) => {
    const confirmed = await confirmAction({
      title: 'Desactivar al usuario',
      message: `${row.email} perderá el acceso a la aplicación. Puedes volver a activarlo cuando quieras.`,
      confirmLabel: 'Desactivar',
    })
    if (!confirmed) return

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
    const confirmed = await confirmAction({
      title: 'Enviar el correo de contraseña',
      message: `Se enviará a ${row.email} un correo para ${actionLabel} su contraseña.`,
      confirmLabel: 'Enviar correo',
      variant: 'info',
    })
    if (!confirmed) return

    const result = await sendPasswordSetupEmailCtrl(row, hasProfile)
    dispatch(showAlertModal({ message: result.message, variant: result.ok ? 'success' : 'error' }))
  }

  const handleEdit = (row) => {
    setEditingEmail(row.email ?? '')
    setForm({
      full_name: row.full_name ?? '',
      email: row.email ?? '',
      role: row.role ?? 'assistant',
    })
  }

  const cancelEdit = () => {
    setEditingEmail('')
    setForm(DOCTOR_EMPTY_FORM)
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

      <div className="admin-grid stats">
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
            <div className="admin-stat-label">odontólogos</div>
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
          <h2 className="admin-card-title">
            {editingEmail ? `Editando el acceso de ${editingEmail}` : 'Nuevo acceso'}
          </h2>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-field">
              <label htmlFor="doctors-nombre">Nombre</label>
              <input id="doctors-nombre"
                className="admin-input"
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                placeholder="Nombre del profesional"
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="doctors-correo">Correo</label>
              <input id="doctors-correo"
                className="admin-input"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="doctor@clinica.com"
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="doctors-rol">Rol</label>
              <select id="doctors-rol"
                className="admin-select"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              >
                <option value="assistant">Asistente</option>
                <option value="dentist">Odontólogo/a</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="admin-actions">
              {editingEmail && (
                <button className="admin-btn" type="button" onClick={cancelEdit}>
                  Cancelar
                </button>
              )}
              <button className="admin-btn primary" type="submit" disabled={saving}>
                <FiUserPlus /> {saving ? 'Guardando...' : editingEmail ? 'Guardar cambios' : 'Autorizar'}
              </button>
            </div>
          </form>
          <AdminMessageVW text={message} />
        </div>

        <div className="admin-card">
          <h2 className="admin-card-title">Permisos</h2>
          <div className="admin-list">
            <div className="admin-list-row">
              <div>
                <div className="admin-row-title">Administrador</div>
                <div className="admin-row-sub">Acceso total, usuarios, pagos, inventario y laboratorio.</div>
              </div>
              <span className="admin-pill role-admin">Administrador</span>
            </div>
            <div className="admin-list-row">
              <div>
                <div className="admin-row-title">Odontólogo/a</div>
                <div className="admin-row-sub">Pacientes, citas, historias clínicas, odontograma y planes de tratamiento.</div>
              </div>
              <span className="admin-pill role-dentist">Odontólogo/a</span>
            </div>
            <div className="admin-list-row">
              <div>
                <div className="admin-row-title">Asistente</div>
                <div className="admin-row-sub">Pacientes, citas y agenda. No accede a historias clínicas, laboratorio ni inventario.</div>
              </div>
              <span className="admin-pill role-assistant">Asistente</span>
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5"><LoaderVW text="Cargando usuarios..." className="loader-inline" /></td></tr>
              ) : authorizedUsers.length === 0 ? (
                <tr><td colSpan="5" className="admin-empty">No hay usuarios autorizados.</td></tr>
              ) : (
                authorizedUsers.map((row) => {
                  const profile = profileByEmail.get(normalizeUserEmailCtrl(row.email ?? ''))
                  return (
                    <tr key={row.id ?? row.email}>
                      <td>{row.full_name || profile?.full_name || '-'}</td>
                      <td>{row.email}</td>
                      <td>
                        <span className={`admin-pill ${ROLE_PILL_CLASS[row.role] ?? 'role-assistant'}`}>
                          {DOCTOR_ROLE_LABELS[row.role] ?? row.role ?? 'Asistente'}
                        </span>
                      </td>
                      <td>
                        {!row.active ? (
                          <span className="admin-pill bad">Desactivado</span>
                        ) : profile ? (
                          <span className="admin-pill good">Activo</span>
                        ) : (
                          <span className="admin-pill warn">Pendiente</span>
                        )}
                      </td>

                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-btn password"
                            onClick={() => handleSendPasswordSetup(row, Boolean(profile))}
                            disabled={!row.active}
                            title={profile ? 'Enviar correo para actualizar la contraseña' : 'Enviar correo para asignar la contraseña'}
                            aria-label={profile
                              ? `Enviar a ${row.email} un correo para actualizar la contraseña`
                              : `Enviar a ${row.email} un correo para asignar la contraseña`}
                          >
                            <FiMail /> 
                          </button>
                          
                          <button
                            className="admin-btn edit"
                            onClick={() => handleEdit(row)}
                            aria-label={`Editar a ${row.full_name || row.email}`}
                          >
                            <FiEdit /> Editar
                          </button>
                          
                          {row.active ? (
                            <button
                              className="admin-btn danger"
                              onClick={() => handleDeactivate(row)}
                              aria-label={`Desactivar a ${row.full_name || row.email}`}
                            >
                              <FiTrash2 /> Desactivar
                            </button>
                          ) : (
                            <button
                              className="admin-btn success"
                              onClick={() => handleActivate(row)}
                              aria-label={`Activar a ${row.full_name || row.email}`}
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
