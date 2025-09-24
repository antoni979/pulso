<script setup>
import DietItem from './DietItem.vue';

defineProps({
  mealName: { type: String, required: true },
  mealItems: { type: Array, required: true },
});
const emit = defineEmits(['add-item', 'edit-item', 'delete-item']);

const calculateCalories = (items) => {
  if (!items || items.length === 0) return 0;
  return items.reduce((total, item) => {
    if (!item.alimento) return total;
    return total + (item.alimento.calorias / item.alimento.tamano_porcion) * item.cantidad;
  }, 0).toFixed(0);
};
</script>

<template>
  <div class="bg-slate-50 p-3 rounded-lg transition-all duration-300 hover:shadow-md hover:bg-slate-100">
    <div class="flex justify-between items-center">
      <h4 class="font-semibold capitalize text-sm text-gray-700">{{ mealName }}</h4>
      <span class="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full transition-colors duration-200 hover:bg-emerald-200">
        {{ calculateCalories(mealItems) }} kcal
      </span>
    </div>
    <ul class="mt-3 text-xs space-y-1 min-h-[20px]">
      <DietItem
        v-for="item in mealItems"
        :key="item.id"
        :item="item"
        @edit="itemToEdit => emit('edit-item', itemToEdit)"
        @delete="itemToDelete => emit('delete-item', itemToDelete)"
      />
    </ul>
    <!-- Emitimos una señal simple, sin datos -->
    <button @click="emit('add-item')" class="mt-3 w-full text-center text-emerald-600 text-xs hover:underline font-medium transition-colors duration-200 hover:text-emerald-700">
      + Añadir alimento
    </button>
  </div>
</template>