import { defineConfig } from 'vitest/config'

// Configuración de pruebas unitarias.
// Se inyectan variables de entorno ficticias para que el cliente de Supabase
// pueda instanciarse al importar los DAO sin realizar peticiones reales.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
})
