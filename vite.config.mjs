import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This ensures assets are loaded from the root domain in production
  base: '/', 
  server: {
    port: 3000
  },
  build: {
    // This matches the folder your Dockerfile is looking for
    outDir: 'dist',
    // Generates a manifest file for better production tracking
    manifest: true 
  }
})

/*
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000
    },
    build: {
        outDir: 'dist'
    }
})
*/