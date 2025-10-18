<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMeasurementsStore } from '@/stores/measurements'
import { useRouter } from 'vue-router'
import type { Measurement } from '@/lib/supabase'

const measurementsStore = useMeasurementsStore()
const router = useRouter()

const showAddForm = ref(false)
const editingId = ref<string | null>(null)

const measurementForm = ref({
  measurement_date: new Date().toISOString().split('T')[0],
  weight: null as number | null,
  chest: null as number | null,
  waist: null as number | null,
  hips: null as number | null,
  thigh: null as number | null,
  arm: null as number | null,
  notes: ''
})

onMounted(async () => {
  await measurementsStore.loadMeasurements()
})

const latestWeight = computed(() => {
  return measurementsStore.latestMeasurement?.weight || null
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

const getWeightDifference = (currentMeasurement: Measurement, index: number) => {
  if (index === measurementsStore.sortedMeasurements.length - 1) {
    return null
  }

  const previousMeasurement = measurementsStore.sortedMeasurements[index + 1]

  if (!previousMeasurement || !currentMeasurement.weight || !previousMeasurement.weight) {
    return null
  }

  const diff = currentMeasurement.weight - previousMeasurement.weight
  return diff
}

const handleAdd = async () => {
  if (!measurementForm.value.weight || !measurementForm.value.measurement_date) {
    alert('Por favor ingresa al menos el peso y la fecha')
    return
  }

  // Asegurar que measurement_date nunca sea undefined
  const dataToSave: Omit<Measurement, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
    measurement_date: measurementForm.value.measurement_date,
    weight: measurementForm.value.weight,
    chest: measurementForm.value.chest,
    waist: measurementForm.value.waist,
    hips: measurementForm.value.hips,
    thigh: measurementForm.value.thigh,
    arm: measurementForm.value.arm,
    notes: measurementForm.value.notes || null
  }

  if (editingId.value) {
    await measurementsStore.updateMeasurement(editingId.value, dataToSave)
    editingId.value = null
  } else {
    await measurementsStore.addMeasurement(dataToSave)
  }

  resetForm()
  showAddForm.value = false
}

const handleEdit = (measurement: Measurement) => {
  editingId.value = measurement.id
  measurementForm.value = {
    measurement_date: measurement.measurement_date,
    weight: measurement.weight,
    chest: measurement.chest,
    waist: measurement.waist,
    hips: measurement.hips,
    thigh: measurement.thigh,
    arm: measurement.arm,
    notes: measurement.notes || ''
  }
  showAddForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleDelete = async (id: string) => {
  if (confirm('¿Estás seguro de eliminar esta medición?')) {
    await measurementsStore.deleteMeasurement(id)
  }
}

const resetForm = () => {
  measurementForm.value = {
    measurement_date: new Date().toISOString().split('T')[0],
    weight: null,
    chest: null,
    waist: null,
    hips: null,
    thigh: null,
    arm: null,
    notes: ''
  }
  editingId.value = null
}

const cancelEdit = () => {
  resetForm()
  showAddForm.value = false
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-white">
    <!-- Header -->
    <header class="bg-white/90 backdrop-blur-xl border-b-2 border-primary-100 sticky top-0 z-20 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              @click="goBack"
              class="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
            >
              <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span class="text-2xl">📏</span>
            </div>
            <div>
              <h1 class="text-2xl font-black text-gray-900 tracking-tight">Mediciones</h1>
              <p class="text-sm text-gray-600 font-medium">Seguimiento corporal</p>
            </div>
          </div>
          <button
            @click="showAddForm = !showAddForm"
            class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-sm rounded-xl hover:from-primary-700 hover:to-primary-600 shadow-lg transition-all transform hover:scale-105"
          >
            + Nueva Medición
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Add/Edit Measurement Form -->
      <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 transform -translate-y-4"
        enter-to-class="opacity-100 transform translate-y-0"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 transform translate-y-0"
        leave-to-class="opacity-0 transform -translate-y-4"
      >
        <div v-if="showAddForm" class="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-primary-100">
          <h3 class="text-2xl font-bold text-gray-900 mb-6">
            {{ editingId ? 'Editar Medición' : 'Nueva Medición' }}
          </h3>

          <form @submit.prevent="handleAdd" class="space-y-6">
            <!-- Date and Weight -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-800 mb-2">Fecha</label>
                <input
                  v-model="measurementForm.measurement_date"
                  type="date"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium transition-all"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-800 mb-2">Peso (kg) *</label>
                <input
                  v-model.number="measurementForm.weight"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="75.5"
                  class="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-bold text-lg transition-all"
                  required
                />
              </div>
            </div>

            <!-- Body Measurements -->
            <div>
              <h4 class="text-lg font-bold text-gray-800 mb-4">Medidas Corporales (cm)</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">Pecho</label>
                  <input
                    v-model.number="measurementForm.chest"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="95"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">Cintura</label>
                  <input
                    v-model.number="measurementForm.waist"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="80"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">Cadera</label>
                  <input
                    v-model.number="measurementForm.hips"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="100"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">Muslo</label>
                  <input
                    v-model.number="measurementForm.thigh"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="55"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">Brazo</label>
                  <input
                    v-model.number="measurementForm.arm"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="35"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium transition-all"
                  />
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-sm font-bold text-gray-800 mb-2">Notas</label>
              <textarea
                v-model="measurementForm.notes"
                rows="3"
                placeholder="Observaciones adicionales..."
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium transition-all resize-none"
              ></textarea>
            </div>

            <!-- Buttons -->
            <div class="flex space-x-4">
              <button
                type="submit"
                class="flex-1 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl hover:from-primary-700 hover:to-primary-600 shadow-lg transition-all transform hover:scale-[1.02]"
              >
                {{ editingId ? 'Actualizar Medición' : 'Guardar Medición' }}
              </button>
              <button
                type="button"
                @click="cancelEdit"
                class="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </transition>

      <!-- Latest Stats Card -->
      <div v-if="measurementsStore.latestMeasurement" class="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-primary-100">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Estadísticas Actuales</h2>
          <span class="text-4xl">⚡</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <!-- Weight -->
          <div class="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-5 border-2 border-primary-200">
            <p class="text-sm font-bold text-primary-700 uppercase tracking-wide mb-2">Peso Actual</p>
            <p class="text-4xl font-black text-primary-600">{{ latestWeight?.toFixed(1) || '-' }}</p>
            <p class="text-sm text-primary-600 font-semibold mt-1">kg</p>
          </div>

          <!-- Chest -->
          <div v-if="measurementsStore.latestMeasurement.chest" class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200">
            <p class="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">Pecho</p>
            <p class="text-3xl font-black text-blue-600">{{ measurementsStore.latestMeasurement.chest.toFixed(1) }}</p>
            <p class="text-sm text-blue-600 font-semibold mt-1">cm</p>
          </div>

          <!-- Waist -->
          <div v-if="measurementsStore.latestMeasurement.waist" class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-200">
            <p class="text-sm font-bold text-orange-700 uppercase tracking-wide mb-2">Cintura</p>
            <p class="text-3xl font-black text-orange-600">{{ measurementsStore.latestMeasurement.waist.toFixed(1) }}</p>
            <p class="text-sm text-orange-600 font-semibold mt-1">cm</p>
          </div>

          <!-- Hips -->
          <div v-if="measurementsStore.latestMeasurement.hips" class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-2 border-purple-200">
            <p class="text-sm font-bold text-purple-700 uppercase tracking-wide mb-2">Cadera</p>
            <p class="text-3xl font-black text-purple-600">{{ measurementsStore.latestMeasurement.hips.toFixed(1) }}</p>
            <p class="text-sm text-purple-600 font-semibold mt-1">cm</p>
          </div>
        </div>

        <div v-if="measurementsStore.latestMeasurement.thigh || measurementsStore.latestMeasurement.arm" class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <!-- Thigh -->
          <div v-if="measurementsStore.latestMeasurement.thigh" class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200">
            <p class="text-sm font-bold text-green-700 uppercase tracking-wide mb-2">Muslo</p>
            <p class="text-3xl font-black text-green-600">{{ measurementsStore.latestMeasurement.thigh.toFixed(1) }}</p>
            <p class="text-sm text-green-600 font-semibold mt-1">cm</p>
          </div>

          <!-- Arm -->
          <div v-if="measurementsStore.latestMeasurement.arm" class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border-2 border-yellow-200">
            <p class="text-sm font-bold text-yellow-700 uppercase tracking-wide mb-2">Brazo</p>
            <p class="text-3xl font-black text-yellow-600">{{ measurementsStore.latestMeasurement.arm.toFixed(1) }}</p>
            <p class="text-sm text-yellow-600 font-semibold mt-1">cm</p>
          </div>
        </div>
      </div>

      <!-- Measurements History -->
      <div class="bg-white rounded-2xl shadow-xl p-8 border-2 border-primary-100">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Historial de Mediciones</h2>

        <div v-if="measurementsStore.sortedMeasurements.length === 0" class="text-center py-16">
          <span class="text-7xl mb-6 block">📊</span>
          <p class="text-gray-600 text-lg font-medium">No hay mediciones registradas</p>
          <p class="text-sm text-gray-500 mt-2">Agrega tu primera medición para empezar a hacer seguimiento</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="(measurement, index) in measurementsStore.sortedMeasurements"
            :key="measurement.id"
            class="border-2 border-gray-100 hover:border-primary-200 bg-gray-50 hover:bg-primary-50/50 rounded-xl p-6 transition-all group"
          >
            <div class="flex items-start justify-between mb-4">
              <div>
                <div class="flex items-center space-x-3 mb-2">
                  <h4 class="text-lg font-bold text-gray-900">{{ formatDate(measurement.measurement_date) }}</h4>
                  <span
                    v-if="getWeightDifference(measurement, index) !== null"
                    :class="{
                      'text-green-600 bg-green-100': getWeightDifference(measurement, index)! < 0,
                      'text-red-600 bg-red-100': getWeightDifference(measurement, index)! > 0,
                      'text-gray-600 bg-gray-100': getWeightDifference(measurement, index) === 0
                    }"
                    class="px-3 py-1 rounded-lg text-sm font-bold"
                  >
                    {{ getWeightDifference(measurement, index)! > 0 ? '↑' : getWeightDifference(measurement, index)! < 0 ? '↓' : '=' }}
                    {{ Math.abs(getWeightDifference(measurement, index)!).toFixed(1) }}kg
                  </span>
                </div>

                <div class="flex items-center space-x-6">
                  <div class="flex items-baseline space-x-2">
                    <span class="text-3xl font-black text-primary-600">{{ measurement.weight?.toFixed(1) || '-' }}</span>
                    <span class="text-lg text-gray-600 font-semibold">kg</span>
                  </div>

                  <div v-if="measurement.chest" class="text-sm">
                    <span class="text-gray-600 font-medium">Pecho:</span>
                    <span class="font-bold text-gray-900 ml-1">{{ measurement.chest.toFixed(1) }}cm</span>
                  </div>

                  <div v-if="measurement.waist" class="text-sm">
                    <span class="text-gray-600 font-medium">Cintura:</span>
                    <span class="font-bold text-gray-900 ml-1">{{ measurement.waist.toFixed(1) }}cm</span>
                  </div>

                  <div v-if="measurement.hips" class="text-sm">
                    <span class="text-gray-600 font-medium">Cadera:</span>
                    <span class="font-bold text-gray-900 ml-1">{{ measurement.hips.toFixed(1) }}cm</span>
                  </div>

                  <div v-if="measurement.thigh" class="text-sm">
                    <span class="text-gray-600 font-medium">Muslo:</span>
                    <span class="font-bold text-gray-900 ml-1">{{ measurement.thigh.toFixed(1) }}cm</span>
                  </div>

                  <div v-if="measurement.arm" class="text-sm">
                    <span class="text-gray-600 font-medium">Brazo:</span>
                    <span class="font-bold text-gray-900 ml-1">{{ measurement.arm.toFixed(1) }}cm</span>
                  </div>
                </div>

                <p v-if="measurement.notes" class="text-sm text-gray-600 mt-3 font-medium italic">
                  "{{ measurement.notes }}"
                </p>
              </div>

              <div class="flex space-x-2">
                <button
                  @click="handleEdit(measurement)"
                  class="px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-100 font-semibold text-sm transition rounded-lg"
                >
                  Editar
                </button>
                <button
                  @click="handleDelete(measurement.id)"
                  class="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-100 font-semibold text-sm transition rounded-lg"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
