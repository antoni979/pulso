<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

defineProps<{
  isIOS: boolean
}>()

const emit = defineEmits<{
  dismiss: []
}>()
</script>

<template>
  <Transition name="slide-up">
    <div class="install-prompt-overlay">
      <div class="install-prompt">
        <button @click="emit('dismiss')" class="close-btn" aria-label="Cerrar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="icon-wrapper">
          <div class="app-icon">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="60" height="60" rx="13" fill="url(#gradient)"/>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="60" y2="60">
                  <stop offset="0%" stop-color="#8b5cf6"/>
                  <stop offset="50%" stop-color="#ec4899"/>
                  <stop offset="100%" stop-color="#f97316"/>
                </linearGradient>
              </defs>
              <path d="M15 30 L22 20 L28 30 L34 15 L40 25 L46 20"
                    stroke="white" stroke-width="3" fill="none"
                    stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="30" cy="40" r="3" fill="white"/>
            </svg>
          </div>
        </div>

        <h3 class="title">Instala Pulso</h3>
        <p class="description">
          Accede más rápido a tu seguimiento nutricional. Instala Pulso en tu pantalla de inicio.
        </p>

        <div v-if="isIOS" class="instructions-ios">
          <p class="step">Para instalar:</p>
          <ol class="steps-list">
            <li>
              <span class="step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              Toca el botón <strong>Compartir</strong> en Safari
            </li>
            <li>
              <span class="step-icon">+</span>
              Selecciona <strong>"Añadir a pantalla de inicio"</strong>
            </li>
            <li>
              <span class="step-icon">✓</span>
              Confirma y listo
            </li>
          </ol>
        </div>

        <div v-else class="cta-android">
          <button @click="emit('dismiss')" class="btn-maybe-later">
            Quizás más tarde
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.install-prompt-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 1rem;
  pointer-events: none;
}

.install-prompt {
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.15);
  padding: 1.5rem;
  position: relative;
  pointer-events: all;
  max-width: 500px;
  margin: 0 auto;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.icon-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.app-icon {
  width: 60px;
  height: 60px;
  border-radius: 13px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 0.5rem;
}

.description {
  font-size: 0.95rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.instructions-ios {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 1rem;
  padding: 1.25rem;
}

.step {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.steps-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  color: #4b5563;
}

.step-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  background: white;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
  color: #8b5cf6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.steps-list strong {
  color: #111827;
  font-weight: 600;
}

.cta-android {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-maybe-later {
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  border: 2px solid #e5e7eb;
  background: white;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-maybe-later:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

/* Animación slide-up */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}
</style>
