import { describe, it, expect } from 'vitest'
import {
  annulPatientHistoryCtrl,
  createPatientHistoryCtrl,
  filterHistoriaPatientsCtrl,
} from './HistoriaClinicaCtrl'

describe('HistoriaClinicaCtrl', () => {
  // Punto 2 de la tesis: las historias clínicas no se eliminan, se anulan con motivo.
  describe('annulPatientHistoryCtrl', () => {
    it('exige un motivo de anulación', async () => {
      const result = await annulPatientHistoryCtrl('h1', '')
      expect(result).toEqual({
        ok: false,
        message: 'El motivo de anulación es obligatorio',
      })
    })

    it('rechaza un motivo compuesto solo de espacios', async () => {
      const result = await annulPatientHistoryCtrl('h1', '   ')
      expect(result.ok).toBe(false)
    })
  })

  describe('createPatientHistoryCtrl', () => {
    it('exige el motivo de consulta', async () => {
      const result = await createPatientHistoryCtrl('patient-1', { motivo_consulta: '' })
      expect(result).toEqual({ ok: false, message: 'El motivo de consulta es obligatorio' })
    })
  })

  describe('filterHistoriaPatientsCtrl', () => {
    const patients = [
      { nombre: 'Ana', apellidos: 'García', numero_documento: '123', email: 'ana@mail.com' },
      { nombre: 'Juan', apellidos: 'Pérez', numero_documento: '456', email: 'juan@mail.com' },
    ]

    it('filtra por nombre, documento o email', () => {
      expect(filterHistoriaPatientsCtrl(patients, 'pérez')).toEqual([patients[1]])
      expect(filterHistoriaPatientsCtrl(patients, '123')).toEqual([patients[0]])
    })
  })
})
