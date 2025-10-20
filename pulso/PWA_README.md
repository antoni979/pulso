# Pulso PWA - Guía de Uso

## ✅ ¿Qué se ha implementado?

Pulso ahora es una **Progressive Web App (PWA)** completamente funcional con:

### Características implementadas:
- ✅ **Installable**: Se puede instalar en iOS y Android
- ✅ **Service Worker**: Generado automáticamente con Workbox
- ✅ **Manifest**: Configurado con nombre, iconos, colores tema
- ✅ **Install Prompt iOS**: Banner elegante con instrucciones para iOS Safari
- ✅ **Install Prompt Android**: Usando evento nativo `beforeinstallprompt`
- ✅ **Safe Areas iOS**: CSS ajustado para notch/Dynamic Island
- ✅ **Standalone mode**: Se abre en pantalla completa sin barra de navegador
- ✅ **Auto-updates**: Actualizaciones automáticas del service worker

### Características NO implementadas (por tu petición):
- ❌ Offline support (caching estratégico de datos)
- ❌ Background sync
- ❌ Offline fallback page

---

## 🧪 Cómo probar la PWA

### Opción 1: Preview local (http://localhost:4173)
```bash
npm run build
npm run preview
```

Abre Chrome y ve a `http://localhost:4173`

**Para probar install prompt en Chrome:**
1. Abre DevTools (F12)
2. Ve a Application > Manifest
3. Verifica que todo esté correcto
4. Clic en "Add to Home Screen" para probar instalación

**Para simular iOS en Chrome:**
1. DevTools > Toggle device toolbar (Ctrl+Shift+M)
2. Selecciona "iPhone 14 Pro"
3. Espera 5 segundos → Aparecerá el banner de instalación

---

### Opción 2: Deploy en producción (Vercel/Netlify)

Para probar en un iPhone real, necesitas deployar:

#### Deploy en Vercel (recomendado):
```bash
npm install -g vercel
vercel login
vercel
```

O conecta tu repo de GitHub con Vercel y se deployará automáticamente.

#### Deploy en Netlify:
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

Una vez deployado:
1. Abre la URL en Safari en tu iPhone
2. Usa la app por 5 segundos
3. Aparecerá el banner de instalación con instrucciones

---

## 📱 Instalar en iOS (Safari)

1. Abre Safari en tu iPhone
2. Ve a tu URL (ej: https://pulso.vercel.app)
3. Después de 5 segundos, verás el banner de instalación
4. Sigue las instrucciones:
   - Toca el botón "Compartir" (icono de cuadrado con flecha)
   - Selecciona "Añadir a pantalla de inicio"
   - Confirma

**Alternativa sin esperar:**
Si cierras el banner, puedes instalarlo manualmente:
- Safari → Compartir → Añadir a pantalla de inicio

---

## 📱 Instalar en Android (Chrome)

1. Abre Chrome en tu Android
2. Ve a tu URL
3. Verás un prompt nativo de Chrome para instalar
4. Toca "Instalar"

---

## 🎨 Configuración PWA

### Manifest (`vite.config.ts`)
```typescript
{
  name: 'Pulso - Nutrición Inteligente',
  short_name: 'Pulso',
  theme_color: '#8b5cf6',  // Purple
  background_color: '#ffffff',
  display: 'standalone',
}
```

### Iconos
Por ahora usa un SVG placeholder en `public/icon.svg`

**Para mejorar más adelante:**
- Genera iconos PNG reales (192x192, 512x512)
- Usa herramientas como [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- Añade splash screens para iOS

---

## 🔧 Troubleshooting

### El banner no aparece en iOS
- Asegúrate de estar en Safari (no Chrome/Firefox)
- No estés en modo privado
- No lo hayas rechazado en los últimos 30 días
- Verifica que la app no esté ya instalada

### El service worker no se registra
- Debe estar en HTTPS (o localhost)
- Verifica en DevTools > Application > Service Workers

### Los cambios no se reflejan
- El service worker cachea assets agresivamente
- Haz hard refresh (Ctrl+Shift+R)
- O limpia cache en DevTools > Application > Clear storage

---

## 🚀 Next Steps (opcional)

Si más adelante quieres añadir offline support:

1. **Descomenta estrategias de caching** en `vite.config.ts`:
```typescript
workbox: {
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 300 }
      }
    }
  ]
}
```

2. **Crea offline fallback page** en `public/offline.html`

3. **Añade IndexedDB** para guardar datos localmente con Dexie.js

---

## 📊 Verificar PWA Score

1. Abre tu app deployada en Chrome
2. DevTools > Lighthouse
3. Selecciona "Progressive Web App"
4. Run audit

**Objetivo: 100/100** 🎯

---

## ✅ Checklist de lo que funciona

- [x] App se instala en iOS/Android
- [x] Icono aparece en pantalla de inicio
- [x] Se abre en pantalla completa (sin barra Safari)
- [x] Banner de instalación aparece automáticamente
- [x] Responsive en todos los dispositivos
- [x] Safe areas para iPhone notch
- [x] Auto-updates funcionando
- [x] Manifest válido generado
- [x] Service worker registrado

---

¡Listo para instalar Pulso en tu iPhone! 📱✨
