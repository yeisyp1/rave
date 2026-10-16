import { describe, it, expect } from 'vitest'
import {
  isInventoryItemLow,
  computeInventoryStatsCtrl,
  computeInventoryOptionsCtrl,
} from './InventoryCtrl'

describe('InventoryCtrl (lógica pura)', () => {
  describe('isInventoryItemLow', () => {
    it('marca como bajo cuando el stock iguala o cae bajo el mínimo', () => {
      expect(isInventoryItemLow({ stock: 2, min_stock: 5 })).toBe(true)
      expect(isInventoryItemLow({ stock: 5, min_stock: 5 })).toBe(true)
      expect(isInventoryItemLow({ stock: 6, min_stock: 5 })).toBe(false)
    })

    it('convierte valores en texto a número', () => {
      expect(isInventoryItemLow({ stock: '3', min_stock: '10' })).toBe(true)
    })
  })

  describe('computeInventoryStatsCtrl', () => {
    const items = [
      { stock: 2, min_stock: 5 },
      { stock: 10, min_stock: 5 },
      { stock: 5, min_stock: 5 },
    ]

    it('cuenta ítems con stock bajo y suma el stock total', () => {
      expect(computeInventoryStatsCtrl(items)).toEqual({
        lowStockCount: 2,
        totalStock: 17,
      })
    })

    it('maneja una lista vacía', () => {
      expect(computeInventoryStatsCtrl([])).toEqual({ lowStockCount: 0, totalStock: 0 })
    })
  })

  describe('computeInventoryOptionsCtrl', () => {
    it('devuelve valores únicos, sin vacíos ni espacios, por campo', () => {
      const items = [
        { name: 'Guantes', category: 'Insumos', unit: 'caja' },
        { name: ' Guantes ', category: 'Insumos', unit: 'unidad' },
        { name: 'Anestesia', category: '', unit: '' },
      ]
      const options = computeInventoryOptionsCtrl(items)
      expect(options.nameOptions).toEqual(['Guantes', 'Anestesia'])
      expect(options.categoryOptions).toEqual(['Insumos'])
      expect(options.unitOptions).toEqual(['caja', 'unidad'])
    })
  })
})
