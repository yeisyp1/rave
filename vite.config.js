import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'react-redux', '@reduxjs/toolkit'],
          'vendor-charts': ['recharts'],
          'vendor-calendar': ['react-big-calendar', 'moment'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
