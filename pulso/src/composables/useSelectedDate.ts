import { ref, computed } from 'vue'

// Estado compartido global para la fecha seleccionada
const selectedDate = ref<Date>(new Date())

export function useSelectedDate() {
  // Verificar si es hoy
  const isToday = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selected = new Date(selectedDate.value)
    selected.setHours(0, 0, 0, 0)
    return today.getTime() === selected.getTime()
  })

  // Verificar si es ayer
  const isYesterday = computed(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const selected = new Date(selectedDate.value)
    selected.setHours(0, 0, 0, 0)
    return yesterday.getTime() === selected.getTime()
  })

  // Formato legible de la fecha
  const dateLabel = computed(() => {
    if (isToday.value) return 'Hoy'
    if (isYesterday.value) return 'Ayer'

    const selected = new Date(selectedDate.value)
    return selected.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  })

  // Setear fecha específica
  function setDate(date: Date) {
    selectedDate.value = new Date(date)
    selectedDate.value.setHours(0, 0, 0, 0)
  }

  // Ir a hoy
  function goToToday() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDate.value = today
  }

  // Ir a ayer
  function goToYesterday() {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    selectedDate.value = yesterday
  }

  // Obtener inicio y fin del día seleccionado (útil para queries)
  const selectedDateRange = computed(() => {
    const start = new Date(selectedDate.value)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { start, end }
  })

  return {
    selectedDate,
    isToday,
    isYesterday,
    dateLabel,
    selectedDateRange,
    setDate,
    goToToday,
    goToYesterday
  }
}
