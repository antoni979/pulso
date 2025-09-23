// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia' // 1. La importación es igual
import './style.css'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia()) // 2. La forma de usarlo es igual, puedes hacerlo en una línea
app.mount('#app')