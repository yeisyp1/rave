import { describe, it, expect } from 'vitest'
import {
  calcPatientAgeCtrl,
  canNextPatientStepCtrl,
  setDataAuthorizationCtrl,
  filterPatientsCtrl,
  savePatientCtrl,
} from './PatientsCtrl'

describe('PatientsCtrl', () => {
  describe('calcPatientAgeCtrl', () => {
    it('calcula la edad a partir de la fecha de nacimiento', () => {
      const d = new Date()
      d.setFullYear(d.getFullYear() - 25)
      expect(calcPatientAgeCtrl(d.toISOString().slice(0, 10))).toBe('25')
    })

    it('devuelve vacío para fecha nula o futura', () => {
      expect(calcPatientAgeCtrl('')).toBe('')
      const future = new Date()
      future.setFullYear(future.getFullYear() + 1)
      expect(calcPatientAgeCtrl(future.toISOString().slice(0, 10))).toBe('')
    })
  })

  describe('canNextPatientStepCtrl', () => {
    it('paso 0 exige tipo y número de documento', () => {
      expect(canNextPatientStepCtrl(0, { tipo_documento: 'CC', numero_documento: '1' })).toBe(true)
      expect(canNextPatientStepCtrl(0, { tipo_documento: 'CC' })).toBe(false)
    })

    it('paso 1 exige nombre, apellidos y fecha de nacimiento', () => {
      expect(
        canNextPatientStepCtrl(1, { nombre: 'Ana', apellidos: 'G', fecha_nacimiento: '2000-01-01' }),
      ).toBe(true)
      expect(canNextPatientStepCtrl(1, { nombre: 'Ana', apellidos: 'G' })).toBe(false)
    })

    it('otros pasos siempre permiten continuar', () => {
      expect(canNextPatientStepCtrl(2, {})).toBe(true)
    })
  })

  describe('setDataAuthorizationCtrl (Ley 1581 de 2012)', () => {
    it('al autorizar guarda la marca y la fecha', () => {
      const result = setDataAuthorizationCtrl({ nombre: 'Ana' }, true)
      expect(result.nombre).toBe('Ana')
      expect(result.autorizacion_datos).toBe(true)
      expect(typeof result.autorizacion_datos_fecha).toBe('string')
    })

    it('al desautorizar limpia la fecha', () => {
      const result = setDataAuthorizationCtrl({}, false)
      expect(result.autorizacion_datos).toBe(false)
      expect(result.autorizacion_datos_fecha).toBeNull()
    })
  })

  describe('filterPatientsCtrl', () => {
    const patients = [
      { nombre: 'Ana', apellidos: 'García', numero_documento: '123', email: 'ana@mail.com' },
      { nombre: 'Juan', apellidos: 'Pérez', numero_documento: '456', email: 'juan@mail.com' },
    ]

    it('filtra por nombre, documento o email (sin distinguir mayúsculas)', () => {
      expect(filterPatientsCtrl(patients, 'ana')).toEqual([patients[0]])
      expect(filterPatientsCtrl(patients, '456')).toEqual([patients[1]])
      expect(filterPatientsCtrl(patients, 'JUAN@MAIL')).toEqual([patients[1]])
    })

    it('devuelve todos con búsqueda vacía', () => {
      expect(filterPatientsCtrl(patients, '')).toHaveLength(2)
    })
  })

  describe('savePatientCtrl (validaciones previas a persistencia)', () => {
    it('rechaza sin documento', async () => {
      const result = await savePatientCtrl({ form: {}, editingId: null })
      expect(result).toEqual({ ok: false, message: 'Documento obligatorio' })
    })

    it('rechaza sin nombre o apellidos', async () => {
      const result = await savePatientCtrl({
        form: { tipo_documento: 'CC', numero_documento: '1' },
        editingId: null,
      })
      expect(result).toEqual({ ok: false, message: 'Nombre y apellidos obligatorios' })
    })

    it('exige la autorización de datos (Ley 1581 de 2012)', async () => {
      const result = await savePatientCtrl({
        form: { tipo_documento: 'CC', numero_documento: '1', nombre: 'Ana', apellidos: 'García' },
        editingId: null,
      })
      expect(result.ok).toBe(false)
      expect(result.message).toMatch(/Ley 1581 de 2012/)
    })
  })
})
