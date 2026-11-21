import { beforeEach, describe, expect, it, vi } from 'vitest'

const uploadRadiographyFileDAO = vi.fn()
const createRadiographiesDAO = vi.fn()
const removeRadiographyFilesDAO = vi.fn()
const getRadiographySignedUrlDAO = vi.fn()

vi.mock('../dao/RadiographiesDAO', () => ({
  uploadRadiographyFileDAO: (...a) => uploadRadiographyFileDAO(...a),
  createRadiographiesDAO: (...a) => createRadiographiesDAO(...a),
  removeRadiographyFilesDAO: (...a) => removeRadiographyFilesDAO(...a),
  getRadiographySignedUrlDAO: (...a) => getRadiographySignedUrlDAO(...a),
  listHistoryRadiographiesDAO: vi.fn(),
  annulRadiographyDAO: vi.fn(),
}))
vi.mock('../dao/SupabaseDAO', () => ({ getCurrentUserIdDAO: vi.fn() }))

import { loadHistoryRadiographiesCtrl, uploadRadiographiesCtrl } from './RadiographiesCtrl'
import { listHistoryRadiographiesDAO } from '../dao/RadiographiesDAO'

const file = (name) => ({ name, size: 1, type: 'image/png' })

describe('RadiographiesCtrl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('borra los archivos ya subidos si falla una subida posterior', async () => {
    uploadRadiographyFileDAO.mockResolvedValueOnce().mockResolvedValueOnce().mockRejectedValueOnce(new Error('boom'))
    await expect(
      uploadRadiographiesCtrl({ patientId: 'p', historyId: 1, files: [file('a.png'), file('b.png'), file('c.png')] }),
    ).rejects.toThrow('boom')
    expect(createRadiographiesDAO).not.toHaveBeenCalled()
    expect(removeRadiographyFilesDAO).toHaveBeenCalledTimes(1)
    expect(removeRadiographyFilesDAO.mock.calls[0][0]).toHaveLength(2)
  })

  it('no usa URL pública cuando falla la URL firmada', async () => {
    listHistoryRadiographiesDAO.mockResolvedValue([{ id: 1, file_path: 'p/x.png' }])
    getRadiographySignedUrlDAO.mockResolvedValue(null)
    const [row] = await loadHistoryRadiographiesCtrl('p', 1)
    expect(row.image_url).toBeNull()
    expect(row.image_error).toBeTruthy()
  })
})
