import { useMemo, useState } from 'react'
import { FiArchive, FiPlus, FiTrendingDown } from 'react-icons/fi'
import '../styles/AdminViewsVW.css'

const initialItems = [
  { id: 1, name: 'Guantes nitrilo M', category: 'Bioseguridad', stock: 18, min: 10, unit: 'cajas' },
  { id: 2, name: 'Anestesia lidocaina', category: 'Medicamentos', stock: 6, min: 8, unit: 'cartuchos' },
  { id: 3, name: 'Resina A2', category: 'Operatoria', stock: 12, min: 5, unit: 'jeringas' },
]

const InventoryVW = () => {
  const [items, setItems] = useState(initialItems)
  const [form, setForm] = useState({ name: '', category: '', stock: '', min: '', unit: '' })

  const lowStock = useMemo(() => items.filter((item) => Number(item.stock) <= Number(item.min)), [items])
  const totalStock = useMemo(() => items.reduce((sum, item) => sum + Number(item.stock), 0), [items])

  const addItem = (event) => {
    event.preventDefault()
    setItems((current) => [{ id: Date.now(), ...form, stock: Number(form.stock), min: Number(form.min) }, ...current])
    setForm({ name: '', category: '', stock: '', min: '', unit: '' })
  }

  const adjustStock = (id, amount) => {
    setItems((current) => current.map((item) => {
      if (item.id !== id) return item
      return { ...item, stock: Math.max(0, Number(item.stock) + amount) }
    }))
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
            <input className="admin-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Categoria</label>
            <input className="admin-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
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
            <input className="admin-input" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} required />
          </div>
          <div className="admin-actions">
            <button className="admin-btn primary" type="submit"><FiPlus /> Agregar</button>
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Existencias</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Insumo</th><th>Categoria</th><th>Stock</th><th>Minimo</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLow = Number(item.stock) <= Number(item.min)
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.stock} {item.unit}</td>
                    <td>{item.min} {item.unit}</td>
                    <td><span className={`admin-pill ${isLow ? 'bad' : 'good'}`}>{isLow ? 'Reponer' : 'Disponible'}</span></td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn" onClick={() => adjustStock(item.id, -1)}>-1</button>
                        <button className="admin-btn" onClick={() => adjustStock(item.id, 1)}>+1</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InventoryVW
