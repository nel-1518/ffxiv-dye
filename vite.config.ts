import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 项目站点部署在 https://<user>.github.io/ffxiv-dye/
  base: '/ffxiv-dye/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5100,
  },
})
