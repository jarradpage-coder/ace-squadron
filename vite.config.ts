import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// IMPORTANT (GitHub Pages): `base` must match the GitHub repo name.
// Repo `ace-squadron` is served at username.github.io/ace-squadron/, so the
// production build needs base '/ace-squadron/'. Dev runs at '/' for simplicity.
// If you name the repo something else, change REPO below.
const REPO = 'ace-squadron'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${REPO}/` : '/',
  server: { host: true },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: 'Ace Squadron',
        short_name: 'Ace Sqn',
        description: 'An original 1942-inspired vertical shoot-em-up.',
        theme_color: '#0b1f3a',
        background_color: '#0b1f3a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      devOptions: { enabled: false }
    })
  ]
}))
