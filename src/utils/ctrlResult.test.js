import { describe, it, expect } from 'vitest'
import { runCtrlAction } from './ctrlResult'

describe('runCtrlAction', () => {
  it('devuelve { ok: true, data } cuando la acción tiene éxito', async () => {
    const result = await runCtrlAction(async () => 42)
    expect(result).toEqual({ ok: true, data: 42 })
  })

  it('devuelve { ok: false, message } cuando la acción lanza', async () => {
    const result = await runCtrlAction(async () => {
      throw new Error('fallo controlado')
    })
    expect(result).toEqual({ ok: false, message: 'fallo controlado' })
  })

  it('nunca propaga la excepción', async () => {
    await expect(
      runCtrlAction(() => {
        throw new Error('boom')
      }),
    ).resolves.toMatchObject({ ok: false })
  })
})
