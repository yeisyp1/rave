import { describe, it, expect } from 'vitest'
import { ROLES, isAdmin, isDentist, isAssistant, isClinicalStaff, isStaff, hasRole } from './roles'

describe('roles', () => {
  const admin = { role: ROLES.ADMIN }
  const dentist = { role: ROLES.DENTIST }
  const assistant = { role: ROLES.ASSISTANT }

  it('identifica cada rol individual', () => {
    expect(isAdmin(admin)).toBe(true)
    expect(isAdmin(dentist)).toBe(false)
    expect(isDentist(dentist)).toBe(true)
    expect(isAssistant(assistant)).toBe(true)
  })

  it('isClinicalStaff incluye admin y odontólogo, excluye asistente', () => {
    expect(isClinicalStaff(admin)).toBe(true)
    expect(isClinicalStaff(dentist)).toBe(true)
    expect(isClinicalStaff(assistant)).toBe(false)
  })

  it('isStaff acepta cualquier rol autenticado', () => {
    expect(isStaff(admin)).toBe(true)
    expect(isStaff(dentist)).toBe(true)
    expect(isStaff(assistant)).toBe(true)
  })

  it('maneja perfiles nulos sin lanzar errores', () => {
    expect(isAdmin(null)).toBe(false)
    expect(isStaff(undefined)).toBe(false)
    expect(isClinicalStaff(null)).toBe(false)
  })

  it('hasRole respeta la lista de roles permitidos', () => {
    expect(hasRole(dentist, [ROLES.ADMIN, ROLES.DENTIST])).toBe(true)
    expect(hasRole(assistant, [ROLES.ADMIN, ROLES.DENTIST])).toBe(false)
    expect(hasRole(null, [ROLES.ADMIN])).toBe(false)
  })
})
