// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'

console.log('✅ 1. main.js: Script de entrada ejecutándose.');

const app = createApp(App)

app.use(createPinia())

console.log('✅ 2. main.js: App creada y Pinia configurado. A punto de montar en #app.');

app.mount('#app')

console.log('✅ 3. main.js: App montada con éxito.');