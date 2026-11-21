import { parseLocalDate } from './dates'

export const formatMoney = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`

export const formatDate = (value) => {
  if (!value) return '—'
  const date = parseLocalDate(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatDateTime = (value) => {
  if (!value) return '—'
  const date = parseLocalDate(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
