import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.test.ts'],
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@react-three') || id.includes('/three/') || id.includes('three-stdlib')) {
            return 'three-vendor'
          }

          if (id.includes('/d3') || id.includes('d3-')) {
            return 'd3-vendor'
          }
        },
      },
    },
  },
})
