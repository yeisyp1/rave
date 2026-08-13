import { useEffect, useMemo, useState } from 'react'
import { FiRefreshCw, FiTrash2, FiUserPlus, FiUsers } from 'react-icons/fi'
import { supabase } from '../dao/SupabaseDAO'
import LoaderVW from '../components/LoaderVW'
import '../styles/AdminViewsVW.css'

const emptyForm = {
  full_name: '',
  email: '',
  role: 'user',
}

const normalizeEmail = (email) => email.trim().toLowerCase()
const roleLabels = {
  admin: 'Administrador',
  user: 'Equipo clinico',
}

const DoctorsVW = () => {
  const [authorizedUsers, setAuthorizedUsers] = useState([])
  const [profiles, setProfiles] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const profileByEmail = useMemo(() => {
    return new Map(profiles.map((profile) => [normalizeEmail(profile.email ?? ''), profile]))
  }, [profiles])

  const loadUsers = async () => {
    setLoading(true)
    setMessage('')

    const [authorizedResult, profilesResult] = await Promise.all([
      supabase.from('authorized_emails').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('full_name', { ascending: true }),
    ])

    if (authorizedResult.error) {
      setMessage(`No se pudo cargar authorized_emails: ${authorizedResult.error.message}`)
    } else {
      setAuthorizedUsers(authorizedResult.data ?? [])
    }

    if (profilesResult.error) {
      setMessage((current) => current || `No se pudo cargar profiles: ${profilesResult.error.message}`)
    } else {
      setProfiles(profilesResult.data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const email = normalizeEmail(form.email)
    const payload = {
      email,
      full_name: form.full_name.trim(),
      role: form.role,
    }

    const { error } = await supabase
      .from('authorized_emails')
      .upsert(payload, { onConflict: 'email' })

    if (error) {
      setMessage(`No se pudo autorizar el usuario: ${error.message}`)
    } else {
      setMessage('Usuario autorizado. Cuando inicie sesion se validara contra su perfil.')
      setForm(emptyForm)
      await loadUsers()
    }

    setSaving(false)
  }

  const handleDeactivate = async (row) => {
    if (!confirm(`¿Desactivar a ${row.email}?`)) return

    const { error } = await supabase
      .from('authorized_emails')
      .update({ active: false })
      .eq('id', row.id)

    if (error) {
      setMessage(error.message)
      return
    }

    await loadUsers()
  }

  const handleActivate = async (row) => {
    const { error } = await supabase
      .from('authorized_emails')
      .update({ active: true })
      .eq('id', row.id)

    if (error) {
      setMessage(error.message)
      return
    }

    await loadUsers()
  }

  const handleEdit = (row) => {
    setForm({
      full_name: row.full_name ?? '',
      email: row.email ?? '',
      role: row.role ?? 'user', 
    })
  }

  const totalAdmins = authorizedUsers.filter((user) => user.role === 'admin').length
  const totalActive = authorizedUsers.filter((user) => profileByEmail.has(normalizeEmail(user.email ?? ''))).length

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
                <option value="user">Equipo clínico</option>
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
                <div className="admin-row-title">Equipo clínico</div>
                <div className="admin-row-sub">Pacientes, citas, historias clinicas y odontograma.</div>
              </div>
              <span className="admin-pill good">user</span>
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
                  const profile = profileByEmail.get(normalizeEmail(row.email ?? ''))
                  return (
                    <tr key={row.id ?? row.email}>
                      <td>{row.full_name || profile?.full_name || '-'}</td>
                      <td>{row.email}</td>
                      <td><span className="admin-pill">{roleLabels[row.role] ?? row.role ?? 'Equipo clínico'}</span></td>
                      <td><span className={`admin-pill ${profile ? 'good' : 'warn'}`}>{profile ? 'Activo' : 'Pendiente'}</span></td>
                      <td>{profile?.id ?? '-'}</td>

                      <td>
                        <div className="admin-actions">
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
