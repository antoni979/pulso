<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' }, // YYYY-MM-DD of Monday
  showModal: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'update:showModal']);

const currentDate = ref(new Date());
const selectedMonday = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Get Monday of the week for a given date
const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

// Get the weeks for the current month
const weeks = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = getMonday(firstDay);
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (7 - endDate.getDay()) % 7); // next Sunday

  const weeksArray = [];
  let currentWeekStart = new Date(startDate);

  while (currentWeekStart <= endDate) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      week.push({
        date: day,
        dayNumber: day.getDate(),
        isCurrentMonth: day.getMonth() === month,
        monday: getMonday(day).toISOString().slice(0, 10)
      });
    }
    weeksArray.push(week);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return weeksArray;
});

// Check if a week is selected
const isWeekSelected = (monday) => {
  return selectedMonday.value === monday;
};

// Select a week
const selectWeek = (monday) => {
  selectedMonday.value = monday;
  emit('update:showModal', false); // Close modal after selection
};

// Close modal
const closeModal = () => {
  emit('update:showModal', false);
};

// Navigation
const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
};

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
};

const prevYear = () => {
  currentDate.value = new Date(currentDate.value.getFullYear() - 1, currentDate.value.getMonth(), 1);
};

const nextYear = () => {
  currentDate.value = new Date(currentDate.value.getFullYear() + 1, currentDate.value.getMonth(), 1);
};

// Month and year display
const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const currentMonthName = computed(() => monthNames[currentDate.value.getMonth()]);
const currentYear = computed(() => currentDate.value.getFullYear());

// Initialize to current week if no value
onMounted(() => {
  if (!selectedMonday.value) {
    const today = new Date();
    selectedMonday.value = getMonday(today).toISOString().slice(0, 10);
  }
});
</script>

<template>
  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="text-lg font-semibold text-gray-900">Seleccionar Semana</h3>
        <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Calendar Content -->
      <div class="p-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <button @click="prevYear" class="text-gray-600 hover:text-gray-800">&laquo;</button>
          <button @click="prevMonth" class="text-gray-600 hover:text-gray-800">&lsaquo;</button>
          <h3 class="text-lg font-semibold">{{ currentMonthName }} {{ currentYear }}</h3>
          <button @click="nextMonth" class="text-gray-600 hover:text-gray-800">&rsaquo;</button>
          <button @click="nextYear" class="text-gray-600 hover:text-gray-800">&raquo;</button>
        </div>

        <!-- Days of week header -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          <div v-for="day in ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']" :key="day" class="text-center text-sm font-medium text-gray-700 py-2">
            {{ day }}
          </div>
        </div>

        <!-- Calendar grid -->
        <div class="grid gap-1">
          <div
            v-for="(week, weekIndex) in weeks"
            :key="weekIndex"
            :class="[
              'grid grid-cols-7 gap-1 cursor-pointer rounded hover:bg-gray-100 transition-colors',
              isWeekSelected(week[0].monday) ? 'bg-emerald-100 ring-2 ring-emerald-500' : ''
            ]"
            @click="selectWeek(week[0].monday)"
          >
            <div
              v-for="day in week"
              :key="day.date.toISOString()"
              :class="[
                'text-center py-2 text-sm',
                day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
                'hover:bg-gray-200 rounded'
              ]"
            >
              {{ day.dayNumber }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>