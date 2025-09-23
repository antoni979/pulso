import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// URL de tu proyecto de Supabase para la CSP
const supabaseUrl = 'https://goroantqmdwnodzbimbn.supabase.co';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'NutriApp PWA',
        short_name: 'NutriApp',
        description: 'Tu aplicación de seguimiento nutricional.',
        theme_color: '#10b981', // Un verde esmeralda
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    }),
  ],
  // --- SECCIÓN CORREGIDA PARA SOLUCIONAR EL ERROR CSP Y LA PANTALLA EN BLANCO ---
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval'", // Necesario para el dev server de Vite
        "style-src 'self' 'unsafe-inline'", // Permite estilos en línea
        "img-src 'self' data:",
        // LA LÍNEA MÁS IMPORTANTE Y CORREGIDA:
        `connect-src 'self' ${supabaseUrl} wss://${new URL(supabaseUrl).hostname}`
      ].join('; ')
    }
  }
})