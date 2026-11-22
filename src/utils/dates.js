const pad = (value) => String(value).padStart(2, '0')

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export const parseLocalDate = (value) => {
  if (value instanceof Date) return value
  if (typeof value === 'string' && DATE_ONLY.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(value)
}

const asDate = (value) => parseLocalDate(value)

export const toLocalDateInput = (value = new Date()) => {
  const date = asDate(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const toLocalDateTimeInput = (value = new Date()) => {
  const date = asDate(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${toLocalDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const toLocalTimeInput = (value = new Date()) => {
  const date = asDate(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
