import { useEffect, useMemo, useState } from 'react'
import { FiArchive, FiPlus, FiTrendingDown } from 'react-icons/fi'
import LoaderVW from '../components/LoaderVW'
import {
  createInventoryItemDAO,
  listInventoryItemsDAO,
  updateInventoryItemStockDAO,
} from '../dao/InventoryDAO'
import '../styles/AdminViewsVW.css'

const InventoryVW = () => {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name: '', category: '', stock: '', min: '', unit: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadItems = async () => {
    setLoading(true)
    setMessage('')

    try {
      const data = await listInventoryItemsDAO()
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

  const lowStock = useMemo(() => items.filter((item) => Number(item.stock) <= Number(item.min_stock)), [items])
  const totalStock = useMemo(() => items.reduce((sum, item) => sum + Number(item.stock), 0), [items])
  const nameOptions = useMemo(() => [...new Set(items.map((item) => String(item.name ?? '').trim()).filter(Boolean))], [items])
  const categoryOptions = useMemo(() => [...new Set(items.map((item) => String(item.category ?? '').trim()).filter(Boolean))], [items])
  const unitOptions = useMemo(() => [...new Set(items.map((item) => String(item.unit ?? '').trim()).filter(Boolean))], [items])

  const addItem = async (event) => {
    event.preventDefault()

    setSaving(true)
    setMessage('')

    try {
      await createInventoryItemDAO({
        name: form.name.trim(),
        category: form.category.trim() || null,
        stock: Number(form.stock),
        min_stock: Number(form.min),
        unit: form.unit.trim(),
      })
      setForm({ name: '', category: '', stock: '', min: '', unit: '' })
      await loadItems()
    } catch (error) {
      setMessage(`No se pudo guardar el insumo: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const adjustStock = async (item, amount) => {
    try {
      const nextStock = Math.max(0, Number(item.stock) + amount)
      const updated = await updateInventoryItemStockDAO(item.id, nextStock)
      setItems((current) => current.map((row) => (row.id === item.id ? updated : row)))
    } catch (error) {
      setMessage(`No se pudo actualizar stock: ${error.message}`)
    }
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
          <div><div className="admin-stat-value">{lowStock.length}</div><div className="admin-stat-label">alertas de stock</div></div>
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
                const isLow = Number(item.stock) <= Number(item.min)
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
