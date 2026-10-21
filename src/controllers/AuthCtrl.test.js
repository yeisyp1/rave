import { describe, it, expect, vi, beforeEach } from 'vitest'

const signInWithPasswordDAO = vi.fn()
const signInWithGoogleDAO = vi.fn()
const signInWithOtpDAO = vi.fn()
const getSessionDAO = vi.fn()
const updateUserPasswordDAO = vi.fn()
const signUpDAO = vi.fn()
const resetPasswordForEmailDAO = vi.fn()
const checkAuthorizedEmailDAO = vi.fn()

vi.mock('../dao/AuthDAO', () => ({
  signInWithPasswordDAO: (...args) => signInWithPasswordDAO(...args),
  signInWithGoogleDAO: (...args) => signInWithGoogleDAO(...args),
  signInWithOtpDAO: (...args) => signInWithOtpDAO(...args),
  getSessionDAO: (...args) => getSessionDAO(...args),
  updateUserPasswordDAO: (...args) => updateUserPasswordDAO(...args),
  signUpDAO: (...args) => signUpDAO(...args),
  resetPasswordForEmailDAO: (...args) => resetPasswordForEmailDAO(...args),
  checkAuthorizedEmailDAO: (...args) => checkAuthorizedEmailDAO(...args),
}))

const {
  loginWithPasswordCtrl,
  sendMagicLinkCtrl,
  validatePasswordCtrl,
  checkSessionExistsCtrl,
  updatePasswordCtrl,
  createAccountCtrl,
  sendPasswordRecoveryCtrl,
} = await import('./AuthCtrl')

beforeEach(() => {
  vi.clearAllMocks()
  // AuthCtrl arma las URLs de redirección con window.location.origin; el entorno
  // de pruebas es 'node' (sin DOM), así que se define un stub mínimo.
  vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } })
})

describe('loginWithPasswordCtrl (CU-01)', () => {
  it('devuelve el usuario cuando las credenciales son correctas', async () => {
    signInWithPasswordDAO.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const result = await loginWithPasswordCtrl('ana@rave.com', 'secret123')
    expect(result).toEqual({ ok: true, user: { id: 'u1' } })
  })

  it('rechaza con mensaje de error cuando las credenciales son incorrectas', async () => {
    signInWithPasswordDAO.mockResolvedValue({ data: {}, error: { message: 'Invalid login credentials' } })
    const result = await loginWithPasswordCtrl('ana@rave.com', 'bad')
    expect(result).toEqual({ ok: false, message: 'Invalid login credentials' })
  })
})

describe('sendMagicLinkCtrl', () => {
  it('exige un correo antes de enviar el enlace', async () => {
    const result = await sendMagicLinkCtrl('   ')
    expect(result.ok).toBe(false)
    expect(signInWithOtpDAO).not.toHaveBeenCalled()
  })

  it('normaliza el correo (trim + minúsculas) antes de enviarlo', async () => {
    signInWithOtpDAO.mockResolvedValue({ error: null })
    await sendMagicLinkCtrl('  ANA@Rave.com  ')
    expect(signInWithOtpDAO).toHaveBeenCalledWith('ana@rave.com', expect.any(String))
  })
})

describe('validatePasswordCtrl', () => {
  it('exige al menos 8 caracteres', () => {
    expect(validatePasswordCtrl('123', '123')).toMatch(/8 caracteres/)
  })

  it('exige que la confirmación coincida', () => {
    expect(validatePasswordCtrl('12345678', '87654321')).toMatch(/no coinciden/)
  })

  it('pasa sin mensaje de error cuando la contraseña es válida', () => {
    expect(validatePasswordCtrl('12345678', '12345678')).toBe('')
  })
})

describe('checkSessionExistsCtrl (RNF-03)', () => {
  it('es true cuando hay sesión activa', async () => {
    getSessionDAO.mockResolvedValue({ data: { session: { access_token: 't' } } })
    expect(await checkSessionExistsCtrl()).toBe(true)
  })

  it('es false cuando el token caducó o no hay sesión', async () => {
    getSessionDAO.mockResolvedValue({ data: { session: null } })
    expect(await checkSessionExistsCtrl()).toBe(false)
  })
})

describe('updatePasswordCtrl', () => {
  it('confirma la actualización', async () => {
    updateUserPasswordDAO.mockResolvedValue({ error: null })
    expect(await updatePasswordCtrl('nuevaClave123')).toEqual({ ok: true })
  })

  it('propaga el error del servicio de autenticación', async () => {
    updateUserPasswordDAO.mockResolvedValue({ error: { message: 'Token inválido' } })
    expect(await updatePasswordCtrl('nuevaClave123')).toEqual({ ok: false, message: 'Token inválido' })
  })
})

describe('createAccountCtrl (solo correos autorizados por el administrador, CU-04)', () => {
  it('rechaza un correo que el administrador no ha autorizado', async () => {
    checkAuthorizedEmailDAO.mockResolvedValue(null)
    const result = await createAccountCtrl({ email: 'intruso@mail.com', password: '12345678' })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/no está autorizado/)
    expect(signUpDAO).not.toHaveBeenCalled()
  })

  it('crea la cuenta cuando el correo fue autorizado', async () => {
    checkAuthorizedEmailDAO.mockResolvedValue({ email: 'ana@rave.com' })
    signUpDAO.mockResolvedValue({ data: { session: { access_token: 't' } }, error: null })
    const result = await createAccountCtrl({ email: 'ANA@rave.com', password: '12345678' })
    expect(result.ok).toBe(true)
    expect(signUpDAO).toHaveBeenCalledWith('ana@rave.com', '12345678', expect.any(String))
  })

  it('indica que ya existe cuenta cuando el correo ya estaba registrado', async () => {
    checkAuthorizedEmailDAO.mockResolvedValue({ email: 'ana@rave.com' })
    signUpDAO.mockResolvedValue({ data: {}, error: { message: 'User already registered' } })
    const result = await createAccountCtrl({ email: 'ana@rave.com', password: '12345678' })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/Recuperar contraseña/)
  })
})

describe('sendPasswordRecoveryCtrl', () => {
  it('siempre responde con un mensaje neutro, exista o no el correo', async () => {
    resetPasswordForEmailDAO.mockResolvedValue({ error: null })
    const result = await sendPasswordRecoveryCtrl('ana@rave.com')
    expect(result.ok).toBe(true)
    expect(result.message).toMatch(/Si el correo está registrado/)
  })
})
