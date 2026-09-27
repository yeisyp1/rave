import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { FiAlertTriangle, FiDollarSign, FiDownload, FiThermometer, FiUserPlus } from 'react-icons/fi'
import LoaderVW from '../components/LoaderVW'
import { fetchReportCtrlData } from '../controllers/ReportsCtrl'
import { showAlertModal } from '../app/store'
import '../styles/AdminViewsVW.css'

const formatMoney = (value) => `$${Math.round(Number(value) || 0).toLocaleString('es-CO')}`

const defaultRange = () => {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const toISO = (date) => date.toISOString().slice(0, 10)
  return { from: toISO(firstOfMonth), to: toISO(today) }
}

const downloadCsv = (filename, rows) => {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [headers.join(','), ...rows.map((row) => headers.map((key) => escape(row[key])).join(','))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const ReportsVW = () => {
  const dispatch = useDispatch()
  const [range, setRange] = useState(defaultRange())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadReport = async (nextRange) => {
    setLoading(true)

    try {
      const result = await fetchReportCtrlData(nextRange)
      setData(result)
    } catch (error) {
      dispatch(showAlertModal({ message: `No se pudo generar el reporte: ${error.message}`, variant: 'error' }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport(range)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyFilter = (event) => {
    event.preventDefault()
    loadReport(range)
  }

  const invoiceRows = useMemo(
    () => (data?.invoices ?? []).map((invoice) => ({
      Fecha: invoice.date,
      Paciente: invoice.patient,
      Monto: invoice.amount,
      Estado: invoice.status,
    })),
    [data]
  )

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Reportes</h1>
          <p className="admin-subtitle">Indicadores de ingresos, pacientes, inventario y laboratorio por periodo.</p>
        </div>
      </div>

      <div className="admin-card">
        <form className="admin-form full" onSubmit={applyFilter}>
          <div className="admin-field">
            <label>Desde</label>
            <input className="admin-input" type="date" value={range.from} onChange={(event) => setRange({ ...range, from: event.target.value })} />
          </div>
          <div className="admin-field">
            <label>Hasta</label>
            <input className="admin-input" type="date" value={range.to} onChange={(event) => setRange({ ...range, to: event.target.value })} />
          </div>
          <div className="admin-actions">
            <button className="admin-btn primary" type="submit" disabled={loading}>{loading ? 'Generando...' : 'Generar reporte'}</button>
            <button
              className="admin-btn"
              type="button"
              disabled={!invoiceRows.length}
              onClick={() => downloadCsv(`facturacion_${range.from}_a_${range.to}.csv`, invoiceRows)}
            >
              <FiDownload /> Exportar CSV
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="admin-card"><LoaderVW text="Generando reporte..." className="loader-inline" /></div>
      ) : data ? (
        <>
          <div className="admin-grid">
            <div className="admin-card admin-stat">
              <div><div className="admin-stat-value">{formatMoney(data.summary.totalIncome)}</div><div className="admin-stat-label">ingresos (pagado)</div></div>
              <span className="admin-icon"><FiDollarSign /></span>
            </div>
            <div className="admin-card admin-stat">
              <div><div className="admin-stat-value">{formatMoney(data.summary.totalPending)}</div><div className="admin-stat-label">por cobrar</div></div>
              <span className="admin-icon"><FiDollarSign /></span>
            </div>
            <div className="admin-card admin-stat">
              <div><div className="admin-stat-value">{data.summary.newPatientCount}</div><div className="admin-stat-label">pacientes nuevos</div></div>
              <span className="admin-icon"><FiUserPlus /></span>
            </div>
            <div className="admin-card admin-stat">
              <div><div className="admin-stat-value">{data.summary.lowStockCount}</div><div className="admin-stat-label">insumos por reponer</div></div>
              <span className="admin-icon"><FiAlertTriangle /></span>
            </div>
            <div className="admin-card admin-stat">
              <div><div className="admin-stat-value">{data.summary.pendingLabCount}</div><div className="admin-stat-label">trabajos de laboratorio activos</div></div>
              <span className="admin-icon"><FiThermometer /></span>
            </div>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">Facturacion del periodo</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Fecha</th><th>Paciente</th><th>Monto</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {data.invoices.length === 0 ? (
                    <tr><td colSpan="4" className="admin-empty">No hay facturas en el periodo seleccionado.</td></tr>
                  ) : (
                    data.invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.date}</td>
                        <td>{invoice.patient}</td>
                        <td>{formatMoney(invoice.amount)}</td>
                        <td><span className={`admin-pill ${invoice.isPaid ? 'good' : invoice.isPending ? 'warn' : 'bad'}`}>{invoice.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">Pacientes nuevos del periodo</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Nombre</th><th>Documento</th><th>Registro</th></tr>
                </thead>
                <tbody>
                  {data.newPatients.length === 0 ? (
                    <tr><td colSpan="3" className="admin-empty">No hay pacientes nuevos en el periodo.</td></tr>
                  ) : (
                    data.newPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td>{patient.fullName}</td>
                        <td>{patient.numero_documento}</td>
                        <td>{String(patient.created_at).slice(0, 10)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">Alertas de inventario</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Insumo</th><th>Stock</th><th>Minimo</th></tr>
                </thead>
                <tbody>
                  {data.lowStockItems.length === 0 ? (
                    <tr><td colSpan="3" className="admin-empty">No hay insumos por reponer.</td></tr>
                  ) : (
                    data.lowStockItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.stock} {item.unit}</td>
                        <td>{item.min_stock} {item.unit}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">Trabajos de laboratorio activos</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Trabajo</th><th>Laboratorio</th><th>Entrega</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {data.pendingLabCases.length === 0 ? (
                    <tr><td colSpan="4" className="admin-empty">No hay trabajos activos.</td></tr>
                  ) : (
                    data.pendingLabCases.map((item) => (
                      <tr key={item.id}>
                        <td>{item.work_name}</td>
                        <td>{item.lab_name || '-'}</td>
                        <td>{item.due_date || '-'}</td>
                        <td><span className="admin-pill warn">{item.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default ReportsVW
