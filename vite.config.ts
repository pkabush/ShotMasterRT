import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/ShotMasterRT/',
  plugins: [react()],
  build: {
    outDir: 'docs',
    emptyOutDir: true
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy":        "same-origin-allow-popups",
    },
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": " same-origin-allow-popups",
    },
  },
})
