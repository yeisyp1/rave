import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { FiArchive, FiEdit, FiPlus, FiTrash2, FiTrendingDown, FiX, FiCheck } from 'react-icons/fi'
import LoaderVW from '../components/LoaderVW'
import {
  INVENTORY_EMPTY_FORM,
  adjustInventoryStockCtrl,
  computeInventoryOptionsCtrl,
  computeInventoryStatsCtrl,
  createInventoryItemCtrl,
  deleteInventoryItemCtrl,
  isInventoryItemLow,
  loadInventoryItemsCtrl,
  updateInventoryItemCtrl,
} from '../controllers/InventoryCtrl'
import { showAlertModal } from '../app/store'
import '../styles/AdminViewsVW.css'

const InventoryVW = () => {
  const dispatch = useDispatch()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(INVENTORY_EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', category: '', stock: '', min_stock: '', unit: '' })

  const loadItems = async () => {
    setLoading(true)
    setMessage('')

    try {
      const data = await loadInventoryItemsCtrl()
      setItems(data)
    } catch (error) {
      setMessage(`No se pudo cargar inventario: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const { lowStockCount, totalStock } = useMemo(() => computeInventoryStatsCtrl(items), [items])
  const { nameOptions, categoryOptions, unitOptions } = useMemo(() => computeInventoryOptionsCtrl(items), [items])

  const addItem = async (event) => {
    event.preventDefault()

    setSaving(true)
    setMessage('')

    const result = await createInventoryItemCtrl(form)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo guardar el insumo: ${result.message}`, variant: 'error' }))
    } else {
      setForm(INVENTORY_EMPTY_FORM)
      await loadItems()
    }
    setSaving(false)
  }

  const adjustStock = async (item, amount) => {
    const result = await adjustInventoryStockCtrl(item, amount)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo actualizar stock: ${result.message}`, variant: 'error' }))
      return
    }
    setItems((current) => current.map((row) => (row.id === item.id ? result.data : row)))
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditForm({
      name: item.name ?? '',
      category: item.category ?? '',
      stock: item.stock ?? '',
      min_stock: item.min_stock ?? '',
      unit: item.unit ?? '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (id) => {
    const result = await updateInventoryItemCtrl(id, editForm)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo actualizar el insumo: ${result.message}`, variant: 'error' }))
      return
    }
    setItems((current) => current.map((row) => (row.id === id ? result.data : row)))
    setEditingId(null)
  }

  const removeItem = async (item) => {
    if (!confirm(`¿Eliminar "${item.name}" del inventario?`)) return

    const result = await deleteInventoryItemCtrl(item.id)
    if (!result.ok) {
      dispatch(showAlertModal({ message: `No se pudo eliminar el insumo: ${result.message}`, variant: 'error' }))
      return
    }
    setItems((current) => current.filter((row) => row.id !== item.id))
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Inventario</h1>
          <p className="admin-subtitle">Control rapido de insumos clinicos y alertas de reposicion.</p>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{items.length}</div><div className="admin-stat-label">referencias</div></div>
          <span className="admin-icon"><FiArchive /></span>
        </div>
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{totalStock}</div><div className="admin-stat-label">unidades totales</div></div>
          <span className="admin-icon"><FiArchive /></span>
        </div>
        <div className="admin-card admin-stat">
          <div><div className="admin-stat-value">{lowStockCount}</div><div className="admin-stat-label">alertas de stock</div></div>
          <span className="admin-icon"><FiTrendingDown /></span>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Nuevo insumo</h2>
        <form className="admin-form full" onSubmit={addItem}>
          <div className="admin-field">
            <label>Insumo</label>
            <input className="admin-input" list="inventory-name-list" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <datalist id="inventory-name-list">
              {nameOptions.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
          <div className="admin-field">
            <label>Categoria</label>
            <input className="admin-input" list="inventory-category-list" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
            <datalist id="inventory-category-list">
              {categoryOptions.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
          <div className="admin-field">
            <label>Stock</label>
            <input className="admin-input" type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Minimo</label>
            <input className="admin-input" type="number" min="0" value={form.min} onChange={(event) => setForm({ ...form, min: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Unidad</label>
            <input className="admin-input" list="inventory-unit-list" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} required />
            <datalist id="inventory-unit-list">
              {unitOptions.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
          <div className="admin-actions">
            <button className="admin-btn primary" type="submit" disabled={saving}>
              <FiPlus /> {saving ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </form>
        {message && <p className="admin-message">{message}</p>}
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Existencias</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Insumo</th><th>Categoria</th><th>Stock</th><th>Minimo</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6"><LoaderVW text="Cargando inventario..." className="loader-inline" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="6" className="admin-empty">No hay insumos registrados.</td></tr>
              ) : (
                items.map((item) => {
                const isLow = isInventoryItemLow(item)
                const isEditing = editingId === item.id

                if (isEditing) {
                  return (
                    <tr key={item.id}>
                      <td><input className="admin-input" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></td>
                      <td><input className="admin-input" value={editForm.category} onChange={(event) => setEditForm({ ...editForm, category: event.target.value })} /></td>
                      <td><input className="admin-input" type="number" min="0" value={editForm.stock} onChange={(event) => setEditForm({ ...editForm, stock: event.target.value })} /></td>
                      <td><input className="admin-input" type="number" min="0" value={editForm.min_stock} onChange={(event) => setEditForm({ ...editForm, min_stock: event.target.value })} /></td>
                      <td>-</td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-btn primary" type="button" onClick={() => saveEdit(item.id)} title="Guardar"><FiCheck /></button>
                          <button className="admin-btn" type="button" onClick={cancelEdit} title="Cancelar"><FiX /></button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.stock} {item.unit}</td>
                    <td>{item.min_stock} {item.unit}</td>
                    <td><span className={`admin-pill ${isLow ? 'bad' : 'good'}`}>{isLow ? 'Reponer' : 'Disponible'}</span></td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn" type="button" onClick={() => adjustStock(item, -1)}>-1</button>
                        <button className="admin-btn" type="button" onClick={() => adjustStock(item, 1)}>+1</button>
                        <button className="admin-btn" type="button" onClick={() => startEdit(item)} title="Editar"><FiEdit /></button>
                        <button className="admin-btn danger" type="button" onClick={() => removeItem(item)} title="Eliminar"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                )
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InventoryVW
