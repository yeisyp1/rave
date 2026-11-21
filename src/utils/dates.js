const pad = (value) => String(value).padStart(2, '0')

const asDate = (value) => (value instanceof Date ? value : new Date(value))

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

export const todayLocalInput = () => toLocalDateInput(new Date())
