import { describe, it, expect } from 'vitest'
import { getPatientFullName, getPatientLabel, findPatientByText } from './patientLabel'

describe('patientLabel', () => {
  const ana = { nombre: 'Ana', apellidos: 'García', numero_documento: '123' }
  const anaSinDoc = { nombre: 'Ana', apellidos: 'García' }

  it('getPatientFullName une nombre y apellidos', () => {
    expect(getPatientFullName(ana)).toBe('Ana García')
  })

  it('getPatientFullName tolera campos faltantes', () => {
    expect(getPatientFullName({ nombre: 'Ana' })).toBe('Ana')
    expect(getPatientFullName(null)).toBe('')
  })

  it('getPatientLabel agrega el documento cuando existe', () => {
    expect(getPatientLabel(ana)).toBe('Ana García - 123')
    expect(getPatientLabel(anaSinDoc)).toBe('Ana García')
  })

  describe('findPatientByText', () => {
    const patients = [
      { nombre: 'Ana', apellidos: 'García', numero_documento: '123' },
      { nombre: 'Juan', apellidos: 'Pérez', numero_documento: '456' },
      { nombre: 'Juan', apellidos: 'Pérez', numero_documento: '789' },
    ]

    it('encuentra por etiqueta con documento', () => {
      expect(findPatientByText(patients, 'Ana García - 123')).toBe(patients[0])
    })

    it('encuentra por nombre completo único', () => {
      expect(findPatientByText(patients, 'ana garcía')).toBe(patients[0])
    })

    it('no resuelve nombres duplicados sin documento', () => {
      expect(findPatientByText(patients, 'Juan Pérez')).toBeNull()
    })

    it('devuelve null con texto vacío', () => {
      expect(findPatientByText(patients, '   ')).toBeNull()
      expect(findPatientByText(patients, null)).toBeNull()
    })
  })
})
